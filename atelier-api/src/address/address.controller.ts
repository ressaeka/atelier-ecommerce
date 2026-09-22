import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';

import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

import { AddressService } from './address.service.js';

import { AddressDto, addressSchema } from './dto/create-address.dto.js';

import {
  UpdateAddressDto,
  updateAddressSchema,
} from './dto/update-address.dto.js';

import {
  QueryAddressDto,
  queryAddressSchema,
} from './dto/query-address.dto.js';

import { JwtAuthGuard } from '../common/guards/jwt-auth.guard.js';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe.js';
import { successResponse } from '../common/helpers/response.helper.js';

import {
  createAddressApiBody,
  updateAddressApiBody,
  queryAddressPage,
  queryAddressLimit,
  queryAddressSearch,
  addressResponseSchema,
  addressesListResponseSchema,
} from './address.swagger.js';

import { CurrentUser } from '../common/decorators/current-user.decorator.js';

@ApiTags('Address')
@ApiBearerAuth()
@Controller('address')
export class AddressController {
  constructor(private readonly addressService: AddressService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary: 'Buat alamat baru',
    description:
      'Membuat alamat baru untuk user yang terautentikasi. userId diambil otomatis dari JWT.',
  })
  @ApiBody(createAddressApiBody)
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
    @CurrentUser() user: { id: number },

    @Body(new ZodValidationPipe(addressSchema))
    createAddressDto: AddressDto,
  ) {
    const address = await this.addressService.create(user.id, createAddressDto);

    return successResponse(address, 'Address berhasil dibuat');
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary: 'Ambil daftar address milik user',
    description:
      'Menampilkan semua address milik user yang terautentikasi. User hanya bisa melihat address miliknya sendiri.',
  })
  @ApiQuery(queryAddressPage)
  @ApiQuery(queryAddressLimit)
  @ApiQuery(queryAddressSearch)
  @ApiResponse(addressesListResponseSchema)
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  async findAll(
    @CurrentUser() user: { id: number },

    @Query(new ZodValidationPipe(queryAddressSchema))
    query: QueryAddressDto,
  ) {
    const result = await this.addressService.findAllAddress(user.id, query);

    return successResponse(result, 'Address berhasil diambil');
  }

  @Get('default')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary: 'Ambil alamat default milik user',
    description:
      'Menampilkan alamat default (isDefault=true) milik user yang terautentikasi.',
  })
  @ApiResponse(addressResponseSchema)
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  @ApiResponse({
    status: 404,
    description: 'Alamat default tidak ditemukan',
  })
  async findDefault(@CurrentUser() user: { id: number }) {
    const address = await this.addressService.findDefaultAddress(user.id);

    return successResponse(address, 'Alamat default berhasil diambil');
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary: 'Ambil address berdasarkan ID',
    description:
      'Menampilkan detail address berdasarkan ID. User hanya bisa mengakses address miliknya sendiri.',
  })
  @ApiParam({
    name: 'id',
    type: Number,
    description: 'ID Address',
    example: 1,
  })
  @ApiResponse(addressResponseSchema)
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  @ApiResponse({
    status: 404,
    description: 'Address tidak ditemukan',
  })
  async findOne(
    @CurrentUser() user: { id: number },

    @Param('id', ParseIntPipe)
    id: number,
  ) {
    const address = await this.addressService.findAddressById(user.id, id);

    return successResponse(address, 'Address berhasil diambil');
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary: 'Perbarui address berdasarkan ID',
    description:
      'Memperbarui address milik user yang terautentikasi. Ownership tidak dapat dipindahkan.',
  })
  @ApiParam({
    name: 'id',
    type: Number,
    description: 'ID Address',
    example: 1,
  })
  @ApiBody(updateAddressApiBody)
  @ApiResponse(addressResponseSchema)
  @ApiResponse({
    status: 400,
    description: 'Validasi input gagal',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  @ApiResponse({
    status: 404,
    description: 'Address tidak ditemukan',
  })
  async update(
    @CurrentUser() user: { id: number },

    @Param('id', ParseIntPipe)
    id: number,

    @Body(new ZodValidationPipe(updateAddressSchema))
    updateAddressDto: UpdateAddressDto,
  ) {
    const address = await this.addressService.updateAddress(
      user.id,
      id,
      updateAddressDto,
    );

    return successResponse(address, 'Address berhasil diperbarui');
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary: 'Hapus address berdasarkan ID',
    description:
      'Menghapus address milik user yang terautentikasi. User hanya bisa menghapus address miliknya sendiri.',
  })
  @ApiParam({
    name: 'id',
    type: Number,
    description: 'ID Address',
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: 'Address berhasil dihapus',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  @ApiResponse({
    status: 404,
    description: 'Address tidak ditemukan',
  })
  async remove(
    @CurrentUser() user: { id: number },

    @Param('id', ParseIntPipe)
    id: number,
  ) {
    const address = await this.addressService.removeAddress(user.id, id);

    return successResponse(address, 'Address berhasil dihapus');
  }
}
