import { Injectable } from '@nestjs/common';
import { Prisma } from '../../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';

@Injectable()
export class ProductRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: Prisma.ProductCreateInput) {
    return this.prisma.product.create({
      data,
    });
  }

  async findById(id: number) {
    return this.prisma.product.findUnique({
      where: { id },
    });
  }

  async findAll(where: Prisma.ProductWhereInput, skip: number, take: number) {
    return this.prisma.product.findMany({
      where,
      skip,
      take,
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async count(where: Prisma.ProductWhereInput) {
    return this.prisma.product.count({
      where,
    });
  }

  async update(id: number, data: Prisma.ProductUpdateInput) {
    return this.prisma.product.update({
      where: { id },
      data,
    });
  }

  async remove(id: number) {
    return this.prisma.product.delete({
      where: { id },
    });
  }
}
