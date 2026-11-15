import { z } from 'zod';

export const CategorySchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'Nama wajib diisi')
    .max(50, 'Nama maksimal 50 karakter'),
  image: z.string().trim().max(255).optional().nullable(),
});

export type CreateCategoryDto = z.infer<typeof CategorySchema>;
