import { prisma } from '../../lib/prisma';

export async function resetAllData(): Promise<void> {
  // Delete in reverse dependency order to respect foreign key constraints
  await prisma.userLog.deleteMany();
  await prisma.ledgerEntry.deleteMany();
  await prisma.openingBalance.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.receipt.deleteMany();
  await prisma.paymentMethod.deleteMany();
  await prisma.product.deleteMany();
  await prisma.category.deleteMany();
  await prisma.brand.deleteMany();
  await prisma.store.deleteMany();
}
