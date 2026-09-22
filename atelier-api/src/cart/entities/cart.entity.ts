import { CartItem } from './cart-item.entity.js';

export class Cart {
  id!: number;
  userId!: number;
  items!: CartItem[];
  createdAt!: Date;
  updatedAt!: Date;
}
