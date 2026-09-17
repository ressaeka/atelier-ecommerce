-- Partial unique index to prevent duplicate ProductVariant rows when both color and size are NULL.
-- PostgreSQL treats NULL as distinct in unique constraints, so @@unique([productId, color, size])
-- alone does NOT prevent multiple rows with color=NULL AND size=NULL for the same productId.
-- This enforces: one variant per product when no attributes are specified.
CREATE UNIQUE INDEX "productVariant_no_attr_unique" ON "ProductVariant"("productId") WHERE "color" IS NULL AND "size" IS NULL;
