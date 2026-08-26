import { z } from 'zod';

export const CategorySchema = z.object({
  name: z
    .string()
    .trim()
    .min(20, 'Nama minimal 20 karakter')
    .max(50, 'Nama maksimal 50 karakter'),
});

export type CreateCategoryDto = z.infer<typeof CategorySchema>;
