import { Product } from '../../product/entities/product.entity.js';

export class Category {
  id!: number;
  name!: string;
  products!: Product[];
  productCount!: number;
  createdAt!: Date;
  updatedAt!: Date;
}
