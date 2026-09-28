export class OrderItem {
  id!: number;
  orderId!: number;

  productId!: number;
  variantId!: number | null;

  quantity!: number;
  price!: number;
  subtotal!: number;

  createdAt!: Date;
  updatedAt!: Date;
}
