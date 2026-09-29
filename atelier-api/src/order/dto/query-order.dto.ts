import { z } from 'zod';

export const OrderQuerySchema = z.object({
  page: z.coerce
    .number()
    .int()
    .positive()
    .default(1),

  limit: z.coerce
    .number()
    .int()
    .positive()
    .max(100)
    .default(10),

  search: z
    .string()
    .trim()
    .optional(),

  userId: z.coerce
    .number()
    .int()
    .positive()
    .optional(),

  status: z
    .enum([
      'PENDING',
      'PAID',
      'PROCESSING',
      'SHIPPED',
      'DELIVERED',
      'CANCELLED',
      'EXPIRED',
    ])
    .optional(),

  sortBy: z
    .enum([
      'createdAt',
      'total',
      'status',
    ])
    .default('createdAt'),

  sortOrder: z
    .enum(['asc', 'desc'])
    .default('desc'),
});

export type OrderQueryDto =
  z.infer<typeof OrderQuerySchema>;