import { z } from 'zod';

export const CustomerReportQuerySchema = z.object({
  startDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Format startDate harus YYYY-MM-DD')
    .optional(),
  endDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Format endDate harus YYYY-MM-DD')
    .optional(),
  customerType: z.enum(['all', 'active', 'inactive']).default('all').optional(),
  search: z.string().trim().max(100).optional(),
  sortBy: z
    .enum(['totalSpent', 'totalOrders', 'name', 'registeredAt'])
    .default('totalSpent')
    .optional(),
  sortOrder: z.enum(['asc', 'desc']).default('desc').optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
});

export type CustomerReportQueryDto = z.infer<
  typeof CustomerReportQuerySchema
>;
