import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { CreateOrderDto } from './dto/create-order.dto.js';
import { UpdateOrderStatusDto } from './dto/update-order.dto.js';
import { OrderRepository } from './order.repository.js';
import { Order } from './entities/order.entity.js';

import { CartRepository } from '../cart/cart.repository.js';
import { AddressRepository } from '../address/address.repository.js';

import { Prisma } from '../../generated/prisma/client.js';
import { OrderQueryDto } from './dto/query-order.dto.js';

@Injectable()
export class OrderService {
  constructor(
    private readonly orderRepository: OrderRepository,
    private readonly cartRepository: CartRepository,
    private readonly addressRepository: AddressRepository,
  ) {}

  async create(dto: CreateOrderDto, currentUserId: number): Promise<Order> {
    const address = await this.addressRepository.findByIdAndUserId(
      dto.addressId,
      currentUserId,
    );

    if (!address) {
      throw new NotFoundException('Address tidak ditemukan');
    }

    const cart = await this.cartRepository.findByUserId(currentUserId);

    if (!cart) {
      throw new NotFoundException('Cart tidak ditemukan');
    }

    if (cart.items.length === 0) {
      throw new BadRequestException('Cart kosong');
    }

    let subtotal = 0;

    const items: Prisma.OrderItemCreateWithoutOrderInput[] = [];

    for (const item of cart.items) {
      const price = item.variant?.price ?? item.product.price;
      const stock = item.variant?.stock ?? item.product.stock;

      if (item.quantity > stock) {
        throw new BadRequestException(
          `Stock ${item.product.name} tidak mencukupi`,
        );
      }

      const itemSubtotal = price * item.quantity;

      subtotal += itemSubtotal;

      items.push({
        product: {
          connect: {
            id: item.productId,
          },
        },

        ...(item.variantId
          ? {
              variant: {
                connect: {
                  id: item.variantId,
                },
              },
            }
          : {}),

        quantity: item.quantity,
        price,
        subtotal: itemSubtotal,
      });
    }

    const shippingFee = 0;
    const total = subtotal + shippingFee;

    const itemsToDeduct = cart.items.map((item) => ({
      productId: item.productId,
      variantId: item.variantId,
      quantity: item.quantity,
    }));

    const order = await this.orderRepository.createOrderWithStockDeduction(
      {
        user: {
          connect: {
            id: currentUserId,
          },
        },

        status: 'PENDING',

        subtotal,
        shippingFee,
        total,

        recipientName: address.recipientName,
        phone: address.phone,
        addressLine: address.addressLine,
        city: address.city,
        province: address.province,
        postalCode: address.postalCode,

        items: {
          create: items,
        },
      },
      itemsToDeduct,
    );

    if (!order) {
      throw new BadRequestException('Order gagal dibuat');
    }

    return order;
  }

  async cancelOrder(userId: number, orderId: number): Promise<Order> {
    const order = await this.orderRepository.findOrderByIdAndUserId(
      userId,
      orderId,
    );

    if (!order) {
      throw new NotFoundException('Order tidak ditemukan');
    }

    if (order.status !== 'PENDING') {
      throw new BadRequestException(
        'Hanya pesanan berstatus PENDING yang dapat dibatalkan',
      );
    }

    return this.orderRepository.cancelOrderWithStockRestoration(orderId);
  }

  async findOrderById(orderId: number): Promise<Order> {
    const order = await this.orderRepository.findOrderById(orderId);

    if (!order) {
      throw new NotFoundException('Order tidak ditemukan');
    }

    return order;
  }

  async findOrderByIdAndUserId(
    userId: number,
    orderId: number,
  ): Promise<Order> {
    const order = await this.orderRepository.findOrderByIdAndUserId(
      userId,
      orderId,
    );

    if (!order) {
      throw new NotFoundException('Order user tidak ditemukan');
    }

    return order;
  }

  /**
   * Order detail for authenticated user.
   * ADMIN: any order (admin portal).
   * USER: own orders only (ownership enforced).
   */
  async findOrderByIdForDetail(
    user: { id: number; role: string },
    orderId: number,
  ): Promise<Order> {
    if (user.role === 'ADMIN') {
      const order = await this.orderRepository.findOrderDetailForAdmin(orderId);

      if (!order) {
        throw new NotFoundException('Pesanan tidak ditemukan');
      }

      return order;
    }

    return this.findOrderByIdAndUserId(user.id, orderId);
  }

  /**
   * Admin:
   * Melihat seluruh order dengan filter, pagination,
   * sorting, dan optional userId.
   */
  async findAllOrder(query: OrderQueryDto) {
    const { page, limit, search, userId, status, sortBy, sortOrder } = query;

    const skip = (page - 1) * limit;

    const where: Prisma.OrderWhereInput = {
      ...(search && {
        recipientName: {
          contains: search,
          mode: 'insensitive',
        },
      }),

      ...(userId !== undefined && {
        userId,
      }),

      ...(status && {
        status,
      }),
    };

    const [orders, total] = await Promise.all([
      this.orderRepository.findOrders(where, skip, limit, sortBy, sortOrder),

      this.orderRepository.countOrders(where),
    ]);

    return {
      data: orders,

      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * User:
   * Hanya melihat order miliknya sendiri.
   *
   * userId TIDAK berasal dari query.
   * userId selalu berasal dari JWT.
   */
  async findMyOrders(userId: number, query: OrderQueryDto) {
    const { page, limit, search, status, sortBy, sortOrder } = query;

    const skip = (page - 1) * limit;

    const where: Prisma.OrderWhereInput = {
      userId,

      ...(search && {
        recipientName: {
          contains: search,
          mode: 'insensitive',
        },
      }),

      ...(status && {
        status,
      }),
    };

    const [orders, total] = await Promise.all([
      this.orderRepository.findOrders(where, skip, limit, sortBy, sortOrder),

      this.orderRepository.countOrders(where),
    ]);

    return {
      data: orders,

      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async updateOrderStatus(
    orderId: number,
    dto: UpdateOrderStatusDto,
  ): Promise<Order> {
    const order = await this.orderRepository.findOrderById(orderId);

    if (!order) {
      throw new NotFoundException('Order tidak ditemukan');
    }

    return this.orderRepository.updateOrderStatus(orderId, dto.status);
  }
}
