import { Injectable } from '@nestjs/common';
import { Prisma } from '../../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';

@Injectable()
export class UsersRepository {
  constructor(private readonly prisma: PrismaService) {}

  async updatePassword(id: number, hashedPassword: string) {
    return this.prisma.user.update({
      where: { id },
      data: {
        password: hashedPassword,
      },
    });
  }

  async create(data: Prisma.UserCreateInput) {
    return this.prisma.user.create({
      data,
    });
  }

  async findExisting(username: string, email: string) {
    return this.prisma.user.findFirst({
      where: {
        OR: [{ username }, { email }],
      },
    });
  }

  async findByEmail(email: string) {
    return this.prisma.user.findUnique({
      where: { email },
    });
  }

  async findByUsername(username: string) {
    return this.prisma.user.findUnique({
      where: { username },
    });
  }

  async findByUsernameWithPassword(username: string) {
    return this.prisma.user.findUnique({
      where: { username },
    });
  }

  async findById(id: number) {
    return this.prisma.user.findUnique({
      where: { id },
    });
  }

  async findMany(where: Prisma.UserWhereInput, skip: number, take: number) {
    return this.prisma.user.findMany({
      where,
      skip,
      take,
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async count(where: Prisma.UserWhereInput) {
    return this.prisma.user.count({
      where,
    });
  }

  async update(id: number, data: Prisma.UserUpdateInput) {
    return this.prisma.user.update({
      where: { id },
      data,
    });
  }

  async findExistingForUpdate(id: number, or: Prisma.UserWhereInput[]) {
    return this.prisma.user.findFirst({
      where: {
        NOT: { id },
        OR: or,
      },
    });
  }

  async remove(id: number) {
    return this.prisma.user.delete({
      where: { id },
    });
  }
}
