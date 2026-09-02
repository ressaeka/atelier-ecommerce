import { Module } from '@nestjs/common';
import { ProductService } from './product.service.js';
import ProductController from './product.controller.js';
import { CategoryRepository } from '../category/category.repository.js';
import { PrismaModule } from '../prisma/prisma.module.js';
import { ProductRepository } from './product.repository.js';

@Module({
  controllers: [ProductController],
  providers: [ProductService, ProductRepository, CategoryRepository],
  exports: [ProductService, ProductRepository],
  imports: [PrismaModule],
})
export class ProductModule {}
