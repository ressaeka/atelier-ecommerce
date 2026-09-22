import { z } from 'zod';

export const createProductSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  price: z.number().int().positive(),
  stock: z.number().int().nonnegative(),
  image: z.string().url(),
  categoryId: z.number().int().positive(),
});

export type CreateProductDto = z.infer<typeof createProductSchema>;
