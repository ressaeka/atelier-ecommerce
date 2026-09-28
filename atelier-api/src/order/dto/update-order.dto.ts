import { z } from 'zod';

export const UpdateOrderStatusSchema = z.object({
  status: z.enum([
    'PENDING',
    'PAID',
    'PROCESSING',
    'SHIPPED',
    'DELIVERED',
    'CANCELLED',
    'EXPIRED',
  ]),
});

export type UpdateOrderStatusDto = z.infer<typeof UpdateOrderStatusSchema>;
export type UpdateOrderDto = UpdateOrderStatusDto;
export const updateOrderSchema = UpdateOrderStatusSchema;
