-- Make brandId nullable on Category
ALTER TABLE "Category" ALTER COLUMN "brandId" DROP NOT NULL;

-- Make brandId and categoryId nullable on Product
ALTER TABLE "Product" ALTER COLUMN "brandId" DROP NOT NULL;
ALTER TABLE "Product" ALTER COLUMN "categoryId" DROP NOT NULL;
