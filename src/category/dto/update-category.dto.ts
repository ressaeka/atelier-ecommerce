import { z } from 'zod';

export const updateCategorySchema = z.object({
  name: z.string().trim().min(1).max(50),
});

export type UpdateCategoryDto = z.infer<typeof updateCategorySchema>;
