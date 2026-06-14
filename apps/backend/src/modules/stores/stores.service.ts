import { prisma } from '../../lib/prisma';
import { buildPaginationArgs, buildPaginatedResponse } from '../../utils/paginate';
import { createLog } from '../user-logs/userLog.service';
import { Request } from 'express';

export async function list(query: Request['query']) {
  const { page, pageSize, skip, take } = buildPaginationArgs(query);
  const search = query.search ? String(query.search) : undefined;

  const where = search
    ? {
        OR: [
          { name: { contains: search, mode: 'insensitive' as const } },
          { city: { contains: search, mode: 'insensitive' as const } },
        ],
      }
    : {};

  const [data, total] = await Promise.all([
    prisma.store.findMany({ where, skip, take, orderBy: { name: 'asc' } }),
    prisma.store.count({ where }),
  ]);

  return buildPaginatedResponse(data, total, page, pageSize);
}

export async function getAll() {
  return prisma.store.findMany({ orderBy: { name: 'asc' } });
}

export async function getById(id: string) {
  return prisma.store.findUnique({ where: { id } });
}

export async function create(
  userId: string,
  data: { name: string; address: string; city: string; pincode: string; mobile: string; email: string }
) {
  const store = await prisma.store.create({ data });
  await createLog(userId, 'STORE_CREATION', { storeId: store.id, storeName: store.name });
  return store;
}

export async function update(
  id: string,
  data: Partial<{ name: string; address: string; city: string; pincode: string; mobile: string; email: string }>
) {
  return prisma.store.update({ where: { id }, data });
}

export async function remove(id: string) {
  return prisma.store.delete({ where: { id } });
}
