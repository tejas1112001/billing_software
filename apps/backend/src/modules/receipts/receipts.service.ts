import { prisma } from '../../lib/prisma';
import { buildPaginationArgs, buildPaginatedResponse } from '../../utils/paginate';
import { createLog } from '../user-logs/userLog.service';
import { generateReceiptNumber } from '../../utils/receiptNumber';
import { PaymentMode } from '@prisma/client';
import { AppError } from '../../middleware/errorHandler';
import { Request } from 'express';

export async function createReceipt(
  userId: string,
  storeId: string,
  paymentMethodId: string,
  amount: number,
  dateStr: string
) {
  const date = new Date(dateStr);

  // Validate payment method
  const paymentMethod = await prisma.paymentMethod.findUnique({ where: { id: paymentMethodId } });
  if (!paymentMethod || !paymentMethod.isActive) {
    throw new AppError(400, 'Invalid or inactive payment method');
  }

  // Map payment method name to legacy enum (CASH/UPI → enum, otherwise default CASH)
  const nameUpper = paymentMethod.name.toUpperCase();
  const paymentMode: PaymentMode =
    nameUpper === 'UPI' ? PaymentMode.UPI : PaymentMode.CASH;

  const receipt = await prisma.$transaction(async (tx) => {
    const receiptNumber = await generateReceiptNumber(tx, storeId, date);

    // Fetch store name to use as the customer name field (nullable migration)
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
        // customerName left null — store name stored in ledger
      },
      include: { store: true, paymentMethod: true },
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

export async function list(query: Request['query']) {
  const { page, pageSize, skip, take } = buildPaginationArgs(query);
  const storeId = query.storeId ? String(query.storeId) : undefined;
  const userId = query.userId ? String(query.userId) : undefined;
  const dateFrom = query.dateFrom ? new Date(String(query.dateFrom)) : undefined;
  const dateTo = query.dateTo ? new Date(String(query.dateTo)) : undefined;

  const where: Record<string, unknown> = {};
  if (storeId) where.storeId = storeId;
  if (userId) where.userId = userId;
  if (dateFrom || dateTo) {
    where.date = {
      ...(dateFrom ? { gte: dateFrom } : {}),
      ...(dateTo ? { lte: dateTo } : {}),
    };
  }

  const [data, total] = await Promise.all([
    prisma.receipt.findMany({
      where,
      skip,
      take,
      orderBy: { date: 'desc' },
      include: {
        store: { select: { id: true, name: true } },
        user: { select: { id: true, username: true } },
        paymentMethod: { select: { id: true, name: true } },
      },
    }),
    prisma.receipt.count({ where }),
  ]);

  return buildPaginatedResponse(data, total, page, pageSize);
}

export async function getById(id: string) {
  return prisma.receipt.findUnique({
    where: { id },
    include: {
      store: true,
      user: { select: { id: true, username: true } },
      paymentMethod: { select: { id: true, name: true } },
    },
  });
}
