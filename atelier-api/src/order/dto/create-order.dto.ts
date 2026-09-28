import { z } from 'zod';

export const OrderSchema = z.object({
  addressId: z.number().int().positive(),
});

export type CreateOrderDto = z.infer<typeof OrderSchema>;
