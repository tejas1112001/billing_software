import { prisma } from '../../lib/prisma';
import { buildPaginationArgs, buildPaginatedResponse } from '../../utils/paginate';
import { createLog } from '../user-logs/userLog.service';
import { AppError } from '../../middleware/errorHandler';
import { Request } from 'express';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyRecord = Record<string, any>;

const categoryInclude = {
  brand: { select: { id: true, name: true } },
  categoryBrands: {
    include: { brand: { select: { id: true, name: true } } },
    orderBy: { brand: { name: 'asc' as const } },
  },
};

function mapCategoryBrands(cat: AnyRecord) {
  return {
    ...cat,
    brands: (cat.categoryBrands ?? []).map((cb: AnyRecord) => cb.brand),
  };
}

export async function list(query: Request['query']) {
  const { page, pageSize, skip, take } = buildPaginationArgs(query);
  const search = query.search ? String(query.search) : undefined;
  const brandId = query.brandId ? String(query.brandId) : undefined;

  const where: Record<string, unknown> = {};
  if (search) where.name = { contains: search, mode: 'insensitive' };
  if (brandId) where.categoryBrands = { some: { brandId } };

  const [data, total] = await Promise.all([
    prisma.category.findMany({
      where,
      skip,
      take,
      orderBy: { name: 'asc' },
      include: categoryInclude,
    }),
    prisma.category.count({ where }),
  ]);

  return buildPaginatedResponse(data.map(mapCategoryBrands), total, page, pageSize);
}

export async function getAll() {
  const categories = await prisma.category.findMany({
    orderBy: { name: 'asc' },
    include: categoryInclude,
  });
  return categories.map(mapCategoryBrands);
}

export async function getAllByBrand(brandId: string) {
  const categories = await prisma.category.findMany({
    where: { categoryBrands: { some: { brandId } } },
    orderBy: { name: 'asc' },
    include: categoryInclude,
  });
  return categories.map(mapCategoryBrands);
}

export async function create(
  userId: string,
  data: {
    name: string;
    brandIds?: string[];
    imageUrl?: string | null | undefined;
  }
) {
  const brandIds = data.brandIds && data.brandIds.length > 0 ? data.brandIds : [];

  const category = await prisma.category.create({
    data: {
      name: data.name,
      imageUrl: data.imageUrl ?? null,
      brandId: brandIds[0] ?? null,
      categoryBrands: brandIds.length > 0
        ? { create: brandIds.map((bid) => ({ brandId: bid })) }
        : undefined,
    },
    include: categoryInclude,
  });

  await createLog(userId, 'CATEGORY_CREATION', { categoryId: category.id });
  return mapCategoryBrands(category);
}

export async function update(
  id: string,
  data: {
    name?: string;
    brandIds?: string[];
    imageUrl?: string | null | undefined;
  }
) {
  const updateData: AnyRecord = {};
  if (data.name !== undefined) updateData.name = data.name;
  if (data.imageUrl !== undefined) updateData.imageUrl = data.imageUrl;

  if (data.brandIds !== undefined) {
    const brandIds = data.brandIds;
    updateData.brandId = brandIds.length > 0 ? brandIds[0] : null;

    // Sync join table
    await prisma.categoryBrand.deleteMany({ where: { categoryId: id } });
    if (brandIds.length > 0) {
      await prisma.categoryBrand.createMany({
        data: brandIds.map((bid) => ({ categoryId: id, brandId: bid })),
        skipDuplicates: true,
      });
    }
  }

  const category = await prisma.category.update({
    where: { id },
    data: updateData,
    include: categoryInclude,
  });

  return mapCategoryBrands(category);
}

export async function remove(id: string) {
  const productCount = await prisma.product.count({ where: { categoryId: id } });
  if (productCount > 0) {
    throw new AppError(409, 'Cannot delete category with associated products');
  }
  // CategoryBrand records cascade-deleted via onDelete: Cascade
  return prisma.category.delete({ where: { id } });
}
