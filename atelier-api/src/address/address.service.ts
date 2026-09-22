import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '../../generated/prisma/client.js';
import { AddressRepository } from './address.repository.js';
import { Address } from './entities/address.entity.js';
import { AddressDto } from './dto/create-address.dto.js';
import { UpdateAddressDto } from './dto/update-address.dto.js';
import { QueryAddressDto } from './dto/query-address.dto.js';
import { PrismaService } from '../prisma/prisma.service.js';

@Injectable()
export class AddressService {
  constructor(
    private readonly addressRepository: AddressRepository,
    private readonly prisma: PrismaService,
  ) {}

  /**
   * CREATE
   * userId diambil dari JWT, bukan dari request body.
   *
   * Business rule:
   * - Jika address baru menjadi default,
   *   default address lama harus di-unset.
   */
  async create(currentUserId: number, dto: AddressDto): Promise<Address> {
    const address = await this.prisma.$transaction(async (tx) => {
      if (dto.isDefault === true) {
        await tx.address.updateMany({
          where: {
            userId: currentUserId,
            isDefault: true,
          },
          data: {
            isDefault: false,
          },
        });
      }

      return tx.address.create({
        data: {
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
              id: currentUserId,
            },
          },
        },
      });
    });

    return this.toEntity(address);
  }

  /**
   * FIND ALL
   * User hanya boleh melihat address miliknya sendiri.
   */
  async findAllAddress(
    currentUserId: number,
    query: QueryAddressDto,
  ): Promise<{
    items: Address[];
    meta: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  }> {
    const { page, limit, search } = query;

    const skip = (page - 1) * limit;

    const where: Prisma.AddressWhereInput = {
      userId: currentUserId,

      ...(search
        ? {
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
          }
        : {}),
    };

    const [addresses, total] = await Promise.all([
      this.addressRepository.findAll(where, skip, limit),
      this.addressRepository.count(where),
    ]);

    return {
      items: addresses.map((address) => this.toEntity(address)),

      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * FIND ONE BY ID
   * Ownership check menggunakan:
   * addressId + currentUserId
   */
  async findAddressById(
    currentUserId: number,
    addressId: number,
  ): Promise<Address> {
    const address = await this.addressRepository.findByIdAndUserId(
      addressId,
      currentUserId,
    );

    if (!address) {
      throw new NotFoundException('Address tidak ditemukan');
    }

    return this.toEntity(address);
  }

  /**
   * FIND DEFAULT ADDRESS
   * Hanya mencari default address milik user tersebut.
   */
  async findDefaultAddress(currentUserId: number): Promise<Address> {
    const address =
      await this.addressRepository.findDefaultByUserId(currentUserId);

    if (!address) {
      throw new NotFoundException('Alamat default tidak ditemukan');
    }

    return this.toEntity(address);
  }

  /**
   * UPDATE
   *
   * Ownership:
   * address harus milik currentUserId.
   *
   * Business rule:
   * jika address ini dijadikan default,
   * default address lain harus di-unset.
   */
  async updateAddress(
    currentUserId: number,
    addressId: number,
    dto: UpdateAddressDto,
  ): Promise<Address> {
    const existingAddress = await this.addressRepository.findByIdAndUserId(
      addressId,
      currentUserId,
    );

    if (!existingAddress) {
      throw new NotFoundException('Address tidak ditemukan');
    }

    const address = await this.prisma.$transaction(async (tx) => {
      if (dto.isDefault === true) {
        await tx.address.updateMany({
          where: {
            userId: currentUserId,
            isDefault: true,
            NOT: {
              id: addressId,
            },
          },
          data: {
            isDefault: false,
          },
        });
      }

      const data: Prisma.AddressUpdateInput = {
        ...(dto.label !== undefined && {
          label: dto.label,
        }),

        ...(dto.recipientName !== undefined && {
          recipientName: dto.recipientName,
        }),

        ...(dto.phone !== undefined && {
          phone: dto.phone,
        }),

        ...(dto.addressLine !== undefined && {
          addressLine: dto.addressLine,
        }),

        ...(dto.city !== undefined && {
          city: dto.city,
        }),

        ...(dto.province !== undefined && {
          province: dto.province,
        }),

        ...(dto.postalCode !== undefined && {
          postalCode: dto.postalCode,
        }),

        ...(dto.isDefault !== undefined && {
          isDefault: dto.isDefault,
        }),
      };

      return tx.address.update({
        where: {
          id: addressId,
        },
        data,
      });
    });

    return this.toEntity(address);
  }

  /**
   * DELETE
   *
   * Ownership tetap diverifikasi sebelum delete.
   */
  async removeAddress(
    currentUserId: number,
    addressId: number,
  ): Promise<Address> {
    const existingAddress = await this.addressRepository.findByIdAndUserId(
      addressId,
      currentUserId,
    );

    if (!existingAddress) {
      throw new NotFoundException('Address tidak ditemukan');
    }

    const address = await this.addressRepository.remove(addressId);

    return this.toEntity(address);
  }

  /**
   * Prisma model -> application entity
   */
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
