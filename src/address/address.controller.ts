import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';

import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

import { AddressService } from './address.service.js';

import { AddressDto, addressSchema } from './dto/create-address.dto.js';

import {
  QueryAddressDto,
  queryAddressSchema,
} from './dto/query-address.dto.js';

import { JwtAuthGuard } from '../common/guards/jwt-auth.guard.js';

import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe.js';

import { successResponse } from '../common/helpers/response.helper.js';

@ApiTags('Address')
@ApiBearerAuth()
@Controller('address')
export class AddressController {
  constructor(private readonly addressService: AddressService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary: 'Buat alamat baru',
  })
  @ApiBody({
    description: 'Data alamat yang akan dibuat',
    schema: {
      type: 'object',
      properties: {
        label: {
          type: 'string',
          example: 'Rumah',
        },
        recipientName: {
          type: 'string',
          example: 'John Doe',
        },
        phone: {
          type: 'string',
          example: '081234567890',
        },
        addressLine: {
          type: 'string',
          example: 'Jl. Contoh No. 123',
        },
        city: {
          type: 'string',
          example: 'Jakarta Selatan',
        },
        province: {
          type: 'string',
          example: 'DKI Jakarta',
        },
        postalCode: {
          type: 'string',
          example: '12345',
        },
        isDefault: {
          type: 'boolean',
          example: false,
        },
        userId: {
          type: 'number',
          example: 1,
        },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Address berhasil dibuat',
  })
  @ApiResponse({
    status: 400,
    description: 'Validasi input gagal',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  async create(
    @Body(new ZodValidationPipe(addressSchema))
    createAddressDto: AddressDto,
  ) {
    const address = await this.addressService.create(createAddressDto);

    return successResponse(address, 'Address berhasil dibuat');
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary: 'Ambil daftar address dengan filter dan paginasi',
  })
  @ApiResponse({
    status: 200,
    description: 'Address berhasil diambil',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  async findAll(
    @Query(new ZodValidationPipe(queryAddressSchema))
    query: QueryAddressDto,
  ) {
    const address = await this.addressService.findAllAddress(query);

    return successResponse(address, 'Address berhasil diambil');
  }
}
