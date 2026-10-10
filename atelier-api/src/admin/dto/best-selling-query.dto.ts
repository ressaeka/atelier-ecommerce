import { z } from 'zod';

export const BestSellingQuerySchema = z
  .object({
    startDate: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, 'Format startDate harus YYYY-MM-DD')
      .optional(),
    endDate: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, 'Format endDate harus YYYY-MM-DD')
      .optional(),
    search: z.string().trim().optional(),
    sortBy: z.enum(['sold', 'revenue', 'orderCount']).default('sold'),
    sortOrder: z.enum(['asc', 'desc']).default('desc'),
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(100).default(10),
  })
  .refine(
    (data) => {
      if (data.startDate && data.endDate) {
        return data.startDate <= data.endDate;
      }
      return true;
    },
    {
      message: 'startDate tidak boleh lebih besar dari endDate',
      path: ['startDate'],
    },
  );

export type BestSellingQueryDto = z.infer<typeof BestSellingQuerySchema>;
