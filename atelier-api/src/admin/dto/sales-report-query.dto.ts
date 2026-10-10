import { z } from 'zod';

export const SalesReportQuerySchema = z
  .object({
    startDate: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, 'Format startDate harus YYYY-MM-DD')
      .optional(),
    endDate: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, 'Format endDate harus YYYY-MM-DD')
      .optional(),
    status: z
      .enum([
        'ALL',
        'PAID',
        'PROCESSING',
        'SHIPPED',
        'DELIVERED',
        'PENDING',
        'CANCELLED',
        'EXPIRED',
      ])
      .default('ALL'),
    search: z.string().trim().optional(),
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

export type SalesReportQueryDto = z.infer<typeof SalesReportQuerySchema>;
