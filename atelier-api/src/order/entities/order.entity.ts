import { OrderStatus } from '../../../generated/prisma/enums.js';
import { OrderItem } from './orderItem.entity.js';

export class Order {
  id!: number;
  userId!: number;
  status!: OrderStatus;

  subtotal!: number;
  shippingFee!: number;
  total!: number;

  recipientName!: string;
  phone!: string;
  addressLine!: string;
  city!: string;
  province!: string;
  postalCode!: string;

  items!: OrderItem[];

  createdAt!: Date;
  updatedAt!: Date;
}
