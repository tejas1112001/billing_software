import { prisma } from '../../lib/prisma';
import { buildPaginationArgs, buildPaginatedResponse } from '../../utils/paginate';
import { createLog } from '../user-logs/userLog.service';
import { Request } from 'express';

export async function list(query: Request['query']) {
  const { page, pageSize, skip, take } = buildPaginationArgs(query);
  const search = query.search ? String(query.search) : undefined;
  const brandId = query.brandId ? String(query.brandId) : undefined;
  const categoryId = query.categoryId ? String(query.categoryId) : undefined;
  const sortOrder = query.sortOrder === 'desc' ? 'desc' : 'asc';

  const where: Record<string, unknown> = {};
  if (search) where.modelName = { contains: search, mode: 'insensitive' };
  if (brandId) where.brandId = brandId;
  if (categoryId) where.categoryId = categoryId;

  const [data, total] = await Promise.all([
    prisma.product.findMany({
      where,
      skip,
      take,
      orderBy: { nlc: sortOrder },
      include: {
        brand: { select: { id: true, name: true } },
        category: { select: { id: true, name: true } },
      },
    }),
    prisma.product.count({ where }),
  ]);

  return buildPaginatedResponse(data, total, page, pageSize);
}

export async function getById(id: string) {
  return prisma.product.findUnique({
    where: { id },
    include: {
      brand: { select: { id: true, name: true } },
      category: { select: { id: true, name: true } },
    },
  });
}

export async function create(
  userId: string,
  data: {
    modelName: string;
    brandId: string;
    categoryId: string;
    imageUrl?: string | null;
    mrp: number;
    nlc: number;
    availableQty: number;
  }
) {
  const product = await prisma.product.create({
    data,
    include: {
      brand: { select: { id: true, name: true } },
      category: { select: { id: true, name: true } },
    },
  });
  await createLog(userId, 'PRODUCT_CREATION', { productId: product.id });
  return product;
}

export async function update(
  id: string,
  userId: string,
  data: Partial<{
    modelName: string;
    brandId: string;
    categoryId: string;
    imageUrl: string | null;
    mrp: number;
    nlc: number;
    availableQty: number;
  }>
) {
  const product = await prisma.product.update({
    where: { id },
    data,
    include: {
      brand: { select: { id: true, name: true } },
      category: { select: { id: true, name: true } },
    },
  });
  await createLog(userId, 'PRODUCT_UPDATE', { productId: product.id });
  return product;
}
