import { Body, Controller, Post } from '@nestjs/common';

import { PaymentService } from './payment.service.js';

import { CreatePaymentDto } from './dto/create-payment.dto.js';

import {
  MidtransNotificationDto,
  MidtransNotificationSchema,
} from './dto/midtrans-notification.dto.js';

import { Public } from '../common/decorators/public.decorator.js';

import { CurrentUser } from '../common/decorators/current-user.decorator.js';

import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe.js';

@Controller('payment')
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  // Create payment
  @Post()
  create(@CurrentUser() user: { id: number }, @Body() dto: CreatePaymentDto) {
    return this.paymentService.create(dto, user.id);
  }

  // Midtrans webhook
  @Public()
  @Post('notification')
  notification(
    @Body(new ZodValidationPipe(MidtransNotificationSchema))
    notification: MidtransNotificationDto,
  ) {
    return this.paymentService.handleNotification(notification);
  }
}
