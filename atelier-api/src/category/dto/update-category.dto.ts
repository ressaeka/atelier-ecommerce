import { z } from 'zod';

export const updateCategorySchema = z.object({
  name: z.string().trim().min(1).max(50).optional(),
  image: z.string().trim().max(255).optional().nullable(),
});

export type UpdateCategoryDto = z.infer<typeof updateCategorySchema>;
