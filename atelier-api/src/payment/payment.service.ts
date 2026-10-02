import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import midtransClient from 'midtrans-client';
import { createHash } from 'node:crypto';

import { PaymentRepository } from './payment.repository.js';
import { OrderRepository } from '../order/order.repository.js';

import { CreatePaymentDto } from './dto/create-payment.dto.js';
import { MidtransNotificationDto } from './dto/midtrans-notification.dto.js';

import { OrderStatus, PaymentStatus } from '../../generated/prisma/client.js';
import type {
  SnapTransactionPayload,
  SnapTransactionResponse,
} from '../common/types/midtrans.js';

@Injectable()
export class PaymentService {
  private readonly snap: midtransClient.Snap;
  private readonly isProduction: boolean;
  private readonly serverKey: string;

  constructor(
    private readonly paymentRepository: PaymentRepository,
    private readonly orderRepository: OrderRepository,
    private readonly configService: ConfigService,
  ) {
    this.isProduction =
      this.configService.get<boolean>('midtrans.isProduction') ?? false;

    this.serverKey = this.configService.get<string>('midtrans.serverKey') ?? '';

    const clientKey =
      this.configService.get<string>('midtrans.clientKey') ?? '';

    this.snap = new midtransClient.Snap({
      isProduction: this.isProduction,
      serverKey: this.serverKey,
      clientKey,
    });

    const notificationUrl = (
      this.configService.get<string>('midtrans.notificationUrl') ??
      this.configService.get<string>('MIDTRANS_NOTIFICATION_URL') ??
      ''
    ).replace(/\/+$/, '');

    if (notificationUrl) {
      const snapClient = this.snap as unknown as {
        httpClient?: {
          http_client?: {
            defaults?: {
              headers?: {
                common?: Record<string, string>;
              };
            };
          };
        };
      };

      if (snapClient.httpClient?.http_client?.defaults?.headers?.common) {
        snapClient.httpClient.http_client.defaults.headers.common[
          'X-Append-Notification'
        ] = notificationUrl;
      }
    }
  }

  // Create Midtrans transaction
  async create(dto: CreatePaymentDto, currentUserId: number) {
    const order = await this.orderRepository.findOrderByIdAndUserId(
      currentUserId,
      dto.orderId,
    );

    if (!order) {
      throw new NotFoundException('Order tidak ditemukan');
    }

    if (order.status !== OrderStatus.PENDING) {
      throw new BadRequestException('Order tidak dapat melakukan pembayaran');
    }

    const attempt = await this.paymentRepository.getNextAttempt(order.id);

    const midtransOrderId = `ATELIER-${order.id}-${attempt}`;

    const frontendUrl = (
      this.configService.get<string>('midtrans.frontendUrl') ??
      this.configService.get<string>('FRONTEND_URL') ??
      'http://localhost:5173'
    ).replace(/\/+$/, '');

    const successUrl = `${frontendUrl}/payment/success/${order.id}`;

    const payload: SnapTransactionPayload = {
      transaction_details: {
        order_id: midtransOrderId,
        gross_amount: order.total,
      },

      item_details: order.items.map((item) => ({
        id: String(item.productId),
        price: item.price,
        quantity: item.quantity,
        name: item.product.name,
      })),

      customer_details: {
        first_name: order.recipientName,
        email: order.user.email,
        phone: order.phone,

        shipping_address: {
          first_name: order.recipientName,
          phone: order.phone,
          address: order.addressLine,
          city: order.city,
          postal_code: order.postalCode,
          country_code: 'IDN',
        },
      },

      callbacks: {
        finish: successUrl,
        unfinish: successUrl,
        error: successUrl,
        pending: successUrl,
      },
    };

    // Midtrans SDK typing is too generic
    const transaction = (await this.snap.createTransaction(
      payload,
    )) as unknown as SnapTransactionResponse;

    const snapToken = transaction.token;
    const redirectUrl = transaction.redirect_url;

    if (!snapToken || !redirectUrl) {
      throw new BadRequestException(
        'Midtrans tidak mengembalikan Snap Token atau Redirect URL',
      );
    }

    const payment = await this.paymentRepository.create({
      order: {
        connect: {
          id: order.id,
        },
      },

      provider: 'MIDTRANS',
      midtransOrderId,
      snapToken,
      attempt,
      status: PaymentStatus.PENDING,
      grossAmount: order.total,
    });

    return {
      paymentId: payment.id,
      orderId: order.id,
      midtransOrderId: payment.midtransOrderId,
      snapToken: payment.snapToken,
      redirectUrl,
    };
  }

  // Handle Midtrans webhook
  async handleNotification(notification: MidtransNotificationDto) {
    const debug = process.env.NODE_ENV !== 'production';

    if (debug) {
      console.log('[PAYMENT WEBHOOK]');
      console.log(`order_id: ${notification.order_id}`);
      console.log(`transaction_status: ${notification.transaction_status}`);
      console.log(`status_code: ${notification.status_code}`);
      console.log(`gross_amount: ${notification.gross_amount}`);
      console.log(`payment_type: ${notification.payment_type ?? '-'}`);
    }

    const payment = await this.paymentRepository.findByMidtransOrderId(
      notification.order_id,
    );

    if (!payment) {
      if (debug) {
        console.log(
          `[PAYMENT WEBHOOK] payment not found for order_id=${notification.order_id}`,
        );
      }

      throw new NotFoundException('Payment tidak ditemukan');
    }

    const signature = this.generateSignature(
      notification.order_id,
      notification.status_code,
      notification.gross_amount,
    );

    if (signature !== notification.signature_key) {
      if (debug) {
        console.log('[PAYMENT WEBHOOK] signature mismatch');
        console.log(`expected: ${signature}`);
        console.log(`received: ${notification.signature_key}`);
      }

      throw new BadRequestException('Invalid Midtrans signature');
    }

    const mappedPaymentStatus = this.mapPaymentStatus(
      notification.transaction_status,
      notification.fraud_status,
    );

    const mappedOrderStatus = this.mapOrderStatus(
      notification.transaction_status,
      notification.fraud_status,
    );

    if (debug) {
      console.log(`payment_status (current): ${payment.status}`);
      console.log(`mapped payment_status: ${mappedPaymentStatus}`);
      console.log(`mapped order_status: ${mappedOrderStatus}`);
    }

    // Prevent duplicate PAID processing
    if (payment.status === PaymentStatus.PAID) {
      if (debug) {
        console.log('[PAYMENT WEBHOOK] payment is already PAID');
      }

      return {
        message: 'Notification duplicate/sudah diproses',
        paymentId: payment.id,
        paymentStatus: PaymentStatus.PAID,
        orderStatus: OrderStatus.PAID,
      };
    }

    // Prevent status downgrade to PENDING
    const isDowngradeToPending =
      mappedPaymentStatus === PaymentStatus.PENDING &&
      payment.status !== PaymentStatus.PENDING;

    let finalPaymentStatus: PaymentStatus = payment.status;
    let finalOrderStatus: OrderStatus = mappedOrderStatus;

    if (isDowngradeToPending) {
      if (debug) {
        console.log(
          `[PAYMENT WEBHOOK] skip payment downgrade ${payment.status} → PENDING`,
        );
      }

      const currentOrderStatus = await this.orderRepository.findOrderStatusById(
        payment.orderId,
      );

      finalOrderStatus = currentOrderStatus ?? mappedOrderStatus;
    } else {
      const updatedPayment =
        await this.paymentRepository.updateByMidtransOrderId(
          notification.order_id,
          {
            status: mappedPaymentStatus,
            transactionStatus: notification.transaction_status,
            fraudStatus: notification.fraud_status ?? null,
          },
        );

      finalPaymentStatus = updatedPayment.status;

      const currentOrderStatus = await this.orderRepository.findOrderStatusById(
        payment.orderId,
      );

      const orderIsAlreadyFinal =
        currentOrderStatus === OrderStatus.PAID ||
        currentOrderStatus === OrderStatus.CANCELLED ||
        currentOrderStatus === OrderStatus.EXPIRED;

      if (mappedOrderStatus === OrderStatus.PENDING && orderIsAlreadyFinal) {
        if (debug) {
          console.log(
            `[PAYMENT WEBHOOK] skip order downgrade ${currentOrderStatus} → PENDING`,
          );
        }

        finalOrderStatus = currentOrderStatus;
      } else {
        await this.orderRepository.updateOrderStatus(
          payment.orderId,
          mappedOrderStatus,
        );

        finalOrderStatus = mappedOrderStatus;
      }

      // Cancel other pending payment attempts
      if (mappedPaymentStatus === PaymentStatus.PAID) {
        await this.paymentRepository.cancelPendingPaymentsForOrder(
          payment.orderId,
          payment.id,
        );
      }
    }

    if (debug) {
      console.log('[PAYMENT WEBHOOK] done');
      console.log(`payment_status: ${finalPaymentStatus}`);
      console.log(`order_status: ${finalOrderStatus}`);
    }

    return {
      message: 'Notification berhasil diproses',
      paymentId: payment.id,
      paymentStatus: finalPaymentStatus,
      orderStatus: finalOrderStatus,
    };
  }

  private generateSignature(
    orderId: string,
    statusCode: string,
    grossAmount: string,
  ): string {
    return createHash('sha512')
      .update(`${orderId}${statusCode}${grossAmount}${this.serverKey}`)
      .digest('hex');
  }

  private mapPaymentStatus(
    transactionStatus: string,
    fraudStatus?: string | null,
  ): PaymentStatus {
    switch (transactionStatus) {
      case 'capture':
        if (fraudStatus === 'challenge') {
          return PaymentStatus.PENDING;
        }

        return PaymentStatus.PAID;

      case 'settlement':
        return PaymentStatus.PAID;

      case 'expire':
        return PaymentStatus.EXPIRED;

      case 'cancel':
      case 'deny':
      case 'failure':
        return PaymentStatus.CANCELLED;

      case 'pending':
      default:
        return PaymentStatus.PENDING;
    }
  }

  private mapOrderStatus(
    transactionStatus: string,
    fraudStatus?: string | null,
  ): OrderStatus {
    switch (transactionStatus) {
      case 'capture':
        if (fraudStatus === 'challenge') {
          return OrderStatus.PENDING;
        }

        return OrderStatus.PAID;

      case 'settlement':
        return OrderStatus.PAID;

      case 'expire':
        return OrderStatus.EXPIRED;

      case 'cancel':
      case 'deny':
      case 'failure':
        return OrderStatus.CANCELLED;

      case 'pending':
      default:
        return OrderStatus.PENDING;
    }
  }
}
