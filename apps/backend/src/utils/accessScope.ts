import { Role } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { AppError } from '../middleware/errorHandler';

export type AccessScope = {
  isAdmin: boolean;
  actorId: string;
  /** Set for operators — always their own id. Undefined for admin (no forced filter). */
  scopedUserId?: string;
};

export async function resolveAccessScope(actorId: string, actorRole: Role): Promise<AccessScope> {
  if (actorRole === 'ADMIN') {
    return { isAdmin: true, actorId };
  }

  const user = await prisma.user.findUnique({
    where: { id: actorId },
    select: { id: true, role: true, isActive: true },
  });

  if (!user || !user.isActive) {
    throw new AppError(403, 'Access denied');
  }

  return { isAdmin: false, actorId, scopedUserId: user.id };
}

/** Apply list filter: operators always scoped to self; admin may pass userId query. */
export function resolveListUserId(
  scope: AccessScope,
  queryUserId?: string
): string | undefined {
  if (scope.isAdmin) {
    return queryUserId || undefined;
  }
  return scope.scopedUserId;
}

export async function assertOrderOwnership(orderId: string, scope: AccessScope): Promise<void> {
  if (scope.isAdmin) return;

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: { userId: true },
  });

  if (!order) throw new AppError(404, 'Order not found');
  if (order.userId !== scope.scopedUserId) {
    throw new AppError(403, 'You do not have access to this bill');
  }
}

export async function assertReceiptOwnership(receiptId: string, scope: AccessScope): Promise<void> {
  if (scope.isAdmin) return;

  const receipt = await prisma.receipt.findUnique({
    where: { id: receiptId },
    select: { userId: true },
  });

  if (!receipt) throw new AppError(404, 'Receipt not found');
  if (receipt.userId !== scope.scopedUserId) {
    throw new AppError(403, 'You do not have access to this receipt');
  }
}
