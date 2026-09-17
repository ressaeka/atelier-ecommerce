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
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

import { CartService } from './cart.service.js';

import { addCartItemSchema, AddCartItemDto } from './dto/create-cart.dto.js';

import {
  updateCartItemSchema,
  UpdateCartItemDto,
} from './dto/update-cart.dto.js';

import { JwtAuthGuard } from '../common/guards/jwt-auth.guard.js';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe.js';
import { successResponse } from '../common/helpers/response.helper.js';
import { CurrentUser } from '../common/decorators/current-user.decorator.js';

import {
  addCartItemApiBody,
  updateCartItemApiBody,
  cartResponseSchema,
  cartItemCreatedResponseSchema,
  cartItemResponseSchema,
  cartMessageResponseSchema,
} from './cart.swagger.js';

@ApiTags('Cart')
@ApiBearerAuth()
@Controller('cart')
export class CartController {
  constructor(private readonly cartService: CartService) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary: 'Ambil cart milik user',
    description:
      'Menampilkan cart milik user yang terautentikasi. Jika cart belum ada, akan dibuat otomatis.',
  })
  @ApiResponse(cartResponseSchema)
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  async findCart(@CurrentUser() user: { id: number }) {
    const cart = await this.cartService.findCart(user.id);

    return successResponse(cart, 'Cart berhasil diambil');
  }

  @Post('items')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary: 'Tambah item ke cart',
    description:
      'Menambahkan produk ke cart. Jika produk sudah ada di cart, quantity akan ditambahkan. Jika cart belum ada, akan dibuat otomatis.',
  })
  @ApiBody(addCartItemApiBody)
  @ApiResponse(cartItemCreatedResponseSchema)
  @ApiResponse({
    status: 400,
    description: 'Validasi input gagal atau quantity melebihi stock',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  @ApiResponse({
    status: 404,
    description: 'Product tidak ditemukan',
  })
  async addItem(
    @CurrentUser() user: { id: number },

    @Body(new ZodValidationPipe(addCartItemSchema))
    addCartItemDto: AddCartItemDto,
  ) {
    const item = await this.cartService.addItem(user.id, addCartItemDto);

    return successResponse(item, 'Item berhasil ditambahkan ke cart');
  }

  @Patch('items/:productId')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary: 'Update quantity item di cart',
    description: 'Memperbarui quantity produk di cart berdasarkan productId.',
  })
  @ApiParam({
    name: 'productId',
    type: Number,
    description: 'ID Product',
    example: 1,
  })
  @ApiBody(updateCartItemApiBody)
  @ApiResponse(cartItemResponseSchema)
  @ApiResponse({
    status: 400,
    description: 'Validasi input gagal atau quantity melebihi stock',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  @ApiResponse({
    status: 404,
    description: 'Cart atau product tidak ditemukan di cart',
  })
  async updateItem(
    @CurrentUser() user: { id: number },

    @Param('productId', ParseIntPipe)
    productId: number,

    @Query('variantId', new ParseIntPipe({ optional: true }))
    variantId: number | null,

    @Body(new ZodValidationPipe(updateCartItemSchema))
    updateCartItemDto: UpdateCartItemDto,
  ) {
    const item = await this.cartService.updateItem(
      user.id,
      productId,
      updateCartItemDto,
      variantId,
    );

    return successResponse(item, 'Item berhasil diperbarui');
  }

  @Delete('items/:productId')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary: 'Hapus item dari cart',
    description: 'Menghapus produk dari cart berdasarkan productId.',
  })
  @ApiParam({
    name: 'productId',
    type: Number,
    description: 'ID Product',
    example: 1,
  })
  @ApiResponse(cartMessageResponseSchema)
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  @ApiResponse({
    status: 404,
    description: 'Cart atau product tidak ditemukan di cart',
  })
  async removeItem(
    @CurrentUser() user: { id: number },

    @Param('productId', ParseIntPipe)
    productId: number,

    @Query('variantId', new ParseIntPipe({ optional: true }))
    variantId: number | null,
  ) {
    const result = await this.cartService.removeItem(
      user.id,
      productId,
      variantId,
    );

    return successResponse(result, 'Item berhasil dihapus dari cart');
  }

  @Delete()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary: 'Kosongkan cart',
    description:
      'Menghapus semua item dari cart milik user yang terautentikasi.',
  })
  @ApiResponse(cartMessageResponseSchema)
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  @ApiResponse({
    status: 404,
    description: 'Cart tidak ditemukan',
  })
  async clearCart(@CurrentUser() user: { id: number }) {
    const result = await this.cartService.clearCart(user.id);

    return successResponse(result, 'Cart berhasil dikosongkan');
  }
}
