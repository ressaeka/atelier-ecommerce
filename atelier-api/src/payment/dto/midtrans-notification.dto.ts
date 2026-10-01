import { z } from 'zod';

export const MidtransNotificationSchema = z
  .object({
    order_id: z.string().min(1),
    status_code: z.string().min(1),
    gross_amount: z.string().min(1),
    signature_key: z.string().min(1),
    transaction_status: z.string().min(1),

    fraud_status: z.string().optional().nullable(),
    payment_type: z.string().optional().nullable(),
    transaction_id: z.string().optional().nullable(),
    transaction_time: z.string().optional().nullable(),
    settlement_time: z.string().optional().nullable(),
  })
  .passthrough();

export type MidtransNotificationDto = z.infer<
  typeof MidtransNotificationSchema
>;
