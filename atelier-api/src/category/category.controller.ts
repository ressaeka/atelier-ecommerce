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

import { CategoryService } from './category.service.js';

import {
  CreateCategoryDto,
  CategorySchema,
} from './dto/create-category.dto.js';

import {
  UpdateCategoryDto,
  updateCategorySchema,
} from './dto/update-category.dto.js';

import { QueryCategoryDto, queryCategorySchema } from './dto/query-category.js';

import { Public } from '../common/decorators/public.decorator.js';

import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe.js';

import { successResponse } from '../common/helpers/response.helper.js';

import { RolesGuard } from '../common/guards/roles.guard.js';
import { PermissionsGuard } from '../common/guards/permissions.guard.js';

import { Roles } from '../common/decorators/roles.decorator.js';
import { Permissions } from '../common/decorators/permissions.decorator.js';

import { PERMISSIONS } from '../common/permissions/permission.js';

import {
  categoriesListResponseSchema,
  categoryResponseSchema,
  createCategoryApiBody,
  queryCategoryLimit,
  queryCategoryPage,
  queryCategorySearch,
  updateCategoryApiBody,
} from './category.swagger.js';

@ApiTags('Category')
@ApiBearerAuth()
@Controller('category')
export class CategoryController {
  constructor(
    private readonly categoryService: CategoryService,
    private readonly configService: ConfigService,
  ) {}

  @Post('upload-image')
  @UseGuards(RolesGuard, PermissionsGuard)
  @Roles('ADMIN')
  @Permissions(PERMISSIONS.CATEGORY_CREATE, PERMISSIONS.CATEGORY_UPDATE)
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: (req, file, cb) => {
          const uploadPath = join(process.cwd(), 'uploads', 'categories');
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
    summary: 'Upload foto kategori (Admin only, max 5MB)',
  })
  uploadImage(
    @UploadedFile()
    file?: Express.Multer.File,
  ) {
    if (!file) {
      throw new BadRequestException('File gambar wajib diunggah');
    }

    const host = this.configService.get<string>('HOST') ?? 'localhost';
    const port = this.configService.get<number>('PORT') ?? 4000;
    const protocol = process.env.NODE_ENV === 'production' ? 'https' : 'http';
    const publicUrl = `${protocol}://${host}:${port}/uploads/categories/${file.filename}`;

    return successResponse(
      {
        url: publicUrl,
        filename: file.filename,
        originalName: file.originalname,
        size: file.size,
      },
      'Foto kategori berhasil diunggah',
    );
  }

  @Post()
  @UseGuards(RolesGuard, PermissionsGuard)
  @Roles('ADMIN')
  @Permissions(PERMISSIONS.CATEGORY_CREATE)
  @ApiOperation({
    summary: 'Buat kategori baru (Admin only)',
  })
  @ApiBody(createCategoryApiBody)
  @ApiResponse({
    status: 201,
    description: 'Category berhasil dibuat',
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
    description: 'Forbidden (Role ADMIN & permission CATEGORY_CREATE)',
  })
  async create(
    @Body(new ZodValidationPipe(CategorySchema))
    createCategoryDto: CreateCategoryDto,
  ) {
    const category = await this.categoryService.create(createCategoryDto);

    return successResponse(category, 'Category berhasil dibuat');
  }

  @Get()
  @Public()
  @ApiOperation({
    summary: 'Ambil daftar kategori dengan paginasi dan pencarian',
  })
  @ApiQuery(queryCategoryPage)
  @ApiQuery(queryCategoryLimit)
  @ApiQuery(queryCategorySearch)
  @ApiResponse(categoriesListResponseSchema)
  async findAll(
    @Query(new ZodValidationPipe(queryCategorySchema))
    query: QueryCategoryDto,
  ) {
    const categories = await this.categoryService.findAll(query);

    return successResponse(categories, 'Categories berhasil diambil');
  }

  @Get(':id')
  @Public()
  @ApiOperation({
    summary: 'Ambil detail kategori berdasarkan ID',
  })
  @ApiParam({
    name: 'id',
    type: Number,
    description: 'ID Kategori',
  })
  @ApiResponse(categoryResponseSchema)
  @ApiResponse({
    status: 404,
    description: 'Category tidak ditemukan',
  })
  async findOne(@Param('id', ParseIntPipe) id: number) {
    const category = await this.categoryService.findCategoryById(id);

    return successResponse(category, 'Category berhasil diambil');
  }

  @Patch(':id')
  @UseGuards(RolesGuard, PermissionsGuard)
  @Roles('ADMIN')
  @Permissions(PERMISSIONS.CATEGORY_UPDATE)
  @ApiOperation({
    summary: 'Perbarui kategori produk (Admin only)',
  })
  @ApiParam({
    name: 'id',
    type: Number,
    description: 'ID Kategori',
  })
  @ApiBody(updateCategoryApiBody)
  @ApiResponse(categoryResponseSchema)
  @ApiResponse({
    status: 400,
    description: 'Validasi input gagal',
  })
  @ApiResponse({
    status: 404,
    description: 'Category tidak ditemukan',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden (Role ADMIN & permission CATEGORY_UPDATE)',
  })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body(new ZodValidationPipe(updateCategorySchema))
    updateCategoryDto: UpdateCategoryDto,
  ) {
    const category = await this.categoryService.updateCategory(
      id,
      updateCategoryDto,
    );

    return successResponse(category, 'Category berhasil diperbarui');
  }

  @Delete(':id')
  @UseGuards(RolesGuard, PermissionsGuard)
  @Roles('ADMIN')
  @Permissions(PERMISSIONS.CATEGORY_DELETE)
  @ApiOperation({
    summary: 'Hapus kategori produk (Admin only)',
  })
  @ApiParam({
    name: 'id',
    type: Number,
    description: 'ID Kategori',
  })
  @ApiResponse({
    status: 200,
    description: 'Category berhasil dihapus',
  })
  @ApiResponse({
    status: 404,
    description: 'Category tidak ditemukan',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden (Role ADMIN & permission CATEGORY_DELETE)',
  })
  async remove(@Param('id', ParseIntPipe) id: number) {
    const category = await this.categoryService.deleteCategory(id);

    return successResponse(category, 'Category berhasil dihapus');
  }
}
