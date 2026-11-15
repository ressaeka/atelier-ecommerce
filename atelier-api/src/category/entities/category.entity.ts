import { Product } from '../../product/entities/product.entity.js';

export class Category {
  id!: number;
  name!: string;
  image?: string | null;
  products!: Product[];
  productCount!: number;
  createdAt!: Date;
  updatedAt!: Date;
}
