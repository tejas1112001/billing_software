import { PrismaClient, Role, OperatorType } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting seed...');

  // Clean up existing data in reverse dependency order
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
  await prisma.user.deleteMany();

  // ── Payment Methods ──────────────────────────────────────────────────────
  const pmCash = await prisma.paymentMethod.create({ data: { name: 'Cash', isActive: true } });
  const pmUpi = await prisma.paymentMethod.create({ data: { name: 'UPI', isActive: true } });
  const pmCredit = await prisma.paymentMethod.create({ data: { name: 'Credit', isActive: true } });
  console.log(`✅ Created payment methods: Cash, UPI, Credit`);

  // ── Users ────────────────────────────────────────────────────────────────
  const adminHash = await bcrypt.hash('Admin@123', 12);
  const opHash = await bcrypt.hash('Op@123', 12);

  const admin = await prisma.user.create({
    data: { username: 'admin', passwordHash: adminHash, role: Role.ADMIN, isActive: true },
  });

  // 5 Cash operators + 5 Credit operators
  const cashOps = await Promise.all(
    Array.from({ length: 5 }, (_, i) =>
      prisma.user.create({
        data: {
          username: `cash_op${i + 1}`,
          passwordHash: opHash,
          role: Role.OPERATOR,
          operatorType: OperatorType.CASH,
          isActive: true,
        },
      })
    )
  );

  const creditOps = await Promise.all(
    Array.from({ length: 5 }, (_, i) =>
      prisma.user.create({
        data: {
          username: `credit_op${i + 1}`,
          passwordHash: opHash,
          role: Role.OPERATOR,
          operatorType: OperatorType.CREDIT,
          isActive: true,
        },
      })
    )
  );

  console.log(`✅ Created 1 admin + 5 cash operators + 5 credit operators`);

  // ── Stores ───────────────────────────────────────────────────────────────
  const store1 = await prisma.store.create({
    data: { name: 'Main Store - Mumbai', address: '12, Park Street', city: 'Mumbai', pincode: '400001', mobile: '9876543210', email: 'mumbai@billingsoftware.com' },
  });
  const store2 = await prisma.store.create({
    data: { name: 'Branch Store - Delhi', address: '45, Connaught Place', city: 'Delhi', pincode: '110001', mobile: '9876543211', email: 'delhi@billingsoftware.com' },
  });
  console.log(`✅ Created stores: ${store1.name}, ${store2.name}`);

  // ── Brands ───────────────────────────────────────────────────────────────
  const samsung = await prisma.brand.create({ data: { name: 'Samsung' } });
  const lg = await prisma.brand.create({ data: { name: 'LG' } });
  const sony = await prisma.brand.create({ data: { name: 'Sony' } });
  console.log(`✅ Created brands: Samsung, LG, Sony`);

  // ── Categories ───────────────────────────────────────────────────────────
  const samsungTV = await prisma.category.create({ data: { name: 'Television', brandId: samsung.id } });
  const samsungAC = await prisma.category.create({ data: { name: 'Air Conditioner', brandId: samsung.id } });
  const lgTV = await prisma.category.create({ data: { name: 'Television', brandId: lg.id } });
  const lgFridge = await prisma.category.create({ data: { name: 'Refrigerator', brandId: lg.id } });
  const sonyTV = await prisma.category.create({ data: { name: 'Television', brandId: sony.id } });
  const sonyAudio = await prisma.category.create({ data: { name: 'Audio System', brandId: sony.id } });
  console.log(`✅ Created 6 categories`);

  // ── Products ─────────────────────────────────────────────────────────────
  const products = await Promise.all([
    prisma.product.create({ data: { modelName: 'Samsung 43" 4K UHD Smart TV', mrp: 52000, nlc: 44000, availableQty: 15, brandId: samsung.id, categoryId: samsungTV.id } }),
    prisma.product.create({ data: { modelName: 'Samsung 55" QLED Smart TV', mrp: 95000, nlc: 82000, availableQty: 8, brandId: samsung.id, categoryId: samsungTV.id } }),
    prisma.product.create({ data: { modelName: 'Samsung 1.5T Inverter Split AC', mrp: 48000, nlc: 41000, availableQty: 20, brandId: samsung.id, categoryId: samsungAC.id } }),
    prisma.product.create({ data: { modelName: 'LG 43" Full HD Smart TV', mrp: 46000, nlc: 39000, availableQty: 12, brandId: lg.id, categoryId: lgTV.id } }),
    prisma.product.create({ data: { modelName: 'LG 55" OLED Smart TV', mrp: 135000, nlc: 118000, availableQty: 5, brandId: lg.id, categoryId: lgTV.id } }),
    prisma.product.create({ data: { modelName: 'LG 260L Double Door Fridge', mrp: 32000, nlc: 27500, availableQty: 18, brandId: lg.id, categoryId: lgFridge.id } }),
    prisma.product.create({ data: { modelName: 'LG 450L Side-by-Side Fridge', mrp: 75000, nlc: 64000, availableQty: 7, brandId: lg.id, categoryId: lgFridge.id } }),
    prisma.product.create({ data: { modelName: 'Sony 50" X75K 4K Smart TV', mrp: 68000, nlc: 58000, availableQty: 10, brandId: sony.id, categoryId: sonyTV.id } }),
    prisma.product.create({ data: { modelName: 'Sony HT-S400 Soundbar', mrp: 22000, nlc: 18500, availableQty: 25, brandId: sony.id, categoryId: sonyAudio.id } }),
    prisma.product.create({ data: { modelName: 'Sony HT-A9 Home Theatre', mrp: 85000, nlc: 72000, availableQty: 4, brandId: sony.id, categoryId: sonyAudio.id } }),
  ]);
  console.log(`✅ Created ${products.length} products`);

  console.log('\n🎉 Seed completed successfully!\n');
  console.log('Login credentials:');
  console.log('  Admin:         username=admin        password=Admin@123');
  console.log('  Cash Ops:      username=cash_op1..5  password=Op@123');
  console.log('  Credit Ops:    username=credit_op1..5 password=Op@123');
}

main()
  .then(async () => { await prisma.$disconnect(); })
  .catch(async (e) => { console.error(e); await prisma.$disconnect(); process.exit(1); });
