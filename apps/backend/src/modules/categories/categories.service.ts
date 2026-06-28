import { prisma } from '../../lib/prisma';
import { buildPaginationArgs, buildPaginatedResponse } from '../../utils/paginate';
import { createLog } from '../user-logs/userLog.service';
import { AppError } from '../../middleware/errorHandler';
import { Request } from 'express';

export async function list(query: Request['query']) {
  const { page, pageSize, skip, take } = buildPaginationArgs(query);
  const search = query.search ? String(query.search) : undefined;
  const brandId = query.brandId ? String(query.brandId) : undefined;

  const where: Record<string, unknown> = {};
  if (search) where.name = { contains: search, mode: 'insensitive' };
  if (brandId) where.brandId = brandId;

  const [data, total] = await Promise.all([
    prisma.category.findMany({
      where,
      skip,
      take,
      orderBy: { name: 'asc' },
      include: { brand: { select: { id: true, name: true } } },
    }),
    prisma.category.count({ where }),
  ]);

  return buildPaginatedResponse(data, total, page, pageSize);
}

export async function getAllByBrand(brandId: string) {
  return prisma.category.findMany({
    where: { brandId },
    orderBy: { name: 'asc' },
  });
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyRecord = Record<string, any>;

export async function create(
  userId: string,
  data: { name: string; brandId?: string | undefined; imageUrl?: string | null | undefined }
) {
  const createData: AnyRecord = {
    name: data.name,
    imageUrl: data.imageUrl ?? null,
  };
  if (data.brandId) {
    createData.brandId = data.brandId;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const category = await (prisma.category.create as any)({ data: createData });
  await createLog(userId, 'CATEGORY_CREATION', { categoryId: category.id });
  return category;
}

export async function update(
  id: string,
  data: { name?: string; brandId?: string | undefined; imageUrl?: string | null | undefined }
) {
  const updateData: AnyRecord = {};
  if (data.name !== undefined) updateData.name = data.name;
  if (data.imageUrl !== undefined) updateData.imageUrl = data.imageUrl;
  if (data.brandId) updateData.brandId = data.brandId;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (prisma.category.update as any)({
    where: { id },
    data: updateData,
    include: { brand: { select: { id: true, name: true } } },
  });
}

export async function remove(id: string) {
  const productCount = await prisma.product.count({ where: { categoryId: id } });
  if (productCount > 0) {
    throw new AppError(409, 'Cannot delete category with associated products');
  }
  return prisma.category.delete({ where: { id } });
}
