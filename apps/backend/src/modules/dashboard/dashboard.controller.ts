import { Request, Response, NextFunction } from 'express';
import { prisma } from '../../lib/prisma';
import { OperatorType } from '@prisma/client';

export async function getDashboardStats(req: Request, res: Response, next: NextFunction) {
  try {
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

    // Month boundaries
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

    const [totalOrdersToday, totalReceiptsToday, lowStockProducts, activeStores,
           totalOrdersAmount, totalReceiptsAmount,
           totalOrdersMonthAmount, totalReceiptsMonthAmount,
           totalOrdersAllTime, totalReceiptsAllTime] = await Promise.all([
      prisma.order.count({ where: { createdAt: { gte: startOfDay, lte: endOfDay } } }),
      prisma.receipt.count({ where: { createdAt: { gte: startOfDay, lte: endOfDay } } }),
      prisma.product.count({ where: { availableQty: { lt: 5 } } }),
      prisma.store.count(),
      prisma.order.aggregate({
        _sum: { totalAmount: true },
        where: { createdAt: { gte: startOfDay, lte: endOfDay } },
      }),
      prisma.receipt.aggregate({
        _sum: { amount: true },
        where: { createdAt: { gte: startOfDay, lte: endOfDay } },
      }),
      prisma.order.aggregate({
        _sum: { totalAmount: true },
        where: { createdAt: { gte: startOfMonth, lte: endOfMonth } },
      }),
      prisma.receipt.aggregate({
        _sum: { amount: true },
        where: { createdAt: { gte: startOfMonth, lte: endOfMonth } },
      }),
      prisma.order.aggregate({ _sum: { totalAmount: true } }),
      prisma.receipt.aggregate({ _sum: { amount: true } }),
    ]);

    const totalSalesAllTime = Number(totalOrdersAllTime._sum.totalAmount ?? 0);
    const totalCollectedAllTime = Number(totalReceiptsAllTime._sum.amount ?? 0);

    res.json({
      totalOrdersToday,
      totalReceiptsToday,
      lowStockProducts,
      activeStores,
      totalSalesToday: Number(totalOrdersAmount._sum.totalAmount ?? 0),
      totalCollectedToday: Number(totalReceiptsAmount._sum.amount ?? 0),
      totalSalesThisMonth: Number(totalOrdersMonthAmount._sum.totalAmount ?? 0),
      totalCollectedThisMonth: Number(totalReceiptsMonthAmount._sum.amount ?? 0),
      totalOutstanding: totalSalesAllTime - totalCollectedAllTime,
    });
  } catch (e) { next(e); }
}

export async function getOperatorStats(req: Request, res: Response, next: NextFunction) {
  try {
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
    const operatorTypeFilter = req.query.operatorType as OperatorType | undefined;

    const userWhere: Record<string, unknown> = { role: 'OPERATOR', isActive: true };
    if (operatorTypeFilter) userWhere.operatorType = operatorTypeFilter;

    const operators = await prisma.user.findMany({
      where: userWhere,
      select: { id: true, username: true, operatorType: true },
      orderBy: { username: 'asc' },
    });

    const stats = await Promise.all(
      operators.map(async (op) => {
        const [ordersToday, receiptsToday, totalOrdersAmount, totalReceiptsAmount,
               recentLogs] = await Promise.all([
          prisma.order.count({ where: { userId: op.id, createdAt: { gte: startOfDay, lte: endOfDay } } }),
          prisma.receipt.count({ where: { userId: op.id, createdAt: { gte: startOfDay, lte: endOfDay } } }),
          prisma.order.aggregate({
            _sum: { totalAmount: true },
            where: { userId: op.id, createdAt: { gte: startOfDay, lte: endOfDay } },
          }),
          prisma.receipt.aggregate({
            _sum: { amount: true },
            where: { userId: op.id, createdAt: { gte: startOfDay, lte: endOfDay } },
          }),
          prisma.userLog.findMany({
            where: { userId: op.id },
            orderBy: { createdAt: 'desc' },
            take: 5,
            select: { action: true, createdAt: true, meta: true },
          }),
        ]);

        return {
          id: op.id,
          username: op.username,
          operatorType: op.operatorType,
          ordersToday,
          receiptsToday,
          salesToday: Number(totalOrdersAmount._sum.totalAmount ?? 0),
          collectedToday: Number(totalReceiptsAmount._sum.amount ?? 0),
          recentActivity: recentLogs,
        };
      })
    );

    // Sales distribution for pie chart
    const cashSales = stats
      .filter(s => s.operatorType === 'CASH')
      .reduce((sum, s) => sum + s.salesToday, 0);
    const creditSales = stats
      .filter(s => s.operatorType === 'CREDIT')
      .reduce((sum, s) => sum + s.salesToday, 0);

    res.json({ operators: stats, distribution: { cashSales, creditSales } });
  } catch (e) { next(e); }
}

export async function getPersonalStats(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user!.id;
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

    const [ordersToday, receiptsToday, totalOrdersAmount, recentOrders, recentLogs] = await Promise.all([
      prisma.order.count({ where: { userId, createdAt: { gte: startOfDay, lte: endOfDay } } }),
      prisma.receipt.count({ where: { userId, createdAt: { gte: startOfDay, lte: endOfDay } } }),
      prisma.order.aggregate({
        _sum: { totalAmount: true },
        where: { userId, createdAt: { gte: startOfDay, lte: endOfDay } },
      }),
      prisma.order.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: 10,
        include: { store: { select: { name: true } } },
      }),
      prisma.userLog.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: 20,
        select: { action: true, createdAt: true, meta: true },
      }),
    ]);

    res.json({
      ordersToday,
      receiptsToday,
      salesToday: Number(totalOrdersAmount._sum.totalAmount ?? 0),
      recentOrders,
      recentActivity: recentLogs,
    });
  } catch (e) { next(e); }
}

export async function getWeeklyTrends(req: Request, res: Response, next: NextFunction) {
  try {
    const now = new Date();
    const days: { label: string; sales: number; collected: number; orders: number }[] = [];

    for (let i = 6; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
      const start = new Date(d.getFullYear(), d.getMonth(), d.getDate());
      const end = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999);

      const [ordersAgg, receiptsAgg, ordersCount] = await Promise.all([
        prisma.order.aggregate({
          _sum: { totalAmount: true },
          where: { createdAt: { gte: start, lte: end } },
        }),
        prisma.receipt.aggregate({
          _sum: { amount: true },
          where: { createdAt: { gte: start, lte: end } },
        }),
        prisma.order.count({ where: { createdAt: { gte: start, lte: end } } }),
      ]);

      const dayLabel = d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric' });
      days.push({
        label: dayLabel,
        sales: Number(ordersAgg._sum.totalAmount ?? 0),
        collected: Number(receiptsAgg._sum.amount ?? 0),
        orders: ordersCount,
      });
    }

    res.json({ days });
  } catch (e) { next(e); }
}

export async function getTopProducts(req: Request, res: Response, next: NextFunction) {
  try {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const topItems = await prisma.orderItem.groupBy({
      by: ['productId'],
      _sum: { quantity: true, lineTotal: true },
      where: { order: { createdAt: { gte: startOfMonth } } },
      orderBy: { _sum: { lineTotal: 'desc' } },
      take: 8,
    });

    const productIds = topItems.map(i => i.productId);
    const products = await prisma.product.findMany({
      where: { id: { in: productIds } },
      select: { id: true, modelName: true, brand: { select: { name: true } } },
    });

    const productMap = new Map(products.map(p => [p.id, p]));

    const result = topItems.map(item => ({
      productId: item.productId,
      modelName: productMap.get(item.productId)?.modelName ?? 'Unknown',
      brandName: productMap.get(item.productId)?.brand.name ?? '',
      totalQty: item._sum.quantity ?? 0,
      totalRevenue: Number(item._sum.lineTotal ?? 0),
    }));

    res.json({ products: result });
  } catch (e) { next(e); }
}

export async function getRecentActivity(req: Request, res: Response, next: NextFunction) {
  try {
    const logs = await prisma.userLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: 20,
      select: {
        id: true,
        action: true,
        meta: true,
        createdAt: true,
        user: { select: { id: true, username: true, operatorType: true } },
      },
    });
    res.json({ logs });
  } catch (e) { next(e); }
}
