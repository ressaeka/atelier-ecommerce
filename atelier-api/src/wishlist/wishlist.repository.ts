import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';

@Injectable()
export class WishlistRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findByUserId(userId: number) {
    return this.prisma.wishlist.findUnique({
      where: {
        userId,
      },
    });
  }

  async findByUserIdWithItems(userId: number) {
    return this.prisma.wishlist.findUnique({
      where: {
        userId,
      },
      include: {
        items: {
          include: {
            product: true,
          },
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
    });
  }

  async create(userId: number) {
    return this.prisma.wishlist.create({
      data: {
        userId,
      },
    });
  }

  async findItem(wishlistId: number, productId: number) {
    return this.prisma.wishlistItem.findUnique({
      where: {
        wishlistId_productId: {
          wishlistId,
          productId,
        },
      },
    });
  }

  async createItem(wishlistId: number, productId: number) {
    return this.prisma.wishlistItem.create({
      data: {
        wishlistId,
        productId,
      },
      include: {
        product: true,
      },
    });
  }

  async deleteItem(wishlistId: number, productId: number) {
    return this.prisma.wishlistItem.delete({
      where: {
        wishlistId_productId: {
          wishlistId,
          productId,
        },
      },
    });
  }
}
