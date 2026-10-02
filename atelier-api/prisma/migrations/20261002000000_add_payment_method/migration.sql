-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('GOPAY', 'VIRTUAL_ACCOUNT', 'SHOPEEPAY', 'OVO', 'DANA', 'QRIS');

-- AlterTable
ALTER TABLE "Payment" ADD COLUMN "paymentMethod" "PaymentMethod";

-- CreateIndex
CREATE INDEX "Payment_paymentMethod_idx" ON "Payment"("paymentMethod");
