import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  UseGuards,
} from '@nestjs/common';

import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

import { WishlistService } from './wishlist.service.js';

import {
  createWishlistItemSchema,
  CreateWishlistItemDto,
} from './dto/create-wishlist.dto.js';

import { JwtAuthGuard } from '../common/guards/jwt-auth.guard.js';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe.js';
import { successResponse } from '../common/helpers/response.helper.js';
import { CurrentUser } from '../common/decorators/current-user.decorator.js';

@ApiTags('Wishlist')
@ApiBearerAuth()
@Controller('wishlist')
export class WishlistController {
  constructor(private readonly wishlistService: WishlistService) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary: 'Ambil wishlist milik user',
    description:
      'Menampilkan wishlist milik user yang terautentikasi. Jika wishlist belum ada, akan dibuat otomatis.',
  })
  @ApiResponse({
    status: 200,
    description: 'Wishlist berhasil diambil',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  async getWishlist(@CurrentUser() user: { id: number }) {
    const wishlist = await this.wishlistService.getWishlist(user.id);

    return successResponse(wishlist, 'Wishlist berhasil diambil');
  }

  @Post('items')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary: 'Tambah item ke wishlist',
    description:
      'Menambahkan produk ke wishlist. Jika produk sudah ada, akan mengembalikan error conflict.',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        productId: { type: 'number', example: 1 },
      },
      required: ['productId'],
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Item berhasil ditambahkan ke wishlist',
  })
  @ApiResponse({
    status: 400,
    description: 'Validasi input gagal',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  @ApiResponse({
    status: 409,
    description: 'Produk sudah ada di wishlist',
  })
  async addItem(
    @CurrentUser() user: { id: number },

    @Body(new ZodValidationPipe(createWishlistItemSchema))
    createWishlistItemDto: CreateWishlistItemDto,
  ) {
    const item = await this.wishlistService.addItem(
      user.id,
      createWishlistItemDto.productId,
    );

    return successResponse(item, 'Item berhasil ditambahkan ke wishlist');
  }

  @Delete('items/:productId')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary: 'Hapus item dari wishlist',
    description: 'Menghapus produk dari wishlist berdasarkan productId.',
  })
  @ApiParam({
    name: 'productId',
    type: Number,
    description: 'ID Product',
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: 'Item berhasil dihapus dari wishlist',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  @ApiResponse({
    status: 404,
    description: 'Wishlist atau product tidak ditemukan di wishlist',
  })
  async removeItem(
    @CurrentUser() user: { id: number },

    @Param('productId', ParseIntPipe)
    productId: number,
  ) {
    const result = await this.wishlistService.removeItem(user.id, productId);

    return successResponse(result, 'Item berhasil dihapus dari wishlist');
  }
}
