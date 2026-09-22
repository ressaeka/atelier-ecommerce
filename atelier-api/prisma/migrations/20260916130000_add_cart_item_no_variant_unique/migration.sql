-- Create a partial unique index to prevent duplicate no-variant cart items.
-- PostgreSQL treats NULL as distinct in unique constraints, so @@unique([cartId, productId, variantId])
-- alone does NOT prevent multiple rows with variantId=NULL for the same cartId+productId.
-- This partial unique index enforces the business rule at the database level.
CREATE UNIQUE INDEX "cartItem_no_variant_unique" ON "CartItem"("cartId", "productId") WHERE "variantId" IS NULL;
