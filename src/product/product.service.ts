import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateProductDto } from './dto/create-product.dto.js';
// import { UpdateProductDto } from './dto/update-product.dto';
import { ProductRepository } from './product.repository.js';
import { Product } from './entities/product.entity.js';
import { CategoryRepository } from '../category/category.repository.js';
import { QueryProductDto } from './dto/query-product.js';
import { Prisma } from '../../generated/prisma/client.js';

@Injectable()
export class ProductService {
  constructor(
    private readonly productRepository: ProductRepository,
    private readonly categoryRepository: CategoryRepository,
  ) {}

  async create(dto: CreateProductDto): Promise<Product> {
    const existingCategory = await this.categoryRepository.findCategoryById(
      dto.categoryId,
    );

    if (!existingCategory) {
      throw new NotFoundException('Category tidak tersedia');
    }

    const product = await this.productRepository.create({
      name: dto.name,
      description: dto.description,
      price: dto.price,
      stock: dto.stock,
      category: {
        connect: {
          id: dto.categoryId,
        },
      },
    });

    return this.toEntity(product);
  }

  async findAllProduct(query: QueryProductDto) {
    const { page, limit, search, categoryId, minPrice, maxPrice } = query;

    const skip = (page - 1) * limit;

    const where: Prisma.ProductWhereInput = {
      ...(search && {
        name: {
          contains: search,
          mode: 'insensitive',
        },
      }),

      ...(categoryId !== undefined && {
        categoryId,
      }),

      ...(minPrice !== undefined || maxPrice !== undefined
        ? {
            price: {
              ...(minPrice !== undefined && { gte: minPrice }),
              ...(maxPrice !== undefined && { lte: maxPrice }),
            },
          }
        : {}),
    };

    const [products, total] = await Promise.all([
      this.productRepository.findAll(where, skip, limit),
      this.productRepository.count(where),
    ]);

    return {
      items: products.map((product) => this.toEntity(product)),
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findProductById(id: number): Promise<Product> {
    const product = await this.productRepository.findById(id);

    if (!product) {
      throw new NotFoundException('Product tidak di temukan');
    }

    return this.toEntity(product);
  }

  private toEntity(product: {
    id: number;
    name: string;
    description: string | null;
    price: number;
    stock: number;
    categoryId: number;
    createdAt: Date;
    updatedAt: Date;
  }): Product {
    const entity = new Product();

    entity.id = product.id;
    entity.name = product.name;
    entity.description = product.description;
    entity.price = product.price;
    entity.stock = product.stock;
    entity.categoryId = product.categoryId;
    entity.createdAt = product.createdAt;
    entity.updatedAt = product.updatedAt;

    return entity;
  }
}
