import { z } from 'zod';

export const addCartItemSchema = z.object({
  productId: z.number().int().positive(),
  quantity: z.number().int().positive(),
  variantId: z.number().int().positive().nullable().optional(),
});

export type AddCartItemDto = z.infer<typeof addCartItemSchema>;
