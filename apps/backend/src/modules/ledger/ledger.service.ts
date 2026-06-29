import { prisma } from '../../lib/prisma';
import { buildPaginationArgs, buildPaginatedResponse } from '../../utils/paginate';
import { Request } from 'express';

export async function getLedger(storeId: string, query: Request['query']) {
  const { page, pageSize, skip, take } = buildPaginationArgs(query);
  const search = query.search ? String(query.search) : undefined;
  const dateFrom = query.dateFrom ? new Date(String(query.dateFrom)) : undefined;
  const dateTo = query.dateTo ? new Date(String(query.dateTo)) : undefined;
  const operatorType = query.operatorType ? String(query.operatorType) : undefined;

  // Stored opening balance (base value set by admin)
  const openingBalanceRecord = await prisma.openingBalance.findUnique({ where: { storeId } });
  const storedOpeningBalance = openingBalanceRecord ? Number(openingBalanceRecord.amount) : 0;

  // Effective opening balance for the date range:
  // = stored OB + sum of all transactions BEFORE dateFrom
  // If no dateFrom, effective opening balance is just the stored OB
  let effectiveOpeningBalance = storedOpeningBalance;
  if (dateFrom) {
    const priorWhere: Record<string, unknown> = { storeId, date: { lt: dateFrom } };
    if (operatorType === 'CASH' || operatorType === 'CREDIT') {
      priorWhere.OR = [
        { order: { user: { operatorType } } },
        { receipt: { user: { operatorType } } },
      ];
    }
    const priorEntries = await prisma.ledgerEntry.findMany({
      where: priorWhere,
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
  if (operatorType === 'CASH' || operatorType === 'CREDIT') {
    where.OR = [
      { order: { user: { operatorType } } },
      { receipt: { user: { operatorType } } },
    ];
  }

  const [entries, total] = await Promise.all([
    prisma.ledgerEntry.findMany({
      where,
      skip,
      take,
      orderBy: [{ date: 'asc' }, { createdAt: 'asc' }],
      include: {
        order: { select: { billNumber: true, user: { select: { username: true, operatorType: true } } } },
        receipt: { select: { receiptNumber: true, user: { select: { username: true, operatorType: true } } } },
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

export async function getClosingBalance(storeId: string) {
  const openingBalanceRecord = await prisma.openingBalance.findUnique({ where: { storeId } });
  let balance = openingBalanceRecord ? Number(openingBalanceRecord.amount) : 0;

  const aggregates = await prisma.ledgerEntry.groupBy({
    by: ['voucherType'],
    where: { storeId },
    _sum: { amount: true },
  });

  for (const agg of aggregates) {
    if (agg.voucherType === 'ORDER') {
      balance += Number(agg._sum.amount || 0);
    } else {
      balance -= Number(agg._sum.amount || 0);
    }
  }

  return balance;
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
