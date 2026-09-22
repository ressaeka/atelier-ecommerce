import { Module } from '@nestjs/common';
import { WishlistService } from './wishlist.service.js';
import { WishlistController } from './wishlist.controller.js';
import { PrismaModule } from '../prisma/prisma.module.js';
import { WishlistRepository } from './wishlist.repository.js';
import { ProductModule } from '../product/product.module.js';

@Module({
  controllers: [WishlistController],
  providers: [WishlistService, WishlistRepository],
  exports: [WishlistService, WishlistRepository],
  imports: [PrismaModule, ProductModule],
})
export class WishlistModule {}
