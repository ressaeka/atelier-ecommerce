import { Injectable } from '@nestjs/common';
import { PaymentStatus, Prisma } from '../../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';

@Injectable()
export class PaymentRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: Prisma.PaymentCreateInput) {
    return this.prisma.payment.create({
      data,
    });
  }

  async findById(id: number) {
    return this.prisma.payment.findUnique({
      where: { id },
    });
  }

  async findByOrderId(orderId: number) {
    return this.prisma.payment.findMany({
      where: { orderId },
      orderBy: { attempt: 'desc' },
    });
  }

  async findLatestByOrderId(orderId: number) {
    return this.prisma.payment.findFirst({
      where: { orderId },
      orderBy: { attempt: 'desc' },
    });
  }

  async findByMidtransOrderId(midtransOrderId: string) {
    return this.prisma.payment.findUnique({
      where: { midtransOrderId },
    });
  }

  async findByOrderIdAndStatus(orderId: number, status: PaymentStatus) {
    return this.prisma.payment.findFirst({
      where: {
        orderId,
        status,
      },
      orderBy: {
        attempt: 'desc',
      },
    });
  }

  async update(id: number, data: Prisma.PaymentUpdateInput) {
    return this.prisma.payment.update({
      where: { id },
      data,
    });
  }

  async updateByMidtransOrderId(
    midtransOrderId: string,
    data: Prisma.PaymentUpdateInput,
  ) {
    return this.prisma.payment.update({
      where: { midtransOrderId },
      data,
    });
  }

  async getNextAttempt(orderId: number): Promise<number> {
    const latestPayment = await this.findLatestByOrderId(orderId);

    return latestPayment ? latestPayment.attempt + 1 : 1;
  }

  async cancelPendingPaymentsForOrder(
    orderId: number,
    excludePaymentId?: number,
  ) {
    return this.prisma.payment.updateMany({
      where: {
        orderId,
        ...(excludePaymentId !== undefined
          ? { id: { not: excludePaymentId } }
          : {}),
        status: PaymentStatus.PENDING,
      },
      data: {
        status: PaymentStatus.CANCELLED,
      },
    });
  }
}
