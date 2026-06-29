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

    const userWhere: Record<string, unknown> = { isActive: true };
    if (operatorTypeFilter) {
      userWhere.operatorType = operatorTypeFilter;
      userWhere.role = 'OPERATOR';
    }

    const users = await prisma.user.findMany({
      where: userWhere,
      select: { id: true, username: true, operatorType: true, role: true },
      orderBy: { username: 'asc' },
    });

    // Fetch all orders today with first item pricing for classification
    const ordersTodayList = await prisma.order.findMany({
      where: { createdAt: { gte: startOfDay, lte: endOfDay } },
      include: {
        user: { select: { role: true, operatorType: true } },
        orderItems: {
          take: 1,
          include: { product: { select: { cashPrice: true, creditPrice: true } } }
        }
      }
    });

    let totalCashSalesToday = 0;
    let totalCreditSalesToday = 0;

    for (const order of ordersTodayList) {
      let type: OperatorType = 'CASH';
      if (order.user.role === 'OPERATOR' && order.user.operatorType) {
        type = order.user.operatorType;
      } else if (order.orderItems.length > 0) {
        const item = order.orderItems[0];
        if (Number(item.unitPrice) === Number(item.product.cashPrice)) {
          type = 'CASH';
        } else if (Number(item.unitPrice) === Number(item.product.creditPrice)) {
          type = 'CREDIT';
        }
      }
      
      const sales = Number(order.totalAmount);
      if (type === 'CASH') {
        totalCashSalesToday += sales;
      } else {
        totalCreditSalesToday += sales;
      }
    }

    const stats = await Promise.all(
      users.map(async (op) => {
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
          role: op.role,
          ordersToday,
          receiptsToday,
          salesToday: Number(totalOrdersAmount._sum.totalAmount ?? 0),
          collectedToday: Number(totalReceiptsAmount._sum.amount ?? 0),
          recentActivity: recentLogs,
        };
      })
    );

    res.json({ operators: stats, distribution: { cashSales: totalCashSalesToday, creditSales: totalCreditSalesToday } });
  } catch (e) { next(e); }
}

export async function getPersonalStats(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user!.id;
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

    const [
      ordersToday, receiptsToday, totalOrdersAmount,
      totalBills, totalReceipts, totalSalesAgg, totalCollectedAgg,
      recentOrders,
    ] = await Promise.all([
      prisma.order.count({ where: { userId, createdAt: { gte: startOfDay, lte: endOfDay } } }),
      prisma.receipt.count({ where: { userId, createdAt: { gte: startOfDay, lte: endOfDay } } }),
      prisma.order.aggregate({
        _sum: { totalAmount: true },
        where: { userId, createdAt: { gte: startOfDay, lte: endOfDay } },
      }),
      prisma.order.count({ where: { userId } }),
      prisma.receipt.count({ where: { userId } }),
      prisma.order.aggregate({ _sum: { totalAmount: true }, where: { userId } }),
      prisma.receipt.aggregate({ _sum: { amount: true }, where: { userId } }),
      prisma.order.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: {
          id: true,
          billNumber: true,
          totalAmount: true,
          createdAt: true,
          store: { select: { name: true } },
        },
      }),
    ]);

    const days: { label: string; sales: number; collected: number; orders: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
      const start = new Date(d.getFullYear(), d.getMonth(), d.getDate());
      const end = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999);

      const [ordersAgg, receiptsAgg, ordersCount] = await Promise.all([
        prisma.order.aggregate({
          _sum: { totalAmount: true },
          where: { userId, createdAt: { gte: start, lte: end } },
        }),
        prisma.receipt.aggregate({
          _sum: { amount: true },
          where: { userId, createdAt: { gte: start, lte: end } },
        }),
        prisma.order.count({ where: { userId, createdAt: { gte: start, lte: end } } }),
      ]);

      days.push({
        label: d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric' }),
        sales: Number(ordersAgg._sum.totalAmount ?? 0),
        collected: Number(receiptsAgg._sum.amount ?? 0),
        orders: ordersCount,
      });
    }

    res.json({
      ordersToday,
      receiptsToday,
      salesToday: Number(totalOrdersAmount._sum.totalAmount ?? 0),
      totalBillsGenerated: totalBills,
      totalReceiptsGenerated: totalReceipts,
      totalSales: Number(totalSalesAgg._sum.totalAmount ?? 0),
      totalCollected: Number(totalCollectedAgg._sum.amount ?? 0),
      recentOrders,
      weeklyTrends: days,
    });
  } catch (e) { next(e); }
}

export async function getPersonalActivity(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user!.id;
    const page = Math.max(1, parseInt(String(req.query.page ?? '1'), 10) || 1);
    const pageSize = Math.min(50, Math.max(5, parseInt(String(req.query.pageSize ?? '15'), 10) || 15));
    const skip = (page - 1) * pageSize;

    const [logs, total] = await Promise.all([
      prisma.userLog.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        skip,
        take: pageSize,
        select: { id: true, action: true, meta: true, createdAt: true },
      }),
      prisma.userLog.count({ where: { userId } }),
    ]);

    res.json({
      data: logs,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    });
  } catch (e) { next(e); }
}

export async function getLowStockProducts(req: Request, res: Response, next: NextFunction) {
  try {
    const products = await prisma.product.findMany({
      where: { availableQty: { lt: 5 } },
      orderBy: { availableQty: 'asc' },
      take: 100,
      select: {
        id: true,
        modelName: true,
        availableQty: true,
        brand: { select: { name: true } },
      },
    });
    res.json({ products, count: products.length });
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
      brandName: productMap.get(item.productId)?.brand?.name ?? '',
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

    const dateFilter = { createdAt: { gte: start, lte: end } };

    const orders = await prisma.order.findMany({
      where: dateFilter,
      include: {
        user: { select: { role: true, operatorType: true } },
        orderItems: {
          take: 1,
          include: { product: { select: { cashPrice: true, creditPrice: true } } }
        }
      }
    });

    let cashSales = 0;
    let cashOrdersCount = 0;
    let creditSales = 0;
    let creditOrdersCount = 0;

    for (const order of orders) {
      let isCash = false;
      if (order.user.role === 'OPERATOR') {
        isCash = order.user.operatorType === 'CASH';
      } else {
        if (order.orderItems.length > 0) {
          const item = order.orderItems[0];
          const unitPrice = Number(item.unitPrice);
          const cashPrice = Number(item.product.cashPrice);
          const creditPrice = Number(item.product.creditPrice);
          if (unitPrice === cashPrice) {
            isCash = true;
          } else if (unitPrice === creditPrice) {
            isCash = false;
          } else {
            isCash = true;
          }
        } else {
          isCash = true;
        }
      }

      const amt = Number(order.totalAmount);
      if (isCash) {
        cashSales += amt;
        cashOrdersCount++;
      } else {
        creditSales += amt;
        creditOrdersCount++;
      }
    }

    const totalSales = cashSales + creditSales;
    const totalOrdersCount = cashOrdersCount + creditOrdersCount;

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
        brandName: product?.brand?.name ?? '',
        categoryName: product?.category?.name ?? '',
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
            purchasePrice: true,
            brand: { select: { name: true } },
            category: { select: { name: true } },
          },
        },
      },
      orderBy: { product: { modelName: 'asc' } },
    });

    // Calculate profit for each item
    // Selling price = unitPrice (already determined by user type during order creation)
    // Purchase price = product.purchasePrice (if available) or fallback to old calculation
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
      
      // Use purchasePrice if available, otherwise fallback to old MRP-based calculation
      const purchasePrice = item.product.purchasePrice 
        ? Number(item.product.purchasePrice)
        : sellingPrice - (Number(item.product.mrp) - sellingPrice);  // Fallback for old data
      
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
          brandName: item.product.brand?.name ?? '',
          categoryName: item.product.category?.name ?? '',
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

// Product Report — complete product history with stock movements
export async function getProductReport(req: Request, res: Response, next: NextFunction) {
  try {
    const { startDate, endDate, productId, categoryId, brandId, storeId, page = '1', limit = '20' } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    const now = new Date();
    const start = startDate ? new Date(startDate as string) : undefined;
    const end = endDate ? new Date(endDate as string) : undefined;
    if (end) end.setHours(23, 59, 59, 999);

    const orderWhere: Record<string, unknown> = {};
    if (start || end) {
      orderWhere.createdAt = {
        ...(start ? { gte: start } : {}),
        ...(end ? { lte: end } : {}),
      };
    }
    const storeFilter = cleanQueryId(storeId);
    if (storeFilter) orderWhere.storeId = storeFilter;

    const productWhere: Record<string, string> = {};
    const productFilter = cleanQueryId(productId);
    const categoryFilter = cleanQueryId(categoryId);
    const brandFilter = cleanQueryId(brandId);
    if (productFilter) productWhere.id = productFilter;
    if (categoryFilter) productWhere.categoryId = categoryFilter;
    if (brandFilter) productWhere.brandId = brandFilter;

    const products = await prisma.product.findMany({
      where: productWhere,
      select: {
        id: true,
        modelName: true,
        mrp: true,
        cashPrice: true,
        creditPrice: true,
        purchasePrice: true,
        availableQty: true,
        brand: { select: { name: true } },
        category: { select: { name: true } },
      },
      orderBy: { modelName: 'asc' },
    });

    const productIds = products.map((p) => p.id);

    const orderItems = await prisma.orderItem.findMany({
      where: {
        productId: { in: productIds },
        order: Object.keys(orderWhere).length > 0 ? orderWhere : undefined,
      },
      select: {
        productId: true,
        quantity: true,
        unitPrice: true,
        lineTotal: true,
        product: { select: { purchasePrice: true, mrp: true } },
      },
    });

    const salesByProduct = new Map<string, {
      totalQuantitySold: number;
      totalSalesAmount: number;
      totalProfit: number;
    }>();

    for (const item of orderItems) {
      const purchasePrice = item.product.purchasePrice
        ? Number(item.product.purchasePrice)
        : Number(item.unitPrice) - (Number(item.product.mrp) - Number(item.unitPrice));
      const cost = purchasePrice * item.quantity;
      const sales = Number(item.lineTotal);
      const profit = sales - cost;

      const existing = salesByProduct.get(item.productId);
      if (existing) {
        existing.totalQuantitySold += item.quantity;
        existing.totalSalesAmount += sales;
        existing.totalProfit += profit;
      } else {
        salesByProduct.set(item.productId, {
          totalQuantitySold: item.quantity,
          totalSalesAmount: sales,
          totalProfit: profit,
        });
      }
    }

    const allItems = products.map((p) => {
      const sales = salesByProduct.get(p.id) ?? {
        totalQuantitySold: 0,
        totalSalesAmount: 0,
        totalProfit: 0,
      };
      const currentStock = p.availableQty;
      const totalQuantityAdded = currentStock + sales.totalQuantitySold;

      return {
        productId: p.id,
        productName: p.modelName,
        brandName: p.brand?.name ?? '',
        categoryName: p.category?.name ?? '',
        purchasePrice: p.purchasePrice ? Number(p.purchasePrice) : null,
        cashPrice: Number(p.cashPrice),
        creditPrice: Number(p.creditPrice),
        mrp: Number(p.mrp),
        totalQuantityAdded,
        totalQuantitySold: sales.totalQuantitySold,
        currentRemainingStock: currentStock,
        totalSalesAmount: sales.totalSalesAmount,
        totalProfit: sales.totalProfit,
      };
    });

    const paginatedItems = allItems.slice(skip, skip + limitNum);

    const summary = allItems.reduce(
      (acc, item) => ({
        totalQuantityAdded: acc.totalQuantityAdded + item.totalQuantityAdded,
        totalQuantitySold: acc.totalQuantitySold + item.totalQuantitySold,
        currentRemainingStock: acc.currentRemainingStock + item.currentRemainingStock,
        totalSalesAmount: acc.totalSalesAmount + item.totalSalesAmount,
        totalProfit: acc.totalProfit + item.totalProfit,
      }),
      {
        totalQuantityAdded: 0,
        totalQuantitySold: 0,
        currentRemainingStock: 0,
        totalSalesAmount: 0,
        totalProfit: 0,
      }
    );

    res.json({
      startDate: start ?? null,
      endDate: end ?? null,
      items: paginatedItems,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: allItems.length,
        pages: Math.ceil(allItems.length / limitNum),
      },
      summary: { ...summary, productCount: allItems.length },
    });
  } catch (e) { next(e); }
}

export async function getProductStockHistory(req: Request, res: Response, next: NextFunction) {
  try {
    const productId = req.params.productId;
    if (!productId) return res.status(400).json({ message: 'Product ID required' });

    const product = await prisma.product.findUnique({
      where: { id: productId },
      select: { id: true, modelName: true, availableQty: true },
    });
    if (!product) return res.status(404).json({ message: 'Product not found' });

    const logs = await prisma.userLog.findMany({
      where: {
        action: { in: ['PRODUCT_CREATION', 'PRODUCT_UPDATE'] },
      },
      include: { user: { select: { username: true, role: true } } },
      orderBy: { createdAt: 'desc' },
      take: 500,
    });

    const stockLogs = logs
      .filter((log) => {
        const meta = log.meta as Record<string, unknown> | null;
        return meta?.productId === productId && (
          log.action === 'PRODUCT_CREATION' ||
          meta.type === 'stock_adjustment' ||
          meta.type === 'initial_stock'
        );
      })
      .map((log) => {
        const meta = log.meta as Record<string, unknown>;
        const isCreation = log.action === 'PRODUCT_CREATION';
        return {
          id: log.id,
          date: log.createdAt,
          type: isCreation ? 'initial_stock' : 'stock_adjustment',
          previousQty: isCreation ? 0 : (meta.previousQty as number | undefined),
          newQty: isCreation ? (meta.availableQty as number) : (meta.newQty as number | undefined),
          delta: isCreation ? (meta.availableQty as number) : (meta.delta as number | undefined),
          performedBy: log.user.username,
          role: log.user.role,
          note: isCreation
            ? `Initial stock: ${meta.availableQty} units`
            : `Stock ${(meta.delta as number) >= 0 ? 'increased' : 'decreased'} by ${Math.abs(meta.delta as number)} units (${meta.previousQty} → ${meta.newQty})`,
        };
      });

    const salesHistory = await prisma.orderItem.findMany({
      where: { productId },
      select: {
        quantity: true,
        order: {
          select: {
            billNumber: true,
            createdAt: true,
            user: { select: { username: true } },
          },
        },
      },
      orderBy: { order: { createdAt: 'desc' } },
      take: 50,
    });

    const salesMovements = salesHistory.map((item) => ({
      id: `sale-${item.order.billNumber}`,
      date: item.order.createdAt,
      type: 'sale' as const,
      delta: -item.quantity,
      performedBy: item.order.user.username,
      note: `Sold ${item.quantity} units on bill ${item.order.billNumber}`,
    }));

    const history = [...stockLogs, ...salesMovements].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );

    res.json({ product, history });
  } catch (e) { next(e); }
}
