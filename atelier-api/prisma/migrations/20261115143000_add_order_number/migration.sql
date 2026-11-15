-- AlterTable
ALTER TABLE "Order" ADD COLUMN "orderNumber" VARCHAR(50);

-- CreateIndex
CREATE UNIQUE INDEX "Order_orderNumber_key" ON "Order"("orderNumber");
