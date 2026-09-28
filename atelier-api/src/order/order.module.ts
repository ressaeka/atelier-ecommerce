import { Module } from '@nestjs/common';
import { OrderService } from './order.service.js';
import { OrderController } from './order.controller.js';
import { PrismaModule } from '../prisma/prisma.module.js';
import { OrderRepository } from './order.repository.js';
import { CartModule } from '../cart/cart.module.js';
import { AddressModule } from '../address/address.module.js';

@Module({
  controllers: [OrderController],
  providers: [OrderService, OrderRepository],
  exports: [OrderService, OrderRepository],
  imports: [PrismaModule, CartModule, AddressModule],
})
export class OrderModule {}
