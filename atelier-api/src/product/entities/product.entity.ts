import { ProductVariant } from './product-variant.entity.js';

export class Product {
  id!: number;
  name!: string;
  description!: string | null;
  price!: number;
  stock!: number;
  image!: string;
  categoryId!: number;
  variants?: ProductVariant[];
  createdAt!: Date;
  updatedAt!: Date;
}
