import bcrypt from 'bcryptjs';
import { prisma } from '../../lib/prisma';
import { AppError } from '../../middleware/errorHandler';
import { createLog } from '../user-logs/userLog.service';
import { Role, OperatorType } from '@prisma/client';
import { buildPaginationArgs, buildPaginatedResponse } from '../../utils/paginate';
import { Request } from 'express';

export async function listUsers(query: Request['query']) {
  const { page, pageSize, skip, take } = buildPaginationArgs(query);
  const role = query.role ? (String(query.role) as Role) : undefined;
  const operatorType = query.operatorType ? (String(query.operatorType) as OperatorType) : undefined;

  const where: Record<string, unknown> = {};
  if (role) where.role = role;
  if (operatorType) where.operatorType = operatorType;

  const [data, total] = await Promise.all([
    prisma.user.findMany({
      where,
      skip,
      take,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        username: true,
        role: true,
        operatorType: true,
        isActive: true,
        createdAt: true,
      },
    }),
    prisma.user.count({ where }),
  ]);

  return buildPaginatedResponse(data, total, page, pageSize);
}

export async function createUser(
  adminId: string,
  username: string,
  password: string,
  role: Role,
  operatorType?: OperatorType
) {
  const existing = await prisma.user.findUnique({ where: { username } });
  if (existing) throw new AppError(409, `Username "${username}" is already taken`);

  const passwordHash = await bcrypt.hash(password, 12);

  const user = await prisma.user.create({
    data: {
      username,
      passwordHash,
      role,
      operatorType: role === 'OPERATOR' ? operatorType : null,
      isActive: true,
    },
    select: {
      id: true,
      username: true,
      role: true,
      operatorType: true,
      isActive: true,
      createdAt: true,
    },
  });

  await createLog(adminId, 'USER_CREATION', { username, role, operatorType });
  return user;
}

export async function updateUser(
  adminId: string,
  userId: string,
  data: { username?: string; password?: string; role?: Role; operatorType?: OperatorType | null; isActive?: boolean }
) {
  const existing = await prisma.user.findUnique({ where: { id: userId } });
  if (!existing) throw new AppError(404, 'User not found');

  if (data.username && data.username !== existing.username) {
    const nameConflict = await prisma.user.findUnique({ where: { username: data.username } });
    if (nameConflict) throw new AppError(409, `Username "${data.username}" is already taken`);
  }

  // Prevent admin from deactivating themselves
  if (data.isActive === false && userId === adminId) {
    throw new AppError(400, 'Cannot deactivate your own account');
  }

  const updateData: Record<string, unknown> = {};
  if (data.username) updateData.username = data.username;
  if (data.password) updateData.passwordHash = await bcrypt.hash(data.password, 12);
  if (data.role !== undefined) {
    updateData.role = data.role;
    // Clear operatorType if switching to ADMIN
    updateData.operatorType = data.role === 'ADMIN' ? null : (data.operatorType ?? existing.operatorType);
  } else if (data.operatorType !== undefined) {
    updateData.operatorType = data.operatorType;
  }
  if (data.isActive !== undefined) updateData.isActive = data.isActive;

  const updated = await prisma.user.update({
    where: { id: userId },
    data: updateData,
    select: {
      id: true,
      username: true,
      role: true,
      operatorType: true,
      isActive: true,
      createdAt: true,
    },
  });

  return updated;
}

export async function resetPassword(adminId: string, userId: string, newPassword: string) {
  const existing = await prisma.user.findUnique({ where: { id: userId } });
  if (!existing) throw new AppError(404, 'User not found');

  const passwordHash = await bcrypt.hash(newPassword, 12);
  await prisma.user.update({ where: { id: userId }, data: { passwordHash } });
  return { success: true };
}
