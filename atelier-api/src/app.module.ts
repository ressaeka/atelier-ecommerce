import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module.js';
import { UsersModule } from './users/users.module.js';
import { AuthModule } from './auth/auth.module.js';
import { RedisModule } from './common/redis/redis.module.js';
import { CategoryModule } from './category/category.module.js';
import { ProductModule } from './product/product.module.js';
import { validateEnv } from './config/env.validation.js';
import { AddressModule } from './address/address.module.js';
import { CartModule } from './cart/cart.module.js';
import { WishlistModule } from './wishlist/wishlist.module.js';
import { OrderModule } from './order/order.module.js';
import { PaymentModule } from './payment/payment.module.js';
import configuration from './config/configuration.js';
import midtransConfig from './config/midtrans.config.js';
import { APP_GUARD } from '@nestjs/core';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard.js';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration, midtransConfig],
      validate: validateEnv,
    }),
    PrismaModule,
    UsersModule,
    AuthModule,
    RedisModule,
    CategoryModule,
    ProductModule,
    AddressModule,
    CartModule,
    WishlistModule,
    OrderModule,
    PaymentModule,
  ],

  providers: [
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
  ],
})
export class AppModule {}
