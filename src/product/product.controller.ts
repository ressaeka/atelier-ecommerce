import {
  Controller,
  Get,
  Post,
  Body,
  // Patch,
  Param,
  ParseIntPipe,
  // Delete,
  UseGuards,
  Query,
} from '@nestjs/common';
import { QueryProductDto, queryProductSchema } from './dto/query-product.js';
import { ProductService } from './product.service.js';
import { CreateProductDto } from './dto/create-product.dto.js';
// import { UpdateProductDto } from './dto/update-product.dto.js';
import { Permissions } from '../common/decorators/permissions.decorator.js';
import { PERMISSIONS } from '../common/permissions/permission.js';
import { PermissionsGuard } from '../common/guards/permissions.guard.js';
import { Roles } from '../common/decorators/roles.decorator.js';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard.js';
import { RolesGuard } from '../common/guards/roles.guard.js';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe.js';
import { successResponse } from '../common/helpers/response.helper.js';

@Controller('product')
export class ProductController {
  constructor(private readonly productService: ProductService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
  @Roles('ADMIN')
  @Permissions(PERMISSIONS.CATEGORY_CREATE)
  async create(@Body() createProductDto: CreateProductDto) {
    const product = await this.productService.create(createProductDto);

    return successResponse(product, 'Product berhasil dibuat');
  }

  @Get()
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions(PERMISSIONS.PRODUCT_READ)
  async findAll(
    @Query(new ZodValidationPipe(queryProductSchema))
    query: QueryProductDto,
  ) {
    const product = await this.productService.findAllProduct(query);
    return successResponse(product, 'Product berhasil diambil');
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions(PERMISSIONS.PRODUCT_READ)
  async findOne(@Param('id', ParseIntPipe) id: number) {
    const product = await this.productService.findProductById(id);

    return successResponse(product, 'Category berhasil diambil');
  }

  // @Patch(':id')
  // update(@Param('id') id: string, @Body() updateProductDto: UpdateProductDto) {
  //   return this.productService.update(+id, updateProductDto);
  // }

  // @Delete(':id')
  // remove(@Param('id') id: string) {
  //   return this.productService.remove(+id);
  // }
}
