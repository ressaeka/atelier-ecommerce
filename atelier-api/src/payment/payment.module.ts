import { Module } from '@nestjs/common';

import { PaymentService } from './payment.service.js';
import { PaymentController } from './payment.controller.js';
import { PaymentRepository } from './payment.repository.js';

import { OrderRepository } from '../order/order.repository.js';

@Module({
  controllers: [PaymentController],
  providers: [PaymentService, PaymentRepository, OrderRepository],
})
export class PaymentModule {}
