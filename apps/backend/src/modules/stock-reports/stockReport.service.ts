import { prisma } from '../../lib/prisma';
import { buildPaginationArgs, buildPaginatedResponse } from '../../utils/paginate';
import { Request } from 'express';

export async function getReport(query: Request['query']) {
  const { page, pageSize, skip, take } = buildPaginationArgs(query);
  const groupBy = String(query.groupBy || 'brand');
  const brandId = query.brandId ? String(query.brandId) : undefined;
  const categoryId = query.categoryId ? String(query.categoryId) : undefined;

  const where: Record<string, unknown> = {};
  if (brandId) where.brandId = brandId;
  if (categoryId) where.categoryId = categoryId;

  const [products, total] = await Promise.all([
    prisma.product.findMany({
      where,
      skip,
      take,
      include: {
        brand: { select: { id: true, name: true } },
        category: { select: { id: true, name: true } },
      },
      orderBy:
        groupBy === 'quantity'
          ? { availableQty: 'asc' }
          : groupBy === 'brand'
          ? { brand: { name: 'asc' } }
          : { category: { name: 'asc' } },
    }),
    prisma.product.count({ where }),
  ]);

  return buildPaginatedResponse(products, total, page, pageSize);
}

export async function getAllForExport(query: Request['query']) {
  const brandId = query.brandId ? String(query.brandId) : undefined;
  const categoryId = query.categoryId ? String(query.categoryId) : undefined;

  const where: Record<string, unknown> = {};
  if (brandId) where.brandId = brandId;
  if (categoryId) where.categoryId = categoryId;

  return prisma.product.findMany({
    where,
    include: {
      brand: { select: { id: true, name: true } },
      category: { select: { id: true, name: true } },
    },
    orderBy: { modelName: 'asc' },
  });
}
