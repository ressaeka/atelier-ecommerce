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

@Controller('category')
export class CategoryController {
  constructor(private readonly categoryService: CategoryService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
  @Roles('ADMIN')
  @Permissions(PERMISSIONS.CATEGORY_CREATE)
  async create(
    @Body(new ZodValidationPipe(CategorySchema))
    createCategoryDto: CreateCategoryDto,
  ) {
    const category = await this.categoryService.create(createCategoryDto);

    return successResponse(category, 'Category berhasil dibuat');
  }

  @Get()
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions(PERMISSIONS.CATEGORY_READ)
  async findAll(
    @Query(new ZodValidationPipe(queryCategorySchema))
    query: QueryCategoryDto,
  ) {
    const categories = await this.categoryService.findAll(query);

    return successResponse(categories, 'Categories berhasil diambil');
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions(PERMISSIONS.CATEGORY_READ)
  async findOne(@Param('id', ParseIntPipe) id: number) {
    const category = await this.categoryService.findCategoryById(id);

    return successResponse(category, 'Category berhasil diambil');
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
  @Roles('ADMIN')
  @Permissions(PERMISSIONS.CATEGORY_UPDATE)
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
  async remove(@Param('id', ParseIntPipe) id: number) {
    const category = await this.categoryService.deleteCategory(id);

    return successResponse(category, 'Category berhasil dihapus');
  }
}
