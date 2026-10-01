import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { OrderStatus, Prisma } from '../../generated/prisma/client.js';

@Injectable()
export class OrderRepository {
  constructor(private readonly prisma: PrismaService) {}

  async createOrder(data: Prisma.OrderCreateInput) {
    return this.prisma.order.create({
      data,
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

  async createOrderWithStockDeduction(
    data: Prisma.OrderCreateInput,
    itemsToDeduct: Array<{
      productId: number;
      variantId?: number | null;
      quantity: number;
    }>,
  ) {
    return this.prisma.$transaction(async (tx) => {
      for (const item of itemsToDeduct) {
        if (item.variantId) {
          await tx.productVariant.update({
            where: { id: item.variantId },
            data: {
              stock: {
                decrement: item.quantity,
              },
            },
          });
        }
        await tx.product.update({
          where: { id: item.productId },
          data: {
            stock: {
              decrement: item.quantity,
            },
          },
        });
      }

      return tx.order.create({
        data,
        include: {
          items: {
            include: {
              product: true,
              variant: true,
            },
          },
        },
      });
    });
  }

  async cancelOrderWithStockRestoration(orderId: number) {
    return this.prisma.$transaction(async (tx) => {
      const order = await tx.order.findUnique({
        where: { id: orderId },
        include: {
          items: true,
        },
      });

      if (!order) {
        throw new Error('Order tidak ditemukan');
      }

      if (order.status !== 'PENDING') {
        throw new Error('Pesanan tidak lagi berstatus PENDING');
      }

      for (const item of order.items) {
        if (item.variantId) {
          await tx.productVariant.update({
            where: { id: item.variantId },
            data: {
              stock: {
                increment: item.quantity,
              },
            },
          });
        }
        await tx.product.update({
          where: { id: item.productId },
          data: {
            stock: {
              increment: item.quantity,
            },
          },
        });
      }

      return tx.order.update({
        where: { id: orderId },
        data: {
          status: 'CANCELLED',
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
    });
  }

  async findOrderById(id: number) {
    return this.prisma.order.findUnique({
      where: {
        id,
      },

      include: {
        user: true,

        items: {
          include: {
            product: true,
          },
        },
        payments: {
          orderBy: {
            attempt: 'desc',
          },
        },
      },
    });
  }

  async findOrderByIdAndUserId(userId: number, orderId: number) {
    return this.prisma.order.findFirst({
      where: {
        id: orderId,
        userId,
      },
      include: {
        user: true,

        items: {
          include: {
            product: true,
            variant: true,
          },
        },
        // Payments ordered by latest attempt desc for frontend
        payments: {
          orderBy: {
            attempt: 'desc',
          },
        },
      },
    });
  }

  async findOrders(
    where: Prisma.OrderWhereInput,
    skip: number,
    take: number,
    sortBy: 'createdAt' | 'total' | 'status',
    sortOrder: 'asc' | 'desc',
  ) {
    return this.prisma.order.findMany({
      where,
      skip,
      take,
      include: {
        items: {
          include: {
            product: true,
            variant: true,
          },
        },
      },

      orderBy: {
        [sortBy]: sortOrder,
      },
    });
  }

  async countOrders(where: Prisma.OrderWhereInput) {
    return this.prisma.order.count({
      where,
    });
  }

  async updateOrderStatus(orderId: number, status: OrderStatus) {
    return this.prisma.order.update({
      where: {
        id: orderId,
      },
      data: {
        status,
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

  /** Status order saja — dipakai webhook untuk cek downgrade. */
  async findOrderStatusById(orderId: number): Promise<OrderStatus | null> {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      select: { status: true },
    });
    return order?.status ?? null;
  }
}
