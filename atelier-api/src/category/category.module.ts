import { Module } from '@nestjs/common';
import { CategoryService } from './category.service.js';
import { CategoryController } from './category.controller.js';
import { PrismaModule } from '../prisma/prisma.module.js';
import { CategoryRepository } from './category.repository.js';

@Module({
  controllers: [CategoryController],
  providers: [CategoryService, CategoryRepository],
  exports: [CategoryService, CategoryRepository],
  imports: [PrismaModule],
})
export class CategoryModule {}
