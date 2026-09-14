import { Injectable, NotFoundException } from '@nestjs/common';

import { AddressDto } from './dto/create-address.dto.js';
import { UpdateAddressDto } from './dto/update-address.dto.js';
import { AddressRepository } from './address.repository.js';
import { QueryAddressDto } from './dto/query-address.dto.js';

import { Prisma } from '../../generated/prisma/client.js';

import { Address } from './entities/address.entity.js';
import { UsersRepository } from '../users/users.repository.js';

@Injectable()
export class AddressService {
  constructor(
    private readonly addressRepository: AddressRepository,
    private readonly usersRepository: UsersRepository,
  ) {}

  async create(dto: AddressDto): Promise<Address> {
    const user = await this.usersRepository.findById(dto.userId);

    if (!user) {
      throw new NotFoundException('User tidak ditemukan');
    }

    // Kalau address baru ini di-set sebagai default, unset default yang lama dulu
    if (dto.isDefault) {
      await this.addressRepository.unsetDefaultByUserId(dto.userId);
    }

    const address = await this.addressRepository.create({
      label: dto.label,
      recipientName: dto.recipientName,
      phone: dto.phone,
      addressLine: dto.addressLine,
      city: dto.city,
      province: dto.province,
      postalCode: dto.postalCode,
      isDefault: dto.isDefault ?? false,

      user: {
        connect: {
          id: dto.userId,
        },
      },
    });

    return this.toEntity(address);
  }

  async findAllAddress(query: QueryAddressDto) {
    const { page, limit, search, userId } = query;

    const skip = (page - 1) * limit;

    const where: Prisma.AddressWhereInput = {
      ...(userId && {
        userId,
      }),

      ...(search && {
        OR: [
          {
            label: {
              contains: search,
              mode: 'insensitive',
            },
          },
          {
            recipientName: {
              contains: search,
              mode: 'insensitive',
            },
          },
          {
            city: {
              contains: search,
              mode: 'insensitive',
            },
          },
          {
            province: {
              contains: search,
              mode: 'insensitive',
            },
          },
          {
            postalCode: {
              contains: search,
              mode: 'insensitive',
            },
          },
        ],
      }),
    };

    const [addresses, total] = await Promise.all([
      this.addressRepository.findAll(where, skip, limit),

      this.addressRepository.count(where),
    ]);

    return {
      data: addresses.map((address) => this.toEntity(address)),

      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findAddressById(id: number): Promise<Address> {
    const address = await this.addressRepository.findById(id);

    if (!address) {
      throw new NotFoundException('Address tidak ditemukan');
    }

    return this.toEntity(address);
  }

  async updateAddress(id: number, dto: UpdateAddressDto): Promise<Address> {
    const { userId, isDefault, ...rest } = dto;

    // Kalau isDefault di-set jadi true, perlu cari tahu userId-nya dulu
    // (dari address yang sedang diupdate) sebelum unset default lama
    if (isDefault === true) {
      const existing = await this.addressRepository.findById(id);
      if (!existing) {
        throw new NotFoundException(`Address dengan id ${id} tidak ditemukan`);
      }
      const ownerUserId = userId ?? existing.userId;
      await this.addressRepository.unsetDefaultByUserId(ownerUserId);
    }

    const data: Prisma.AddressUpdateInput = {
      ...rest,
      ...(isDefault !== undefined && { isDefault }),
      ...(userId !== undefined && {
        user: {
          connect: { id: userId },
        },
      }),
    };

    try {
      const address = await this.addressRepository.update(id, data);

      return this.toEntity(address);
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          throw new NotFoundException(
            `Address dengan id ${id} tidak ditemukan`,
          );
        }

        if (error.code === 'P2003') {
          throw new NotFoundException(
            `User dengan id ${userId} tidak ditemukan`,
          );
        }
      }

      throw error;
    }
  }

  async removeAddress(id: number): Promise<Address> {
    try {
      const address = await this.addressRepository.remove(id);

      return this.toEntity(address);
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2025'
      ) {
        throw new NotFoundException(`Address dengan id ${id} tidak ditemukan`);
      }

      throw error;
    }
  }

  private toEntity(address: {
    id: number;
    userId: number;
    label: string;
    recipientName: string;
    phone: string;
    addressLine: string;
    city: string;
    province: string;
    postalCode: string;
    isDefault: boolean;
    createdAt: Date;
    updatedAt: Date;
  }): Address {
    const entity = new Address();

    entity.id = address.id;
    entity.userId = address.userId;
    entity.label = address.label;
    entity.recipientName = address.recipientName;
    entity.phone = address.phone;
    entity.addressLine = address.addressLine;
    entity.city = address.city;
    entity.province = address.province;
    entity.postalCode = address.postalCode;
    entity.isDefault = address.isDefault;
    entity.createdAt = address.createdAt;
    entity.updatedAt = address.updatedAt;

    return entity;
  }
}
