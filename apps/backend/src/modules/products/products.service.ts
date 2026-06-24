import { prisma } from '../../lib/prisma';
import { buildPaginationArgs, buildPaginatedResponse } from '../../utils/paginate';
import { createLog } from '../user-logs/userLog.service';
import { Request } from 'express';

function normalizeImageUrl(url: string | null | undefined): string | null {
  if (!url || url.trim() === '' || url.startsWith('blob:')) return null;
  return url;
}

async function syncProductImages(
  productId: string,
  images: string[],
  thumbnailUrl?: string | null
) {
  await prisma.productImage.deleteMany({ where: { productId } });

  const validImages = images.map(normalizeImageUrl).filter((url): url is string => !!url);
  const thumbnail = normalizeImageUrl(thumbnailUrl) ?? validImages[0] ?? null;

  if (validImages.length > 0) {
    await prisma.productImage.createMany({
      data: validImages.map((url, index) => ({
        productId,
        url,
        sortOrder: index,
      })),
    });
  }

  return thumbnail;
}

const productInclude = {
  brand: { select: { id: true, name: true } },
  category: { select: { id: true, name: true } },
  images: { orderBy: { sortOrder: 'asc' as const } },
};

export async function list(query: Request['query']) {
  const { page, pageSize, skip, take } = buildPaginationArgs(query);
  const search = query.search ? String(query.search) : undefined;
  const brandId = query.brandId ? String(query.brandId) : undefined;
  const categoryId = query.categoryId ? String(query.categoryId) : undefined;
  const sortOrder = query.sortOrder === 'desc' ? 'desc' : 'asc';
  const isNewArrival = query.isNewArrival === 'true' ? true : undefined;

  const inStock = query.inStock === 'true' ? true : undefined;

  const where: Record<string, unknown> = {};
  if (search) where.modelName = { contains: search, mode: 'insensitive' };
  if (brandId) where.brandId = brandId;
  if (categoryId) where.categoryId = categoryId;
  if (isNewArrival !== undefined) where.isNewArrival = isNewArrival;
  if (inStock) where.availableQty = { gt: 0 };

  const [data, total] = await Promise.all([
    prisma.product.findMany({
      where,
      skip,
      take,
      orderBy: { cashPrice: sortOrder },
      include: productInclude,
    }),
    prisma.product.count({ where }),
  ]);

  return buildPaginatedResponse(data, total, page, pageSize);
}

export async function getById(id: string) {
  return prisma.product.findUnique({
    where: { id },
    include: productInclude,
  });
}

export async function create(
  userId: string,
  data: {
    modelName: string;
    brandId: string;
    categoryId: string;
    imageUrl?: string | null;
    images?: string[];
    thumbnailUrl?: string | null;
    mrp: number;
    cashPrice: number;
    creditPrice: number;
    purchasePrice?: number | null;
    availableQty: number;
    isNewArrival?: boolean;
  }
) {
  const imageList =
    data.images && data.images.length > 0
      ? data.images
      : data.imageUrl
        ? [data.imageUrl]
        : [];

  const thumbnail =
    normalizeImageUrl(data.thumbnailUrl) ??
    normalizeImageUrl(data.imageUrl) ??
    normalizeImageUrl(imageList[0]) ??
    null;

  const product = await prisma.product.create({
    data: {
      modelName: data.modelName,
      brandId: data.brandId,
      categoryId: data.categoryId,
      imageUrl: thumbnail,
      mrp: data.mrp,
      cashPrice: data.cashPrice,
      creditPrice: data.creditPrice,
      purchasePrice: data.purchasePrice,
      availableQty: data.availableQty,
      isNewArrival: data.isNewArrival ?? false,
      images: {
        create: imageList
          .map(normalizeImageUrl)
          .filter((url): url is string => !!url)
          .map((url, index) => ({ url, sortOrder: index })),
      },
    },
    include: productInclude,
  });

  await createLog(userId, 'PRODUCT_CREATION', {
    productId: product.id,
    modelName: product.modelName,
    availableQty: product.availableQty,
    type: 'initial_stock',
  });
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
    images: string[];
    thumbnailUrl: string | null;
    mrp: number;
    cashPrice: number;
    creditPrice: number;
    purchasePrice: number | null;
    availableQty: number;
    isNewArrival: boolean;
  }>
) {
  const existing = await prisma.product.findUnique({
    where: { id },
    select: { availableQty: true, modelName: true },
  });
  if (!existing) throw new Error('Product not found');

  const { images, thumbnailUrl, imageUrl, ...rest } = data;
  const updateData: Record<string, unknown> = { ...rest };

  if (images !== undefined) {
    const thumbnail = await syncProductImages(id, images, thumbnailUrl ?? imageUrl);
    updateData.imageUrl = thumbnail;
  } else if (thumbnailUrl !== undefined || imageUrl !== undefined) {
    updateData.imageUrl = normalizeImageUrl(thumbnailUrl ?? imageUrl);
  }

  const product = await prisma.product.update({
    where: { id },
    data: updateData,
    include: productInclude,
  });

  const logMeta: Record<string, unknown> = { productId: product.id, modelName: product.modelName };
  if (data.availableQty !== undefined && data.availableQty !== existing.availableQty) {
    logMeta.type = 'stock_adjustment';
    logMeta.previousQty = existing.availableQty;
    logMeta.newQty = data.availableQty;
    logMeta.delta = data.availableQty - existing.availableQty;
  }

  await createLog(userId, 'PRODUCT_UPDATE', logMeta);
  return product;
}

export async function deleteProduct(id: string, userId: string) {
  const orderItemCount = await prisma.orderItem.count({
    where: { productId: id },
  });

  if (orderItemCount > 0) {
    throw new Error('Cannot delete product that has been used in orders');
  }

  const product = await prisma.product.delete({
    where: { id },
  });

  await createLog(userId, 'PRODUCT_UPDATE', { productId: product.id, action: 'deleted' });
  return product;
}
