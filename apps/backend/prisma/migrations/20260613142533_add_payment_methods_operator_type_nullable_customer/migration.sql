-- CreateEnum
CREATE TYPE "OperatorType" AS ENUM ('CASH', 'CREDIT');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "LogAction" ADD VALUE 'LOGOUT';
ALTER TYPE "LogAction" ADD VALUE 'USER_CREATION';
ALTER TYPE "LogAction" ADD VALUE 'PAYMENT_METHOD_CREATION';
ALTER TYPE "LogAction" ADD VALUE 'PAYMENT_METHOD_UPDATE';

-- AlterTable
ALTER TABLE "LedgerEntry" ALTER COLUMN "customerName" DROP NOT NULL;

-- AlterTable
ALTER TABLE "Order" ALTER COLUMN "customerName" DROP NOT NULL;

-- AlterTable
ALTER TABLE "Receipt" ADD COLUMN     "paymentMethodId" TEXT,
ALTER COLUMN "customerName" DROP NOT NULL,
ALTER COLUMN "customerName" DROP DEFAULT;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "operatorType" "OperatorType";

-- CreateTable
CREATE TABLE "PaymentMethod" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PaymentMethod_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PaymentMethod_name_key" ON "PaymentMethod"("name");

-- CreateIndex
CREATE INDEX "PaymentMethod_name_idx" ON "PaymentMethod"("name");

-- CreateIndex
CREATE INDEX "PaymentMethod_isActive_idx" ON "PaymentMethod"("isActive");

-- CreateIndex
CREATE INDEX "Receipt_paymentMethodId_idx" ON "Receipt"("paymentMethodId");

-- CreateIndex
CREATE INDEX "User_role_idx" ON "User"("role");

-- CreateIndex
CREATE INDEX "User_operatorType_idx" ON "User"("operatorType");

-- AddForeignKey
ALTER TABLE "Receipt" ADD CONSTRAINT "Receipt_paymentMethodId_fkey" FOREIGN KEY ("paymentMethodId") REFERENCES "PaymentMethod"("id") ON DELETE SET NULL ON UPDATE CASCADE;
