import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🔄 Resetting all tables (except User)...');

  // Delete in reverse dependency order to respect foreign key constraints
  await prisma.userLog.deleteMany();
  console.log('✅ Cleared: UserLog');

  await prisma.ledgerEntry.deleteMany();
  console.log('✅ Cleared: LedgerEntry');

  await prisma.openingBalance.deleteMany();
  console.log('✅ Cleared: OpeningBalance');

  await prisma.orderItem.deleteMany();
  console.log('✅ Cleared: OrderItem');

  await prisma.order.deleteMany();
  console.log('✅ Cleared: Order');

  await prisma.receipt.deleteMany();
  console.log('✅ Cleared: Receipt');

  await prisma.paymentMethod.deleteMany();
  console.log('✅ Cleared: PaymentMethod');

  await prisma.product.deleteMany();
  console.log('✅ Cleared: Product');

  await prisma.category.deleteMany();
  console.log('✅ Cleared: Category');

  await prisma.brand.deleteMany();
  console.log('✅ Cleared: Brand');

  await prisma.store.deleteMany();
  console.log('✅ Cleared: Store');

  console.log('\n🎉 Reset complete! User table preserved.');
}

main()
  .then(async () => { await prisma.$disconnect(); })
  .catch(async (e) => { console.error(e); await prisma.$disconnect(); process.exit(1); });
