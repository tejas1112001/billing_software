-- Migration: Product Pricing Structure Enhancement
-- This migration adds cashPrice, creditPrice, purchasePrice, and isNewArrival fields
-- and migrates existing NLC values to the new price fields

-- Step 1: Add new columns (keeping NLC temporarily for backward compatibility)
ALTER TABLE "Product" 
  ADD COLUMN IF NOT EXISTS "cashPrice" DECIMAL(12,2),
  ADD COLUMN IF NOT EXISTS "creditPrice" DECIMAL(12,2),
  ADD COLUMN IF NOT EXISTS "purchasePrice" DECIMAL(12,2),
  ADD COLUMN IF NOT EXISTS "isNewArrival" BOOLEAN DEFAULT false;

-- Step 2: Migrate existing NLC values to cashPrice and creditPrice
UPDATE "Product" 
SET 
  "cashPrice" = "nlc",
  "creditPrice" = "nlc",
  "isNewArrival" = false
WHERE "cashPrice" IS NULL OR "creditPrice" IS NULL;

-- Step 3: Set NOT NULL constraints on required fields
ALTER TABLE "Product" 
  ALTER COLUMN "cashPrice" SET NOT NULL,
  ALTER COLUMN "creditPrice" SET NOT NULL,
  ALTER COLUMN "isNewArrival" SET NOT NULL,
  ALTER COLUMN "isNewArrival" SET DEFAULT false;

-- Step 4: Create indexes for new columns
CREATE INDEX IF NOT EXISTS "Product_cashPrice_idx" ON "Product"("cashPrice");
CREATE INDEX IF NOT EXISTS "Product_creditPrice_idx" ON "Product"("creditPrice");
CREATE INDEX IF NOT EXISTS "Product_isNewArrival_idx" ON "Product"("isNewArrival");

-- Step 5: Drop old NLC index
DROP INDEX IF EXISTS "Product_nlc_idx";

-- Step 6: Drop NLC column (OPTIONAL - uncomment after verifying everything works)
-- ALTER TABLE "Product" DROP COLUMN IF EXISTS "nlc";

-- Verification queries:
-- SELECT COUNT(*) FROM "Product" WHERE "cashPrice" IS NULL OR "creditPrice" IS NULL;
-- SELECT id, "modelName", "mrp", "cashPrice", "creditPrice", "purchasePrice", "isNewArrival" FROM "Product" LIMIT 10;
