import { Role } from '@prisma/client';
import { prisma } from '../../lib/prisma';
import { buildPaginationArgs, buildPaginatedResponse } from '../../utils/paginate';
import { createLog } from '../user-logs/userLog.service';
import { AppError } from '../../middleware/errorHandler';
import { generateBillNumber } from '../../utils/billNumber';
import {
  AccessScope,
  assertOrderOwnership,
  resolveListUserId,
} from '../../utils/accessScope';
import { Request } from 'express';

type OrderItemInput = { productId: string; quantity: number };

const listSelect = {
  id: true,
  billNumber: true,
  totalAmount: true,
  createdAt: true,
  storeId: true,
  userId: true,
  store: { select: { id: true, name: true } },
  user: { select: { id: true, username: true, operatorType: true } },
  _count: { select: { orderItems: true } },
} as const;

async function resolveOrderItems(
  tx: Parameters<Parameters<typeof prisma.$transaction>[0]>[0],
  userId: string,
  items: OrderItemInput[],
  adjustStock: 'decrement' | 'none'
) {
  const user = await tx.user.findUnique({
    where: { id: userId },
    select: { operatorType: true },
  });

  let totalAmount = 0;
  const orderItemsData: Array<{
    productId: string;
    quantity: number;
    unitPrice: number;
    lineTotal: number;
  }> = [];

  for (const item of items) {
    const product = await tx.product.findUnique({
      where: { id: item.productId },
      select: {
        id: true,
        modelName: true,
        availableQty: true,
        cashPrice: true,
        creditPrice: true,
      },
    });
    if (!product) throw new AppError(404, `Product ${item.productId} not found`);

    if (adjustStock === 'decrement') {
      const updated = await tx.product.updateMany({
        where: {
          id: item.productId,
          availableQty: { gte: item.quantity },
        },
        data: { availableQty: { decrement: item.quantity } },
      });

      if (updated.count === 0) {
        const current = await tx.product.findUnique({
          where: { id: item.productId },
          select: { availableQty: true, modelName: true },
        });
        throw new AppError(
          409,
          `Insufficient stock for "${current?.modelName ?? item.productId}". ` +
            `Available: ${current?.availableQty ?? 0}, requested: ${item.quantity}`
        );
      }
    }

    const unitPrice =
      user?.operatorType === 'CASH'
        ? Number(product.cashPrice)
        : Number(product.creditPrice);
    const lineTotal = unitPrice * item.quantity;
    totalAmount += lineTotal;
    orderItemsData.push({
      productId: item.productId,
      quantity: item.quantity,
      unitPrice,
      lineTotal,
    });
  }

  return { totalAmount, orderItemsData };
}

export async function createOrder(userId: string, storeId: string, items: OrderItemInput[]) {
  const now = new Date();

  const order = await prisma.$transaction(async (tx) => {
    const billNumber = await generateBillNumber(tx);

    const store = await tx.store.findUnique({
      where: { id: storeId },
      select: { name: true },
    });
    if (!store) throw new AppError(404, 'Store not found');

    const { totalAmount, orderItemsData } = await resolveOrderItems(tx, userId, items, 'decrement');

    const newOrder = await tx.order.create({
      data: {
        billNumber,
        storeId,
        userId,
        totalAmount,
        orderItems: { create: orderItemsData },
      },
      include: {
        orderItems: { include: { product: true } },
        store: true,
        user: { select: { id: true, username: true, operatorType: true } },
      },
    });

    await tx.ledgerEntry.create({
      data: {
        storeId,
        voucherType: 'ORDER',
        amount: totalAmount,
        customerName: store.name,
        orderId: newOrder.id,
        date: now,
      },
    });

    return newOrder;
  });

  await createLog(userId, 'BILL_CREATION', { billNumber: order.billNumber });
  return order;
}

export async function updateOrder(
  id: string,
  userId: string,
  items: OrderItemInput[],
  scope: AccessScope
) {
  await assertOrderOwnership(id, scope);

  const order = await prisma.$transaction(async (tx) => {
    const existing = await tx.order.findUnique({
      where: { id },
      include: { orderItems: true, ledgerEntry: true },
    });
    if (!existing) throw new AppError(404, 'Order not found');

    for (const item of existing.orderItems) {
      await tx.product.update({
        where: { id: item.productId },
        data: { availableQty: { increment: item.quantity } },
      });
    }

    const pricingUserId = scope.isAdmin ? existing.userId : userId;
    const { totalAmount, orderItemsData } = await resolveOrderItems(
      tx,
      pricingUserId,
      items,
      'decrement'
    );

    await tx.orderItem.deleteMany({ where: { orderId: id } });

    const updatedOrder = await tx.order.update({
      where: { id },
      data: {
        totalAmount,
        orderItems: { create: orderItemsData },
      },
      include: {
        orderItems: { include: { product: true } },
        store: true,
        user: { select: { id: true, username: true, operatorType: true } },
      },
    });

    if (existing.ledgerEntry) {
      await tx.ledgerEntry.update({
        where: { id: existing.ledgerEntry.id },
        data: { amount: totalAmount },
      });
    }

    return updatedOrder;
  });

  await createLog(userId, 'BILL_CREATION', { billNumber: order.billNumber, action: 'updated' });
  return order;
}

export async function deleteOrder(id: string, userId: string, scope: AccessScope) {
  await assertOrderOwnership(id, scope);

  const order = await prisma.$transaction(async (tx) => {
    const existing = await tx.order.findUnique({
      where: { id },
      include: { orderItems: true, ledgerEntry: true },
    });
    if (!existing) throw new AppError(404, 'Order not found');

    for (const item of existing.orderItems) {
      await tx.product.update({
        where: { id: item.productId },
        data: { availableQty: { increment: item.quantity } },
      });
    }

    if (existing.ledgerEntry) {
      await tx.ledgerEntry.delete({ where: { id: existing.ledgerEntry.id } });
    }

    await tx.order.delete({ where: { id } });
    return existing;
  });

  await createLog(userId, 'BILL_CREATION', { billNumber: order.billNumber, action: 'deleted' });
  return order;
}

export async function list(query: Request['query'], scope: AccessScope) {
  const { page, pageSize, skip, take } = buildPaginationArgs(query);
  const storeId = query.storeId ? String(query.storeId) : undefined;
  const userId = resolveListUserId(scope, query.userId ? String(query.userId) : undefined);
  const search = query.search ? String(query.search) : undefined;
  const sortBy = query.sortBy === 'billNumber' ? 'billNumber' : 'createdAt';
  const sortOrder = query.sortOrder === 'asc' ? 'asc' : 'desc';

  const where: Record<string, unknown> = {};
  if (storeId) where.storeId = storeId;
  if (userId) where.userId = userId;
  if (search) {
    where.OR = [
      { billNumber: { contains: search, mode: 'insensitive' } },
      { store: { name: { contains: search, mode: 'insensitive' } } },
      ...(scope.isAdmin
        ? [{ user: { username: { contains: search, mode: 'insensitive' } } }]
        : []),
    ];
  }

  const [rows, total] = await Promise.all([
    prisma.order.findMany({
      where,
      skip,
      take,
      orderBy: { [sortBy]: sortOrder },
      select: listSelect,
    }),
    prisma.order.count({ where }),
  ]);

  const data = rows.map(({ _count, ...row }) => ({
    ...row,
    itemCount: _count.orderItems,
  }));

  return buildPaginatedResponse(data, total, page, pageSize);
}

export async function getById(id: string, scope: AccessScope) {
  await assertOrderOwnership(id, scope);

  return prisma.order.findUnique({
    where: { id },
    include: {
      store: true,
      user: { select: { id: true, username: true, operatorType: true } },
      orderItems: { include: { product: { include: { images: { orderBy: { sortOrder: 'asc' } } } } } },
    },
  });
}

export async function getByIdForPdf(id: string, scope: AccessScope) {
  const order = await getById(id, scope);
  if (!order) throw new AppError(404, 'Order not found');
  return order;
}
