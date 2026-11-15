import { z } from 'zod';

export const SalesReportQuerySchema = z
  .object({
    periodType: z.enum(['today', 'monthly', 'yearly', 'custom']).optional(),
    month: z.coerce.number().int().min(1).max(12).optional(),
    year: z.coerce.number().int().min(2000).max(2100).optional(),
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
    sortBy: z
      .enum(['createdAt', 'total', 'recognizedRevenue', 'status'])
      .optional(),
    sortOrder: z.enum(['asc', 'desc']).optional(),
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
