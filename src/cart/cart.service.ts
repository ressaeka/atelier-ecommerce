import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';

import { CartRepository } from './cart.repository.js';
import { ProductRepository } from '../product/product.repository.js';
import { AddCartItemDto } from './dto/create-cart.dto.js';
import { UpdateCartItemDto } from './dto/update-cart.dto.js';
import { Cart } from './entities/cart.entity.js';
import { CartItem } from './entities/cart-item.entity.js';

@Injectable()
export class CartService {
  constructor(
    private readonly cartRepository: CartRepository,
    private readonly productRepository: ProductRepository,
  ) {}

  async findCart(currentUserId: number): Promise<Cart> {
    const cart = await this.cartRepository.findByUserId(currentUserId);

    if (!cart) {
      return this.createCart(currentUserId);
    }

    return this.toCartEntity(cart);
  }

  async addItem(currentUserId: number, dto: AddCartItemDto): Promise<CartItem> {
    let cart = await this.cartRepository.findByUserId(currentUserId);

    if (!cart) {
      cart = await this.cartRepository.create(currentUserId);
    }

    const item = await this.cartRepository.findItem(
      cart.id,
      dto.productId,
      dto.variantId,
    );

    if (item) {
      const newQuantity = item.quantity + dto.quantity;

      const stock = dto.variantId
        ? (item.variant?.stock ?? item.product.stock)
        : item.product.stock;

      if (newQuantity > stock) {
        throw new BadRequestException('Quantity melebihi stock produk');
      }

      return this.toCartItemEntity(
        await this.cartRepository.updateItem(item.id, {
          quantity: newQuantity,
        }),
      );
    }

    const product = await this.productRepository.findById(dto.productId);

    if (!product) {
      throw new NotFoundException('Product tidak ditemukan');
    }

    let stock = product.stock;

    if (dto.variantId) {
      const variant = product.variants?.find((v) => v.id === dto.variantId);
      if (!variant) {
        throw new NotFoundException('Varian produk tidak ditemukan');
      }
      stock = variant.stock;
    }

    if (dto.quantity > stock) {
      throw new BadRequestException('Quantity melebihi stock produk');
    }

    const createData: any = {
      cart: { connect: { id: cart.id } },
      product: { connect: { id: dto.productId } },
      quantity: dto.quantity,
    };

    if (dto.variantId) {
      createData.variant = { connect: { id: dto.variantId } };
    }

    const createdItem = await this.cartRepository.addItem(createData);

    return this.toCartItemEntity(createdItem);
  }

  async updateItem(
    currentUserId: number,
    productId: number,
    dto: UpdateCartItemDto,
    variantId?: number | null,
  ): Promise<CartItem> {
    const cart = await this.cartRepository.findByUserId(currentUserId);

    if (!cart) {
      throw new NotFoundException('Cart tidak ditemukan');
    }

    const item = await this.cartRepository.findItem(
      cart.id,
      productId,
      variantId,
    );

    if (!item) {
      throw new NotFoundException('Product tidak ada di cart');
    }

    const stock = variantId
      ? (item.variant?.stock ?? item.product.stock)
      : item.product.stock;

    if (dto.quantity > stock) {
      throw new BadRequestException('Quantity melebihi stock produk');
    }

    const updatedItem = await this.cartRepository.updateItem(item.id, {
      quantity: dto.quantity,
    });

    return this.toCartItemEntity(updatedItem);
  }

  async removeItem(
    currentUserId: number,
    productId: number,
    variantId?: number | null,
  ) {
    const cart = await this.cartRepository.findByUserId(currentUserId);

    if (!cart) {
      throw new NotFoundException('Cart tidak ditemukan');
    }

    const item = await this.cartRepository.findItem(
      cart.id,
      productId,
      variantId,
    );

    if (!item) {
      throw new NotFoundException('Product tidak ada di cart');
    }

    await this.cartRepository.removeItem(item.id);

    return {
      message: 'Product berhasil dihapus dari cart',
    };
  }

  async clearCart(currentUserId: number) {
    const cart = await this.cartRepository.findByUserId(currentUserId);

    if (!cart) {
      throw new NotFoundException('Cart tidak ditemukan');
    }

    await this.cartRepository.clearItems(cart.id);

    return {
      message: 'Cart berhasil dikosongkan',
    };
  }

  private async createCart(currentUserId: number): Promise<Cart> {
    const cart = await this.cartRepository.create(currentUserId);

    return this.toCartEntity(cart);
  }

  private toCartEntity(cart: {
    id: number;
    userId: number;
    items: Array<{
      id: number;
      cartId: number;
      productId: number;
      variantId: number | null;
      quantity: number;
      createdAt: Date;
      updatedAt: Date;
    }>;
    createdAt: Date;
    updatedAt: Date;
  }): Cart {
    const entity = new Cart();

    entity.id = cart.id;
    entity.userId = cart.userId;
    entity.items = cart.items.map((item) => this.toCartItemEntity(item));
    entity.createdAt = cart.createdAt;
    entity.updatedAt = cart.updatedAt;

    return entity;
  }

  private toCartItemEntity(item: {
    id: number;
    cartId: number;
    productId: number;
    variantId?: number | null;
    quantity: number;
    createdAt: Date;
    updatedAt: Date;
    product?: any;
    variant?: any;
  }): CartItem {
    const entity = new CartItem();

    entity.id = item.id;
    entity.cartId = item.cartId;
    entity.productId = item.productId;
    entity.variantId = item.variantId ?? null;
    entity.quantity = item.quantity;
    entity.createdAt = item.createdAt;
    entity.updatedAt = item.updatedAt;
    if (item.product) {
      entity.product = item.product;
    }
    if (item.variant) {
      entity.variant = item.variant;
    }

    return entity;
  }
}
