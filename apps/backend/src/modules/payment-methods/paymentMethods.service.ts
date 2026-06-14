import { prisma } from '../../lib/prisma';
import { AppError } from '../../middleware/errorHandler';
import { createLog } from '../user-logs/userLog.service';

export async function listPaymentMethods(activeOnly = false) {
  return prisma.paymentMethod.findMany({
    where: activeOnly ? { isActive: true } : undefined,
    orderBy: { createdAt: 'asc' },
  });
}

export async function createPaymentMethod(userId: string, name: string) {
  const existing = await prisma.paymentMethod.findUnique({ where: { name } });
  if (existing) throw new AppError(409, `Payment method "${name}" already exists`);

  const pm = await prisma.paymentMethod.create({
    data: { name, isActive: true },
  });

  await createLog(userId, 'PAYMENT_METHOD_CREATION', { name });
  return pm;
}

export async function updatePaymentMethod(userId: string, id: string, data: { name?: string; isActive?: boolean }) {
  const existing = await prisma.paymentMethod.findUnique({ where: { id } });
  if (!existing) throw new AppError(404, 'Payment method not found');

  if (data.name && data.name !== existing.name) {
    const nameConflict = await prisma.paymentMethod.findUnique({ where: { name: data.name } });
    if (nameConflict) throw new AppError(409, `Payment method "${data.name}" already exists`);
  }

  const pm = await prisma.paymentMethod.update({
    where: { id },
    data,
  });

  await createLog(userId, 'PAYMENT_METHOD_UPDATE', { id, ...data });
  return pm;
}

export async function deletePaymentMethod(id: string) {
  const existing = await prisma.paymentMethod.findUnique({ where: { id } });
  if (!existing) throw new AppError(404, 'Payment method not found');

  // Soft delete — just deactivate
  return prisma.paymentMethod.update({ where: { id }, data: { isActive: false } });
}
