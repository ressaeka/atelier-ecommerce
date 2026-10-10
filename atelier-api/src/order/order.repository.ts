import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
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
    cartId?: number,
  ) {
    return this.prisma.$transaction(async (tx) => {
      for (const item of itemsToDeduct) {
        if (item.variantId) {
          const updatedVariant = await tx.productVariant.updateMany({
            where: {
              id: item.variantId,
              stock: { gte: item.quantity },
            },
            data: {
              stock: {
                decrement: item.quantity,
              },
            },
          });
          if (updatedVariant.count === 0) {
            throw new BadRequestException('Stok varian produk tidak mencukupi');
          }
        }

        const updatedProduct = await tx.product.updateMany({
          where: {
            id: item.productId,
            stock: { gte: item.quantity },
          },
          data: {
            stock: {
              decrement: item.quantity,
            },
          },
        });
        if (updatedProduct.count === 0) {
          throw new BadRequestException('Stok produk tidak mencukupi');
        }
      }

      const createdOrder = await tx.order.create({
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

      // Bersihkan item cart dalam transaksi yang sama
      if (cartId) {
        await tx.cartItem.deleteMany({
          where: { cartId },
        });
      }

      return createdOrder;
    });
  }

  async cancelOrderWithStockRestoration(orderId: number) {
    return this.transitionOrderStatus(orderId, OrderStatus.CANCELLED);
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

  /**
   * Admin order detail with payment info.
   * Selects safe payment fields only — no snapToken / security material.
   */
  async findOrderDetailForAdmin(orderId: number) {
    return this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: {
          include: {
            product: true,
            variant: true,
          },
        },
        payments: {
          orderBy: { attempt: 'desc' },
          select: {
            id: true,
            orderId: true,
            provider: true,
            paymentMethod: true,
            status: true,
            grossAmount: true,
            attempt: true,
            midtransOrderId: true,
            createdAt: true,
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
        user: {
          select: {
            id: true,
            name: true,
            username: true,
            email: true,
            phone: true,
            role: true,
            createdAt: true,
            updatedAt: true,
          },
        },

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

  /**
   * Transisi status order dengan proteksi integritas:
   * 1. Pemulihan stok HANYA jika transisi dari PENDING -> CANCELLED / EXPIRED.
   * 2. Atomic dalam prisma.$transaction (mencegah double restoration pada webhook duplikat / concurrent cancel).
   * 3. Menolak pembatalan/downgrade jika order sudah PAID / PROCESSING / SHIPPED / DELIVERED.
   * 4. Jika order sudah terminal (CANCELLED/EXPIRED), return tanpa modifikasi stok ulang.
   */
  async transitionOrderStatus(orderId: number, targetStatus: OrderStatus) {
    return this.prisma.$transaction(async (tx) => {
      const order = await tx.order.findUnique({
        where: { id: orderId },
        include: {
          items: true,
        },
      });

      if (!order) {
        throw new NotFoundException('Order tidak ditemukan');
      }

      const currentStatus = order.status;

      // 1. Status sudah sama (idempotent)
      if (currentStatus === targetStatus) {
        return order;
      }

      // 2. Order sudah pernah dibayar/final
      const isPaidOrBeyond =
        currentStatus === OrderStatus.PAID ||
        currentStatus === OrderStatus.PROCESSING ||
        currentStatus === OrderStatus.SHIPPED ||
        currentStatus === OrderStatus.DELIVERED;

      if (
        isPaidOrBeyond &&
        (targetStatus === OrderStatus.PENDING ||
          targetStatus === OrderStatus.CANCELLED ||
          targetStatus === OrderStatus.EXPIRED)
      ) {
        // Abaikan downgrade atau pembatalan terlambat pada order yang sudah dibayar
        return order;
      }

      // 3. Order sudah pernah batal/kedaluwarsa (terminal state)
      if (
        currentStatus === OrderStatus.CANCELLED ||
        currentStatus === OrderStatus.EXPIRED
      ) {
        // Jangan pernah kembalikan stok dua kali
        return order;
      }

      // 4. Jika transisi dari PENDING -> CANCELLED atau EXPIRED, pulihkan stok barang
      if (
        currentStatus === OrderStatus.PENDING &&
        (targetStatus === OrderStatus.CANCELLED ||
          targetStatus === OrderStatus.EXPIRED)
      ) {
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
      }

      // 5. Update status order
      return tx.order.update({
        where: { id: orderId },
        data: {
          status: targetStatus,
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

  async updateOrderStatus(orderId: number, status: OrderStatus) {
    return this.transitionOrderStatus(orderId, status);
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
