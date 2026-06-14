import { prisma } from '../../lib/prisma';
import { buildPaginationArgs, buildPaginatedResponse } from '../../utils/paginate';
import { Request } from 'express';

export async function getLedger(storeId: string, query: Request['query']) {
  const { page, pageSize, skip, take } = buildPaginationArgs(query);
  const search = query.search ? String(query.search) : undefined;
  const dateFrom = query.dateFrom ? new Date(String(query.dateFrom)) : undefined;
  const dateTo = query.dateTo ? new Date(String(query.dateTo)) : undefined;

  // Stored opening balance (base value set by admin)
  const openingBalanceRecord = await prisma.openingBalance.findUnique({ where: { storeId } });
  const storedOpeningBalance = openingBalanceRecord ? Number(openingBalanceRecord.amount) : 0;

  // Effective opening balance for the date range:
  // = stored OB + sum of all transactions BEFORE dateFrom
  // If no dateFrom, effective opening balance is just the stored OB
  let effectiveOpeningBalance = storedOpeningBalance;
  if (dateFrom) {
    const priorEntries = await prisma.ledgerEntry.findMany({
      where: { storeId, date: { lt: dateFrom } },
      orderBy: [{ date: 'asc' }, { createdAt: 'asc' }],
      select: { voucherType: true, amount: true },
    });
    for (const e of priorEntries) {
      if (e.voucherType === 'ORDER') effectiveOpeningBalance += Number(e.amount);
      else effectiveOpeningBalance -= Number(e.amount);
    }
  }

  const where: Record<string, unknown> = { storeId };
  if (search) {
    where.customerName = { contains: search, mode: 'insensitive' };
  }
  if (dateFrom || dateTo) {
    where.date = {
      ...(dateFrom ? { gte: dateFrom } : {}),
      ...(dateTo ? { lte: dateTo } : {}),
    };
  }

  const [entries, total] = await Promise.all([
    prisma.ledgerEntry.findMany({
      where,
      skip,
      take,
      orderBy: [{ date: 'asc' }, { createdAt: 'asc' }],
      include: {
        order: { select: { billNumber: true } },
        receipt: { select: { receiptNumber: true } },
      },
    }),
    prisma.ledgerEntry.count({ where }),
  ]);

  // Compute running balance starting from effectiveOpeningBalance
  // For paginated views, first accumulate balance from all entries in the result set before current page
  let runningBalance = effectiveOpeningBalance;
  if (skip > 0) {
    const allBeforePageEntries = await prisma.ledgerEntry.findMany({
      where,
      skip: 0,
      take: skip,
      orderBy: [{ date: 'asc' }, { createdAt: 'asc' }],
      select: { voucherType: true, amount: true },
    });
    for (const e of allBeforePageEntries) {
      if (e.voucherType === 'ORDER') runningBalance += Number(e.amount);
      else runningBalance -= Number(e.amount);
    }
  }

  const enrichedEntries = entries.map((entry) => {
    const amount = Number(entry.amount);
    const prevBalance = runningBalance;
    if (entry.voucherType === 'ORDER') runningBalance += amount;
    else runningBalance -= amount;

    return {
      ...entry,
      openingBalance: prevBalance,
      currentTotal: amount,
      closingBalance: runningBalance,
      billSerialNumber: entry.order?.billNumber || entry.receipt?.receiptNumber || '',
      orderId: entry.orderId ?? null,
      receiptId: entry.receiptId ?? null,
    };
  });

  return {
    ...buildPaginatedResponse(enrichedEntries, total, page, pageSize),
    openingBalance: effectiveOpeningBalance,
    storedOpeningBalance,
  };
}

export async function upsertOpeningBalance(storeId: string, amount: number) {
  return prisma.openingBalance.upsert({
    where: { storeId },
    update: { amount },
    create: { storeId, amount },
  });
}

export async function getAllEntries(storeId: string, query: Request['query']) {
  const search = query.search ? String(query.search) : undefined;
  const dateFrom = query.dateFrom ? new Date(String(query.dateFrom)) : undefined;
  const dateTo = query.dateTo ? new Date(String(query.dateTo)) : undefined;

  const where: Record<string, unknown> = { storeId };
  if (search) {
    where.customerName = { contains: search, mode: 'insensitive' };
  }
  if (dateFrom || dateTo) {
    where.date = {
      ...(dateFrom ? { gte: dateFrom } : {}),
      ...(dateTo ? { lte: dateTo } : {}),
    };
  }

  return prisma.ledgerEntry.findMany({
    where,
    orderBy: [{ date: 'asc' }, { createdAt: 'asc' }],
    include: {
      order: { select: { billNumber: true } },
      receipt: { select: { receiptNumber: true } },
    },
  });
}
