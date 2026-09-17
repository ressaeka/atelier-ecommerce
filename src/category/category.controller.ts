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
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe.js';
import { successResponse } from '../common/helpers/response.helper.js';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard.js';
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
  constructor(private readonly categoryService: CategoryService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
  @Roles('ADMIN')
  @Permissions(PERMISSIONS.CATEGORY_CREATE)
  @ApiOperation({ summary: 'Buat kategori baru (Admin only)' })
  @ApiBody(createCategoryApiBody)
  @ApiResponse({ status: 201, description: 'Category berhasil dibuat' })
  @ApiResponse({ status: 400, description: 'Validasi input gagal' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
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
  @ApiOperation({
    summary: 'Ambil daftar kategori dengan paginasi dan pencarian',
  })
  @ApiQuery(queryCategoryPage)
  @ApiQuery(queryCategoryLimit)
  @ApiQuery(queryCategorySearch)
  @ApiResponse(categoriesListResponseSchema)
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async findAll(
    @Query(new ZodValidationPipe(queryCategorySchema))
    query: QueryCategoryDto,
  ) {
    const categories = await this.categoryService.findAll(query);

    return successResponse(categories, 'Categories berhasil diambil');
  }

  @Get(':id')
  @ApiOperation({ summary: 'Ambil detail kategori berdasarkan ID' })
  @ApiParam({ name: 'id', type: Number, description: 'ID Kategori' })
  @ApiResponse(categoryResponseSchema)
  @ApiResponse({ status: 404, description: 'Category tidak ditemukan' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async findOne(@Param('id', ParseIntPipe) id: number) {
    const category = await this.categoryService.findCategoryById(id);

    return successResponse(category, 'Category berhasil diambil');
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
  @Roles('ADMIN')
  @Permissions(PERMISSIONS.CATEGORY_UPDATE)
  @ApiOperation({ summary: 'Perbarui kategori produk (Admin only)' })
  @ApiParam({ name: 'id', type: Number, description: 'ID Kategori' })
  @ApiBody(updateCategoryApiBody)
  @ApiResponse(categoryResponseSchema)
  @ApiResponse({ status: 400, description: 'Validasi input gagal' })
  @ApiResponse({ status: 404, description: 'Category tidak ditemukan' })
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
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
  @Roles('ADMIN')
  @Permissions(PERMISSIONS.CATEGORY_DELETE)
  @ApiOperation({ summary: 'Hapus kategori produk (Admin only)' })
  @ApiParam({ name: 'id', type: Number, description: 'ID Kategori' })
  @ApiResponse({ status: 200, description: 'Category berhasil dihapus' })
  @ApiResponse({ status: 404, description: 'Category tidak ditemukan' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden (Role ADMIN & permission CATEGORY_DELETE)',
  })
  async remove(@Param('id', ParseIntPipe) id: number) {
    const category = await this.categoryService.deleteCategory(id);

    return successResponse(category, 'Category berhasil dihapus');
  }
}
