import { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AuthModule } from '../auth/auth.module.js';
import { CartModule } from '../cart/cart.module.js';
import { CategoryModule } from '../category/category.module.js';
import { ProductModule } from '../product/product.module.js';
import { UsersModule } from '../users/users.module.js';

export const swaggerConfig = new DocumentBuilder()
  .setTitle('Ecommerce API - All Domains')
  .setDescription('Dokumentasi lengkap seluruh domain API Ecommerce.')
  .setVersion('1.0')
  .addBearerAuth()
  .build();

export const authSwaggerConfig = new DocumentBuilder()
  .setTitle('Ecommerce API - Auth Domain')
  .setDescription(
    'Dokumentasi API untuk autentikasi, registrasi, refresh token, OTP, dan manajemen password.',
  )
  .setVersion('1.0')
  .addBearerAuth()
  .build();

export const categorySwaggerConfig = new DocumentBuilder()
  .setTitle('Ecommerce API - Category Domain')
  .setDescription('Dokumentasi API untuk manajemen kategori produk.')
  .setVersion('1.0')
  .addBearerAuth()
  .build();

export const productSwaggerConfig = new DocumentBuilder()
  .setTitle('Ecommerce API - Product Domain')
  .setDescription(
    'Dokumentasi API untuk manajemen katalog dan inventaris produk.',
  )
  .setVersion('1.0')
  .addBearerAuth()
  .build();

export const usersSwaggerConfig = new DocumentBuilder()
  .setTitle('Ecommerce API - Users Domain')
  .setDescription(
    'Dokumentasi API untuk profil pengguna dan administrasi akun.',
  )
  .setVersion('1.0')
  .addBearerAuth()
  .build();

export const cartSwaggerConfig = new DocumentBuilder()
  .setTitle('Ecommerce API - Cart Domain')
  .setDescription('Dokumentasi API untuk manajemen keranjang belanja.')
  .setVersion('1.0')
  .addBearerAuth()
  .build();

export function setupSwagger(app: INestApplication): void {
  // 1. Domain Docs: Auth
  const authDocument = SwaggerModule.createDocument(app, authSwaggerConfig, {
    include: [AuthModule],
  });
  SwaggerModule.setup('api/docs/auth', app, authDocument, {
    swaggerOptions: {
      persistAuthorization: true,
    },
  });

  // 2. Domain Docs: Category
  const categoryDocument = SwaggerModule.createDocument(
    app,
    categorySwaggerConfig,
    {
      include: [CategoryModule],
    },
  );
  SwaggerModule.setup('api/docs/category', app, categoryDocument, {
    swaggerOptions: {
      persistAuthorization: true,
    },
  });

  // 3. Domain Docs: Product
  const productDocument = SwaggerModule.createDocument(
    app,
    productSwaggerConfig,
    {
      include: [ProductModule],
    },
  );
  SwaggerModule.setup('api/docs/product', app, productDocument, {
    swaggerOptions: {
      persistAuthorization: true,
    },
  });

  // 4. Domain Docs: Users
  const usersDocument = SwaggerModule.createDocument(app, usersSwaggerConfig, {
    include: [UsersModule],
  });
  SwaggerModule.setup('api/docs/users', app, usersDocument, {
    swaggerOptions: {
      persistAuthorization: true,
    },
  });

  // 5. Domain Docs: Cart
  const cartDocument = SwaggerModule.createDocument(app, cartSwaggerConfig, {
    include: [CartModule],
  });
  SwaggerModule.setup('api/docs/cart', app, cartDocument, {
    swaggerOptions: {
      persistAuthorization: true,
    },
  });

  // 6. Main Docs (All Domains with top-bar dropdown switcher)
  const allDocument = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, allDocument, {
    swaggerOptions: {
      persistAuthorization: true,
      urls: [
        { url: '/api/docs-json', name: 'All Domains' },
        { url: '/api/docs/auth-json', name: 'Auth Domain' },
        { url: '/api/docs/category-json', name: 'Category Domain' },
        { url: '/api/docs/product-json', name: 'Product Domain' },
        { url: '/api/docs/users-json', name: 'Users Domain' },
        { url: '/api/docs/cart-json', name: 'Cart Domain' },
      ],
    },
  });
}
