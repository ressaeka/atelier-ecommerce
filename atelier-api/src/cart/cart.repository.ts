import { Injectable } from '@nestjs/common';
import { Prisma } from '../../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';

@Injectable()
export class CartRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findByUserId(userId: number) {
    return this.prisma.cart.findUnique({
      where: { userId },
      include: {
        items: {
          include: {
            product: true,
            variant: true,
          },
        },
      },
    });
  }

  async create(userId: number) {
    return this.prisma.cart.create({
      data: {
        user: {
          connect: {
            id: userId,
          },
        },
      },
      include: {
        items: {
          include: {
            product: true,
            variant: true,
          },
        },
      },
    });
  }

  async addItem(data: Prisma.CartItemCreateInput) {
    return this.prisma.cartItem.create({
      data,
      include: {
        product: true,
        variant: true,
      },
    });
  }

  async findItem(cartId: number, productId: number, variantId?: number | null) {
    return this.prisma.cartItem.findFirst({
      where: {
        cartId,
        productId,
        variantId: variantId ?? null,
      },
      include: {
        product: true,
        variant: true,
      },
    });
  }

  async updateItem(id: number, data: Prisma.CartItemUpdateInput) {
    return this.prisma.cartItem.update({
      where: { id },
      data,
      include: {
        product: true,
        variant: true,
      },
    });
  }

  async removeItem(id: number) {
    return this.prisma.cartItem.delete({
      where: { id },
    });
  }

  async clearItems(cartId: number) {
    return this.prisma.cartItem.deleteMany({
      where: { cartId },
    });
  }
}
