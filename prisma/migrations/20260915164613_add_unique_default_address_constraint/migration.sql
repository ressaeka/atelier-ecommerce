-- Add partial unique index to ensure only one default address per user
-- This prevents race conditions at database level
CREATE UNIQUE INDEX "Address_userId_isDefault_unique" 
ON "Address"("userId") 
WHERE "isDefault" = true;
