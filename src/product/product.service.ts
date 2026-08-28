import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateProductDto } from './dto/create-product.dto.js';
// import { UpdateProductDto } from './dto/update-product.dto';
import { ProductRepository } from './product.repository.js';
import { Product } from './entities/product.entity.js';
import { CategoryRepository } from '../category/category.repository.js';

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

  // findAll() {
  //   return `This action returns all product`;
  // }

  // findOne(id: number) {
  //   return `This action returns a #${id} product`;
  // }

  // update(id: number, updateProductDto: UpdateProductDto) {
  //   return `This action updates a #${id} product`;
  // }

  // remove(id: number) {
  //   return `This action removes a #${id} product`;
  // }

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
