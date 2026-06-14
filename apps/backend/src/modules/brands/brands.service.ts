import { prisma } from '../../lib/prisma';
import { buildPaginationArgs, buildPaginatedResponse } from '../../utils/paginate';
import { createLog } from '../user-logs/userLog.service';
import { AppError } from '../../middleware/errorHandler';
import { Request } from 'express';

export async function list(query: Request['query']) {
  const { page, pageSize, skip, take } = buildPaginationArgs(query);
  const search = query.search ? String(query.search) : undefined;

  const where = search ? { name: { contains: search, mode: 'insensitive' as const } } : {};

  const [data, total] = await Promise.all([
    prisma.brand.findMany({ where, skip, take, orderBy: { name: 'asc' } }),
    prisma.brand.count({ where }),
  ]);

  return buildPaginatedResponse(data, total, page, pageSize);
}

export async function getAll() {
  return prisma.brand.findMany({ orderBy: { name: 'asc' } });
}

export async function create(userId: string, data: { name: string; imageUrl?: string | null }) {
  const brand = await prisma.brand.create({ data });
  await createLog(userId, 'BRAND_CREATION', { brandId: brand.id, brandName: brand.name });
  return brand;
}

export async function update(id: string, data: { name?: string; imageUrl?: string | null }) {
  return prisma.brand.update({ where: { id }, data });
}

export async function remove(id: string) {
  const [categoryCount, productCount] = await Promise.all([
    prisma.category.count({ where: { brandId: id } }),
    prisma.product.count({ where: { brandId: id } }),
  ]);

  if (categoryCount > 0 || productCount > 0) {
    throw new AppError(409, 'Cannot delete brand with associated categories or products');
  }

  return prisma.brand.delete({ where: { id } });
}
