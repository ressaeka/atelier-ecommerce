import { z } from 'zod';

export const createProductSchema = z.object({
  name: z.string().trim().min(1, 'Nama product wajib diisi').max(100),

  description: z.string().trim().optional(),

  price: z.number().int().positive(),

  stock: z.number().int().nonnegative(),

  categoryId: z.number().int().positive(),
});

export type CreateProductDto = z.infer<typeof createProductSchema>;
