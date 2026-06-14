import { prisma } from '../../lib/prisma';
import { buildPaginationArgs, buildPaginatedResponse } from '../../utils/paginate';
import { createLog } from '../user-logs/userLog.service';
import { AppError } from '../../middleware/errorHandler';
import { generateBillNumber } from '../../utils/billNumber';
import { Request } from 'express';

export async function createOrder(
  userId: string,
  storeId: string,
  items: Array<{ productId: string; quantity: number }>
) {
  const now = new Date();

  // Retry logic to handle race conditions with bill number generation
  const maxRetries = 5;
  let lastError: Error | null = null;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const billNumber = await generateBillNumber(prisma, storeId, now);

      const order = await prisma.$transaction(async (tx) => {
        // CRITICAL: Atomic stock decrement with validation.
        // Using updateMany with WHERE availableQty >= requested.
        // If 0 rows updated → insufficient stock — eliminates race-condition oversell.
        for (const item of items) {
          const product = await tx.product.findUnique({
            where: { id: item.productId },
            select: { id: true, modelName: true, availableQty: true, nlc: true },
          });
          if (!product) throw new AppError(404, `Product ${item.productId} not found`);

          const updated = await tx.product.updateMany({
            where: {
              id: item.productId,
              availableQty: { gte: item.quantity }, // atomic guard
            },
            data: {
              availableQty: { decrement: item.quantity },
            },
          });

          if (updated.count === 0) {
            // Re-fetch to get current qty for the error message
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

        // Fetch store name to use instead of customer name
        const store = await tx.store.findUnique({
          where: { id: storeId },
          select: { name: true },
        });
        if (!store) throw new AppError(404, 'Store not found');

        // Compute totals
        let totalAmount = 0;
        const orderItemsData = [];
        for (const item of items) {
          const product = await tx.product.findUnique({
            where: { id: item.productId },
            select: { nlc: true },
          });
          if (!product) throw new AppError(404, 'Product not found');
          const unitPrice = Number(product.nlc);
          const lineTotal = unitPrice * item.quantity;
          totalAmount += lineTotal;
          orderItemsData.push({ productId: item.productId, quantity: item.quantity, unitPrice, lineTotal });
        }

        // Create order — customerName nullable, store name used in ledger
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
          },
        });

        // Ledger entry — use store name as identifier
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
    } catch (error: unknown) {
      const e = error as { code?: string; meta?: { target?: string[] } };
      if (e.code === 'P2002' && e.meta?.target?.includes('billNumber')) {
        lastError = error as Error;
        console.log(`[RETRY] Bill number collision on attempt ${attempt + 1}, retrying...`);
        await new Promise(resolve => setTimeout(resolve, 100 * Math.pow(2, attempt)));
        continue;
      }
      throw error;
    }
  }

  throw lastError || new Error('Failed to create order after multiple attempts');
}

export async function list(query: Request['query']) {
  const { page, pageSize, skip, take } = buildPaginationArgs(query);
  const storeId = query.storeId ? String(query.storeId) : undefined;
  const userId = query.userId ? String(query.userId) : undefined;

  const where: Record<string, unknown> = {};
  if (storeId) where.storeId = storeId;
  if (userId) where.userId = userId;

  const [data, total] = await Promise.all([
    prisma.order.findMany({
      where,
      skip,
      take,
      orderBy: { createdAt: 'desc' },
      include: {
        store: { select: { id: true, name: true } },
        user: { select: { id: true, username: true } },
        orderItems: { include: { product: { select: { id: true, modelName: true } } } },
      },
    }),
    prisma.order.count({ where }),
  ]);

  return buildPaginatedResponse(data, total, page, pageSize);
}

export async function getById(id: string) {
  return prisma.order.findUnique({
    where: { id },
    include: {
      store: true,
      user: { select: { id: true, username: true } },
      orderItems: { include: { product: true } },
    },
  });
}
