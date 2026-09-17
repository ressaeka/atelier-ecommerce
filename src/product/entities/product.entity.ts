export class Product {
  id!: number;
  name!: string;
  description!: string | null;
  price!: number;
  stock!: number;
  image!: string;
  categoryId!: number;
  variants?: any[];
  createdAt!: Date;
  updatedAt!: Date;
}
