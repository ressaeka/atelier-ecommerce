import { PaymentStatus } from '../../../generated/prisma/client.js';

export class Payment {
  id!: number;
  orderId!: number;
  provider!: string;
  midtransOrderId!: string;
  snapToken!: string | null;
  attempt!: number;
  status!: PaymentStatus;
  transactionStatus!: string | null;
  fraudStatus!: string | null;
  grossAmount!: number;
  createdAt!: Date;
  updatedAt!: Date;
}
