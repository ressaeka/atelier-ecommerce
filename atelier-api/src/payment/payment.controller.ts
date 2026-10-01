import { Body, Controller, Post, UseGuards } from '@nestjs/common';

import { PaymentService } from './payment.service.js';
import { CreatePaymentDto } from './dto/create-payment.dto.js';
import {
  MidtransNotificationDto,
  MidtransNotificationSchema,
} from './dto/midtrans-notification.dto.js';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard.js';
import { CurrentUser } from '../common/decorators/current-user.decorator.js';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe.js';

@Controller('payment')
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  /**
   * POST /payment
   * Create Midtrans Snap transaction untuk order milik user yang login.
   */
  @Post()
  @UseGuards(JwtAuthGuard)
  create(@CurrentUser() user: { id: number }, @Body() dto: CreatePaymentDto) {
    return this.paymentService.create(dto, user.id);
  }

  /**
   * POST /payment/notification
   * Webhook server-to-server Midtrans → Backend.
   * JANGAN dijadikan halaman browser / GET.
   * Tidak membutuhkan JWT auth.
   */
  @Post('notification')
  notification(
    @Body(new ZodValidationPipe(MidtransNotificationSchema))
    notification: MidtransNotificationDto,
  ) {
    return this.paymentService.handleNotification(notification);
  }
}
