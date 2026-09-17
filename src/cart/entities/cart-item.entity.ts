import { Product } from '../../product/entities/product.entity.js';
import { ProductVariant } from '../../product/entities/product-variant.entity.js';

export class CartItem {
  id!: number;
  cartId!: number;
  productId!: number;
  variantId?: number | null;
  quantity!: number;
  product?: Product;
  variant?: ProductVariant | null;
  createdAt!: Date;
  updatedAt!: Date;
}
