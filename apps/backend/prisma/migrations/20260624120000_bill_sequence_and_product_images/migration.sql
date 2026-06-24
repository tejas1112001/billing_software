-- CreateTable
CREATE TABLE "ProductImage" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProductImage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BillCounter" (
    "id" TEXT NOT NULL DEFAULT 'global',
    "value" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "BillCounter_pkey" PRIMARY KEY ("id")
);

-- Migrate existing product images
INSERT INTO "ProductImage" ("id", "productId", "url", "sortOrder", "createdAt")
SELECT
    gen_random_uuid()::text,
    "id",
    "imageUrl",
    0,
    NOW()
FROM "Product"
WHERE "imageUrl" IS NOT NULL AND "imageUrl" <> '';

-- Initialize bill counter from existing orders
INSERT INTO "BillCounter" ("id", "value")
SELECT 'global', COUNT(*)::int FROM "Order"
ON CONFLICT ("id") DO UPDATE SET "value" = EXCLUDED."value";

-- CreateIndex
CREATE INDEX "ProductImage_productId_idx" ON "ProductImage"("productId");

-- AddForeignKey
ALTER TABLE "ProductImage" ADD CONSTRAINT "ProductImage_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- DropForeignKey
ALTER TABLE "OrderItem" DROP CONSTRAINT "OrderItem_orderId_fkey";

-- AddForeignKey
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;
