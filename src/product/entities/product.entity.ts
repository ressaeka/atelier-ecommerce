export class Product {
  id!: number;
  name!: string;
  description!: string | null;
  price!: number;
  stock!: number;
  categoryId!: number;
  createdAt!: Date;
  updatedAt!: Date;
}
