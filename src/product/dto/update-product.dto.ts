import { z } from 'zod';

export const UpdateProductSchema = z.object({
  name: z.string().trim().min(1).max(100).optional(),
  description: z.string().trim().optional(),
  price: z.coerce.number().positive().optional(),
  stock: z.coerce.number().int().min(0).optional(),
  categoryId: z.coerce.number().int().positive().optional(),
});

export type UpdateProductDto = z.infer<typeof UpdateProductSchema>;
