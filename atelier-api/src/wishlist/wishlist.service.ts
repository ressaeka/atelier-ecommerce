import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { WishlistRepository } from './wishlist.repository.js';

@Injectable()
export class WishlistService {
  constructor(private readonly wishlistRepository: WishlistRepository) {}

  async getWishlist(userId: number) {
    const wishlist =
      await this.wishlistRepository.findByUserIdWithItems(userId);

    if (wishlist) {
      return wishlist;
    }

    const newWishlist = await this.wishlistRepository.create(userId);

    return {
      id: newWishlist.id,
      userId: newWishlist.userId,
      items: [],
    };
  }

  async addItem(userId: number, productId: number) {
    let wishlist = await this.wishlistRepository.findByUserId(userId);

    if (!wishlist) {
      wishlist = await this.wishlistRepository.create(userId);
    }

    const existingItem = await this.wishlistRepository.findItem(
      wishlist.id,
      productId,
    );

    if (existingItem) {
      throw new ConflictException('Product already exists in wishlist');
    }

    return this.wishlistRepository.createItem(wishlist.id, productId);
  }

  async removeItem(userId: number, productId: number) {
    const wishlist = await this.wishlistRepository.findByUserId(userId);

    if (!wishlist) {
      throw new NotFoundException('Wishlist not found');
    }

    const item = await this.wishlistRepository.findItem(wishlist.id, productId);

    if (!item) {
      throw new NotFoundException('Product not found in wishlist');
    }

    return this.wishlistRepository.deleteItem(wishlist.id, productId);
  }
}
