import { z } from 'zod';

export const CreatePaymentSchema = z.object({
  orderId: z.coerce.number().int().positive(),
});

export type CreatePaymentDto = z.infer<typeof CreatePaymentSchema>;
