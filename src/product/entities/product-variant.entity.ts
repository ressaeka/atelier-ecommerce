export class ProductVariant {
  id!: number;
  productId!: number;
  color!: string | null;
  size!: string | null;
  price!: number;
  stock!: number;
  sku!: string | null;
  createdAt!: Date;
  updatedAt!: Date;
}
