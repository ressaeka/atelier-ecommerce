import { Module } from '@nestjs/common';
import { CartService } from './cart.service.js';
import { CartController } from './cart.controller.js';
import { PrismaModule } from '../prisma/prisma.module.js';
import { CartRepository } from './cart.repository.js';
import { ProductModule } from '../product/product.module.js';

@Module({
  controllers: [CartController],
  providers: [CartService, CartRepository],
  exports: [CartRepository],
  imports: [PrismaModule, ProductModule],
})
export class CartModule {}
