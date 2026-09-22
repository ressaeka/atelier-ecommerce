import { z } from 'zod';

export const createWishlistItemSchema = z.object({
  productId: z.coerce.number().int().positive(),
});

export type CreateWishlistItemDto = z.infer<typeof createWishlistItemSchema>;
