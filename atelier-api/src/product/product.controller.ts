import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  ParseIntPipe,
  Delete,
  UseGuards,
  Query,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { mkdirSync } from 'fs';
import { randomUUID } from 'crypto';

import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

import { QueryProductDto, queryProductSchema } from './dto/query-product.js';

import { ProductService } from './product.service.js';

import {
  CreateProductDto,
  createProductSchema,
} from './dto/create-product.dto.js';

import {
  UpdateProductDto,
  updateProductSchema,
} from './dto/update-product.dto.js';

import { Public } from '../common/decorators/public.decorator.js';

import { Permissions } from '../common/decorators/permissions.decorator.js';
import { PERMISSIONS } from '../common/permissions/permission.js';
import { PermissionsGuard } from '../common/guards/permissions.guard.js';

import { Roles } from '../common/decorators/roles.decorator.js';
import { RolesGuard } from '../common/guards/roles.guard.js';

import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe.js';

import { successResponse } from '../common/helpers/response.helper.js';

import {
  createProductApiBody,
  productResponseSchema,
  productsListResponseSchema,
  queryProductCategoryId,
  queryProductLimit,
  queryProductMaxPrice,
  queryProductMinPrice,
  queryProductPage,
  queryProductSearch,
  updateProductApiBody,
} from './product.swagger.js';

@ApiTags('Product')
@ApiBearerAuth()
@Controller('product')
export class ProductController {
  constructor(
    private readonly productService: ProductService,
    private readonly configService: ConfigService,
  ) {}

  @Post('upload-image')
  @UseGuards(RolesGuard, PermissionsGuard)
  @Roles('ADMIN')
  @Permissions(PERMISSIONS.PRODUCT_CREATE)
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: (req, file, cb) => {
          const uploadPath = join(process.cwd(), 'uploads', 'products');
          mkdirSync(uploadPath, { recursive: true });
          cb(null, uploadPath);
        },
        filename: (req, file, cb) => {
          const ext = extname(file.originalname).toLowerCase();
          const uniqueName = `${randomUUID()}${ext}`;
          cb(null, uniqueName);
        },
      }),
      limits: {
        fileSize: 5 * 1024 * 1024, // 5MB
      },
      fileFilter: (req, file, cb) => {
        const allowedMime = [
          'image/jpeg',
          'image/png',
          'image/webp',
          'image/avif',
        ];
        const allowedExt = ['.jpg', '.jpeg', '.png', '.webp', '.avif'];
        const ext = extname(file.originalname).toLowerCase();

        if (allowedMime.includes(file.mimetype) && allowedExt.includes(ext)) {
          cb(null, true);
        } else {
          cb(
            new BadRequestException(
              'Format file tidak didukung. Gunakan JPG, PNG, WEBP, atau AVIF.',
            ),
            false,
          );
        }
      },
    }),
  )
  @ApiConsumes('multipart/form-data')
  @ApiOperation({
    summary: 'Upload foto produk (Admin only, max 5MB)',
  })
  async uploadImage(
    @UploadedFile()
    file?: Express.Multer.File,
  ) {
    if (!file) {
      throw new BadRequestException('File gambar wajib diunggah');
    }

    const host = this.configService.get<string>('HOST') ?? 'localhost';
    const port = this.configService.get<number>('PORT') ?? 4000;
    const protocol = process.env.NODE_ENV === 'production' ? 'https' : 'http';
    const publicUrl = `${protocol}://${host}:${port}/uploads/products/${file.filename}`;

    return successResponse(
      {
        url: publicUrl,
        filename: file.filename,
        originalName: file.originalname,
        size: file.size,
      },
      'Foto produk berhasil diunggah',
    );
  }

  @Post()
  @UseGuards(RolesGuard, PermissionsGuard)
  @Roles('ADMIN')
  @Permissions(PERMISSIONS.PRODUCT_CREATE)
  @ApiOperation({
    summary: 'Buat produk baru (Admin only)',
  })
  @ApiBody(createProductApiBody)
  @ApiResponse({
    status: 201,
    description: 'Product berhasil dibuat',
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
    status: 403,
    description: 'Forbidden (Role ADMIN & permission PRODUCT_CREATE)',
  })
  async create(
    @Body(new ZodValidationPipe(createProductSchema))
    createProductDto: CreateProductDto,
  ) {
    const product = await this.productService.create(createProductDto);

    return successResponse(product, 'Product berhasil dibuat');
  }

  @Get()
  @Public()
  @ApiOperation({
    summary: 'Ambil daftar produk dengan filter pencarian dan paginasi',
  })
  @ApiQuery(queryProductPage)
  @ApiQuery(queryProductLimit)
  @ApiQuery(queryProductSearch)
  @ApiQuery(queryProductCategoryId)
  @ApiQuery(queryProductMinPrice)
  @ApiQuery(queryProductMaxPrice)
  @ApiResponse(productsListResponseSchema)
  async findAll(
    @Query(new ZodValidationPipe(queryProductSchema))
    query: QueryProductDto,
  ) {
    const product = await this.productService.findAllProduct(query);

    return successResponse(product, 'Product berhasil diambil');
  }

  @Get(':id')
  @Public()
  @ApiOperation({
    summary: 'Ambil detail produk berdasarkan ID',
  })
  @ApiParam({
    name: 'id',
    type: Number,
    description: 'ID Produk',
  })
  @ApiResponse(productResponseSchema)
  @ApiResponse({
    status: 404,
    description: 'Product tidak ditemukan',
  })
  async findOne(@Param('id', ParseIntPipe) id: number) {
    const product = await this.productService.findProductById(id);

    return successResponse(product, 'Product berhasil diambil');
  }

  @Patch(':id')
  @UseGuards(RolesGuard, PermissionsGuard)
  @Roles('ADMIN')
  @Permissions(PERMISSIONS.PRODUCT_UPDATE)
  @ApiOperation({
    summary: 'Perbarui produk (Admin only)',
  })
  @ApiParam({
    name: 'id',
    type: Number,
    description: 'ID Produk',
  })
  @ApiBody(updateProductApiBody)
  @ApiResponse(productResponseSchema)
  @ApiResponse({
    status: 400,
    description: 'Validasi input gagal',
  })
  @ApiResponse({
    status: 404,
    description: 'Product tidak ditemukan',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden (Role ADMIN & permission PRODUCT_UPDATE)',
  })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body(new ZodValidationPipe(updateProductSchema))
    updateProductDto: UpdateProductDto,
  ) {
    const product = await this.productService.updateProduct(
      id,
      updateProductDto,
    );

    return successResponse(product, 'Product berhasil diperbarui');
  }

  @Delete(':id')
  @UseGuards(RolesGuard, PermissionsGuard)
  @Roles('ADMIN')
  @Permissions(PERMISSIONS.PRODUCT_DELETE)
  @ApiOperation({
    summary: 'Hapus produk berdasarkan ID (Admin only)',
  })
  @ApiParam({
    name: 'id',
    type: Number,
    description: 'ID Produk',
  })
  @ApiResponse({
    status: 200,
    description: 'Product berhasil dihapus',
  })
  @ApiResponse({
    status: 404,
    description: 'Product tidak ditemukan',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden (Role ADMIN & permission PRODUCT_DELETE)',
  })
  async remove(@Param('id', ParseIntPipe) id: number) {
    const product = await this.productService.removeProduct(id);

    return successResponse(product, 'Product berhasil dihapus');
  }
}
