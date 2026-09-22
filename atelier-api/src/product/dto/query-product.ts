import { z } from 'zod';

export const queryProductSchema = z.object({
  page: z.coerce
    .number()
    .int('Page harus bilangan bulat')
    .min(1, 'Page minimal 1')
    .default(1),

  limit: z.coerce
    .number()
    .int('Limit harus bilangan bulat')
    .min(1, 'Limit minimal 1')
    .max(50, 'Limit maksimal 50')
    .default(10),

  search: z
    .string()
    .trim()
    .max(100, 'Pencarian maksimal 100 karakter')
    .optional(),

  categoryId: z.coerce
    .number()
    .int('Category ID harus bilangan bulat')
    .positive('Category ID harus positif')
    .optional(),

  minPrice: z.coerce
    .number()
    .nonnegative('Harga minimal tidak boleh negatif')
    .optional(),

  maxPrice: z.coerce
    .number()
    .nonnegative('Harga maksimal tidak boleh negatif')
    .optional(),
});

export type QueryProductDto = z.infer<typeof queryProductSchema>;
