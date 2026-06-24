import { prisma } from '../../lib/prisma';
import { buildPaginationArgs, buildPaginatedResponse } from '../../utils/paginate';
import { createLog } from '../user-logs/userLog.service';
import { generateReceiptNumber } from '../../utils/receiptNumber';
import { PaymentMode } from '@prisma/client';
import { AppError } from '../../middleware/errorHandler';
import {
  AccessScope,
  assertReceiptOwnership,
  resolveListUserId,
} from '../../utils/accessScope';
import { Request } from 'express';

const listSelect = {
  id: true,
  receiptNumber: true,
  amount: true,
  date: true,
  createdAt: true,
  storeId: true,
  userId: true,
  store: { select: { id: true, name: true } },
  user: { select: { id: true, username: true, operatorType: true } },
  paymentMethod: { select: { id: true, name: true } },
} as const;

export async function createReceipt(
  userId: string,
  storeId: string,
  paymentMethodId: string,
  amount: number,
  dateStr: string
) {
  const date = new Date(dateStr);

  const paymentMethod = await prisma.paymentMethod.findUnique({ where: { id: paymentMethodId } });
  if (!paymentMethod || !paymentMethod.isActive) {
    throw new AppError(400, 'Invalid or inactive payment method');
  }

  const nameUpper = paymentMethod.name.toUpperCase();
  const paymentMode: PaymentMode = nameUpper === 'UPI' ? PaymentMode.UPI : PaymentMode.CASH;

  const receipt = await prisma.$transaction(async (tx) => {
    const receiptNumber = await generateReceiptNumber(tx, storeId, date);

    const store = await tx.store.findUnique({ where: { id: storeId }, select: { name: true } });
    if (!store) throw new AppError(404, 'Store not found');

    const newReceipt = await tx.receipt.create({
      data: {
        receiptNumber,
        storeId,
        userId,
        paymentMode,
        paymentMethodId,
        amount,
        date,
      },
      include: { store: true, paymentMethod: true, user: { select: { id: true, username: true } } },
    });

    await tx.ledgerEntry.create({
      data: {
        storeId,
        voucherType: 'RECEIPT',
        amount,
        customerName: store.name,
        receiptId: newReceipt.id,
        date,
      },
    });

    return newReceipt;
  });

  await createLog(userId, 'RECEIPT_CREATION', { receiptNumber: receipt.receiptNumber });
  return receipt;
}

export async function list(query: Request['query'], scope: AccessScope) {
  const { page, pageSize, skip, take } = buildPaginationArgs(query);
  const storeId = query.storeId ? String(query.storeId) : undefined;
  const userId = resolveListUserId(scope, query.userId ? String(query.userId) : undefined);
  const search = query.search ? String(query.search) : undefined;
  const dateFrom = query.dateFrom ? new Date(String(query.dateFrom)) : undefined;
  const dateTo = query.dateTo ? new Date(String(query.dateTo)) : undefined;
  const sortOrder = query.sortOrder === 'asc' ? 'asc' : 'desc';

  const where: Record<string, unknown> = {};
  if (storeId) where.storeId = storeId;
  if (userId) where.userId = userId;
  if (dateFrom || dateTo) {
    where.date = {
      ...(dateFrom ? { gte: dateFrom } : {}),
      ...(dateTo ? { lte: dateTo } : {}),
    };
  }
  if (search) {
    where.OR = [
      { receiptNumber: { contains: search, mode: 'insensitive' } },
      { store: { name: { contains: search, mode: 'insensitive' } } },
      ...(scope.isAdmin
        ? [{ user: { username: { contains: search, mode: 'insensitive' } } }]
        : []),
    ];
  }

  const [data, total] = await Promise.all([
    prisma.receipt.findMany({
      where,
      skip,
      take,
      orderBy: { date: sortOrder },
      select: listSelect,
    }),
    prisma.receipt.count({ where }),
  ]);

  return buildPaginatedResponse(data, total, page, pageSize);
}

export async function getById(id: string, scope: AccessScope) {
  await assertReceiptOwnership(id, scope);

  return prisma.receipt.findUnique({
    where: { id },
    include: {
      store: true,
      user: { select: { id: true, username: true, operatorType: true } },
      paymentMethod: { select: { id: true, name: true } },
    },
  });
}

export async function updateReceipt(
  id: string,
  userId: string,
  scope: AccessScope,
  data: { paymentMethodId: string; amount: number; dateStr: string }
) {
  await assertReceiptOwnership(id, scope);

  const date = new Date(data.dateStr);

  const paymentMethod = await prisma.paymentMethod.findUnique({
    where: { id: data.paymentMethodId },
  });
  if (!paymentMethod || !paymentMethod.isActive) {
    throw new AppError(400, 'Invalid or inactive payment method');
  }

  const nameUpper = paymentMethod.name.toUpperCase();
  const paymentMode: PaymentMode = nameUpper === 'UPI' ? PaymentMode.UPI : PaymentMode.CASH;

  const receipt = await prisma.$transaction(async (tx) => {
    const existing = await tx.receipt.findUnique({
      where: { id },
      include: { ledgerEntry: true },
    });
    if (!existing) throw new AppError(404, 'Receipt not found');

    const updated = await tx.receipt.update({
      where: { id },
      data: {
        paymentMethodId: data.paymentMethodId,
        paymentMode,
        amount: data.amount,
        date,
      },
      include: {
        store: true,
        paymentMethod: true,
        user: { select: { id: true, username: true, operatorType: true } },
      },
    });

    if (existing.ledgerEntry) {
      await tx.ledgerEntry.update({
        where: { id: existing.ledgerEntry.id },
        data: { amount: data.amount, date },
      });
    }

    return updated;
  });

  await createLog(userId, 'RECEIPT_CREATION', {
    receiptNumber: receipt.receiptNumber,
    action: 'updated',
  });
  return receipt;
}

export async function deleteReceipt(id: string, userId: string, scope: AccessScope) {
  await assertReceiptOwnership(id, scope);

  const receipt = await prisma.$transaction(async (tx) => {
    const existing = await tx.receipt.findUnique({
      where: { id },
      include: { ledgerEntry: true },
    });
    if (!existing) throw new AppError(404, 'Receipt not found');

    if (existing.ledgerEntry) {
      await tx.ledgerEntry.delete({ where: { id: existing.ledgerEntry.id } });
    }

    await tx.receipt.delete({ where: { id } });
    return existing;
  });

  await createLog(userId, 'RECEIPT_CREATION', {
    receiptNumber: receipt.receiptNumber,
    action: 'deleted',
  });
  return receipt;
}
