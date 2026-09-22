import { Injectable } from '@nestjs/common';
import { Prisma } from '../../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';

@Injectable()
export class CategoryRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: Prisma.CategoryCreateInput) {
    return this.prisma.category.create({
      data,
    });
  }

  async findCategoryByName(name: string) {
    return this.prisma.category.findUnique({
      where: { name },
    });
  }

  async findAllCategory(
    where: Prisma.CategoryWhereInput,
    skip: number,
    take: number,
  ) {
    return this.prisma.category.findMany({
      where,
      skip,
      take,
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        _count: {
          select: { products: true },
        },
      },
    });
  }

  async findCategoryById(id: number) {
    return this.prisma.category.findUnique({
      where: { id },
    });
  }

  async updateCategory(id: number, data: Prisma.CategoryUpdateInput) {
    return this.prisma.category.update({
      where: { id },
      data,
    });
  }

  async findExistingForUpdate(id: number, name: string) {
    return this.prisma.category.findFirst({
      where: {
        name,
        NOT: {
          id,
        },
      },
    });
  }

  async deleteCategory(id: number) {
    return this.prisma.category.delete({
      where: { id },
    });
  }

  async count(where: Prisma.CategoryWhereInput) {
    return this.prisma.category.count({
      where,
    });
  }
}
