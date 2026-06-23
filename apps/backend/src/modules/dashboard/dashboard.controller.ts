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

function cleanQueryId(value: unknown): string | undefined {
  if (!value || value === 'all') return undefined;
  return String(value);
}

// Cash vs Credit vs Overall Report
export async function getCashCreditReport(req: Request, res: Response, next: NextFunction) {
  try {
    const { startDate, endDate, filter = 'today' } = req.query;
    
    let start: Date, end: Date;
    const now = new Date();
    
    if (filter === 'today') {
      start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
    } else if (filter === 'month') {
      start = new Date(now.getFullYear(), now.getMonth(), 1);
      end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
    } else if (startDate && endDate) {
      start = new Date(startDate as string);
      end = new Date(endDate as string);
      end.setHours(23, 59, 59, 999);
    } else {
      return res.status(400).json({ message: 'Invalid date filter' });
    }

    // Get cash operators
    const cashOperators = await prisma.user.findMany({
      where: { role: 'OPERATOR', operatorType: 'CASH', isActive: true },
      select: { id: true },
    });
    const cashOperatorIds = cashOperators.map(op => op.id);

    // Get credit operators
    const creditOperators = await prisma.user.findMany({
      where: { role: 'OPERATOR', operatorType: 'CREDIT', isActive: true },
      select: { id: true },
    });
    const creditOperatorIds = creditOperators.map(op => op.id);

    const dateFilter = { createdAt: { gte: start, lte: end } };

    // Cash sales
    const [cashSalesResult, cashOrdersCount] = await Promise.all([
      prisma.order.aggregate({
        _sum: { totalAmount: true },
        where: { userId: { in: cashOperatorIds }, ...dateFilter },
      }),
      prisma.order.count({
        where: { userId: { in: cashOperatorIds }, ...dateFilter },
      }),
    ]);

    // Credit sales
    const [creditSalesResult, creditOrdersCount] = await Promise.all([
      prisma.order.aggregate({
        _sum: { totalAmount: true },
        where: { userId: { in: creditOperatorIds }, ...dateFilter },
      }),
      prisma.order.count({
        where: { userId: { in: creditOperatorIds }, ...dateFilter },
      }),
    ]);

    // Total sales
    const [totalSalesResult, totalOrdersCount] = await Promise.all([
      prisma.order.aggregate({
        _sum: { totalAmount: true },
        where: dateFilter,
      }),
      prisma.order.count({ where: dateFilter }),
    ]);

    const cashSales = Number(cashSalesResult._sum.totalAmount ?? 0);
    const creditSales = Number(creditSalesResult._sum.totalAmount ?? 0);
    const totalSales = Number(totalSalesResult._sum.totalAmount ?? 0);

    res.json({
      filter,
      startDate: start,
      endDate: end,
      cashSales: {
        amount: cashSales,
        orders: cashOrdersCount,
        percentage: totalSales > 0 ? (cashSales / totalSales) * 100 : 0,
      },
      creditSales: {
        amount: creditSales,
        orders: creditOrdersCount,
        percentage: totalSales > 0 ? (creditSales / totalSales) * 100 : 0,
      },
      totalSales: {
        amount: totalSales,
        orders: totalOrdersCount,
      },
    });
  } catch (e) { next(e); }
}

// Purchase Quantity Report
export async function getPurchaseQuantityReport(req: Request, res: Response, next: NextFunction) {
  try {
    const { startDate, endDate, productId, categoryId, brandId, storeId, page = '1', limit = '20' } = req.query;
    
    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    // Build date filter
    const now = new Date();
    const start = startDate ? new Date(startDate as string) : new Date(now.getFullYear(), now.getMonth(), 1);
    const end = endDate ? new Date(endDate as string) : new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
    if (end) end.setHours(23, 59, 59, 999);

    // Build where clause for orders
    const orderWhere: Record<string, unknown> = {
      createdAt: { gte: start, lte: end },
    };
    const storeFilter = cleanQueryId(storeId);
    if (storeFilter) orderWhere.storeId = storeFilter;

    // Build where clause for products
    const productWhere: Record<string, string> = {};
    const productFilter = cleanQueryId(productId);
    const categoryFilter = cleanQueryId(categoryId);
    const brandFilter = cleanQueryId(brandId);
    if (productFilter) productWhere.id = productFilter;
    if (categoryFilter) productWhere.categoryId = categoryFilter;
    if (brandFilter) productWhere.brandId = brandFilter;

    const productRelation = Object.keys(productWhere).length > 0 ? productWhere : undefined;

    // Get aggregated purchase quantities by product
    const purchaseData = await prisma.orderItem.groupBy({
      by: ['productId'],
      _sum: { quantity: true },
      where: {
        order: orderWhere,
        product: productRelation,
      },
      orderBy: { _sum: { quantity: 'desc' } },
      skip,
      take: limitNum,
    });

    // Get total count for pagination
    const totalCount = await prisma.orderItem.groupBy({
      by: ['productId'],
      where: {
        order: orderWhere,
        product: productRelation,
      },
    });

    // Get product details
    const productIds = purchaseData.map(item => item.productId);
    const products = await prisma.product.findMany({
      where: { id: { in: productIds } },
      select: {
        id: true,
        modelName: true,
        brand: { select: { name: true } },
        category: { select: { name: true } },
      },
    });

    const productMap = new Map(products.map(p => [p.id, p]));

    // Calculate overall total
    const overallTotal = await prisma.orderItem.aggregate({
      _sum: { quantity: true },
      where: {
        order: orderWhere,
        product: productRelation,
      },
    });

    const items = purchaseData.map(item => {
      const product = productMap.get(item.productId);
      return {
        productId: item.productId,
        productName: product?.modelName ?? 'Unknown',
        brandName: product?.brand.name ?? '',
        categoryName: product?.category.name ?? '',
        totalQuantity: item._sum.quantity ?? 0,
      };
    });

    res.json({
      startDate: start,
      endDate: end,
      items,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: totalCount.length,
        pages: Math.ceil(totalCount.length / limitNum),
      },
      summary: {
        totalQuantity: Number(overallTotal._sum.quantity ?? 0),
        productCount: totalCount.length,
      },
    });
  } catch (e) { next(e); }
}

// Profit Report
export async function getProfitReport(req: Request, res: Response, next: NextFunction) {
  try {
    const { startDate, endDate, productId, categoryId, brandId, storeId, page = '1', limit = '20' } = req.query;
    
    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    // Build date filter
    const now = new Date();
    const start = startDate ? new Date(startDate as string) : new Date(now.getFullYear(), now.getMonth(), 1);
    const end = endDate ? new Date(endDate as string) : new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
    if (end) end.setHours(23, 59, 59, 999);

    // Build where clause for orders
    const orderWhere: Record<string, unknown> = {
      createdAt: { gte: start, lte: end },
    };
    const storeFilter = cleanQueryId(storeId);
    if (storeFilter) orderWhere.storeId = storeFilter;

    const productWhere: Record<string, string> = {};
    const productFilter = cleanQueryId(productId);
    const categoryFilter = cleanQueryId(categoryId);
    const brandFilter = cleanQueryId(brandId);
    if (productFilter) productWhere.id = productFilter;
    if (categoryFilter) productWhere.categoryId = categoryFilter;
    if (brandFilter) productWhere.brandId = brandFilter;

    const productRelation = Object.keys(productWhere).length > 0 ? productWhere : undefined;

    // Get all order items with product details
    const orderItems = await prisma.orderItem.findMany({
      where: {
        order: orderWhere,
        product: productRelation,
      },
      include: {
        product: {
          select: {
            id: true,
            modelName: true,
            mrp: true,
            nlc: true,
            brand: { select: { name: true } },
            category: { select: { name: true } },
          },
        },
      },
      orderBy: { product: { modelName: 'asc' } },
    });

    // Calculate profit for each item
    // Selling price = unitPrice; purchase price derived from MRP–NLC spread at sale time
    const profitByProduct = new Map<string, {
      productId: string;
      productName: string;
      brandName: string;
      categoryName: string;
      totalQuantity: number;
      totalSales: number;
      totalCost: number;
      totalProfit: number;
    }>();

    for (const item of orderItems) {
      const pid = item.productId;
      const quantity = item.quantity;
      const sellingPrice = Number(item.unitPrice);
      const purchasePrice = sellingPrice - (Number(item.product.mrp) - Number(item.product.nlc));
      const sales = Number(item.lineTotal);
      const cost = purchasePrice * quantity;
      const profit = sales - cost;

      if (profitByProduct.has(pid)) {
        const existing = profitByProduct.get(pid)!;
        existing.totalQuantity += quantity;
        existing.totalSales += sales;
        existing.totalCost += cost;
        existing.totalProfit += profit;
      } else {
        profitByProduct.set(pid, {
          productId: pid,
          productName: item.product.modelName,
          brandName: item.product.brand.name,
          categoryName: item.product.category.name,
          totalQuantity: quantity,
          totalSales: sales,
          totalCost: cost,
          totalProfit: profit,
        });
      }
    }

    // Convert to array and sort by profit
    const allItems = Array.from(profitByProduct.values()).sort((a, b) => b.totalProfit - a.totalProfit);

    // Paginate
    const paginatedItems = allItems.slice(skip, skip + limitNum);

    // Calculate overall totals
    const summary = allItems.reduce(
      (acc, item) => ({
        totalQuantity: acc.totalQuantity + item.totalQuantity,
        totalSales: acc.totalSales + item.totalSales,
        totalCost: acc.totalCost + item.totalCost,
        totalProfit: acc.totalProfit + item.totalProfit,
      }),
      { totalQuantity: 0, totalSales: 0, totalCost: 0, totalProfit: 0 }
    );

    const profitMargin = summary.totalSales > 0 ? (summary.totalProfit / summary.totalSales) * 100 : 0;

    res.json({
      startDate: start,
      endDate: end,
      items: paginatedItems,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: allItems.length,
        pages: Math.ceil(allItems.length / limitNum),
      },
      summary: {
        ...summary,
        profitMargin,
        productCount: allItems.length,
      },
    });
  } catch (e) { next(e); }
}
