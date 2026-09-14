import { Injectable } from '@nestjs/common';
import { Prisma } from '../../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';

@Injectable()
export class AddressRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: Prisma.AddressCreateInput) {
    return this.prisma.address.create({
      data,
    });
  }

  async findById(id: number) {
    return this.prisma.address.findUnique({
      where: { id },
    });
  }

  async findAll(where: Prisma.AddressWhereInput, skip: number, take: number) {
    return this.prisma.address.findMany({
      where,
      skip,
      take,
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async count(where: Prisma.AddressWhereInput) {
    return this.prisma.address.count({
      where,
    });
  }

  async findDefaultByUserId(userId: number) {
    return this.prisma.address.findFirst({
      where: {
        userId,
        isDefault: true,
      },
    });
  }

  async update(id: number, data: Prisma.AddressUpdateInput) {
    return this.prisma.address.update({
      where: { id },
      data,
    });
  }

  async remove(id: number) {
    return this.prisma.address.delete({
      where: { id },
    });
  }

  async unsetDefaultByUserId(userId: number) {
    return this.prisma.address.updateMany({
      where: {
        userId,
        isDefault: true,
      },
      data: {
        isDefault: false,
      },
    });
  }
}
