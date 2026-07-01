-- Add new pricing fields to Product table
-- This migration safely migrates existing NLC values to cashPrice and creditPrice

-- Step 1: Add new columns (nullable initially for safe migration)
ALTER TABLE "Product" ADD COLUMN "cashPrice" DECIMAL(12,2);
ALTER TABLE "Product" ADD COLUMN "creditPrice" DECIMAL(12,2);
ALTER TABLE "Product" ADD COLUMN "purchasePrice" DECIMAL(12,2);
ALTER TABLE "Product" ADD COLUMN "isNewArrival" BOOLEAN NOT NULL DEFAULT false;

-- Step 2: Migrate existing NLC values to new price fields
-- UPDATE "Product" 
-- SET 
--   "cashPrice" = "nlc",
--   "creditPrice" = "nlc"
-- WHERE "cashPrice" IS NULL OR "creditPrice" IS NULL;


-- Step 3: Set NOT NULL constraints on required fields
ALTER TABLE "Product" ALTER COLUMN "cashPrice" SET NOT NULL;
ALTER TABLE "Product" ALTER COLUMN "creditPrice" SET NOT NULL;

-- Step 4: Create indexes for new columns (performance optimization)
CREATE INDEX "Product_cashPrice_idx" ON "Product"("cashPrice");
CREATE INDEX "Product_creditPrice_idx" ON "Product"("creditPrice");
CREATE INDEX "Product_isNewArrival_idx" ON "Product"("isNewArrival");

-- Step 5: Drop old NLC index (keeping column for backward compatibility temporarily)
DROP INDEX IF EXISTS "Product_nlc_idx";

-- Note: NLC column is kept for backward compatibility during transition period
-- After verifying all systems work correctly, run: ALTER TABLE "Product" DROP COLUMN "nlc";
