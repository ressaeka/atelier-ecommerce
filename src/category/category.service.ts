import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { Prisma } from '../../generated/prisma/client.js';

import { CreateCategoryDto } from './dto/create-category.dto.js';
import { QueryCategoryDto } from './dto/query-category.js';
import { CategoryRepository } from './category.repository.js';
import { Category } from './entities/category.entity.js';
import { UpdateCategoryDto } from './dto/update-category.dto.js';

@Injectable()
export class CategoryService {
  constructor(private readonly categoryRepository: CategoryRepository) {}

  async create(dto: CreateCategoryDto): Promise<Category> {
    const existingCategory = await this.categoryRepository.findCategoryByName(
      dto.name,
    );

    if (existingCategory) {
      throw new ConflictException('Category sudah ada');
    }

    const category = await this.categoryRepository.create({
      name: dto.name,
    });

    return this.toEntity(category);
  }

  async findCategoryByName(name: string): Promise<Category> {
    const category = await this.categoryRepository.findCategoryByName(name);

    if (!category) {
      throw new NotFoundException('Category tidak ditemukan');
    }

    return this.toEntity(category);
  }

  async findAll(query: QueryCategoryDto) {
    const { page, limit, search } = query;

    const skip = (page - 1) * limit;

    const where: Prisma.CategoryWhereInput = search
      ? {
          name: {
            contains: search,
            mode: 'insensitive',
          },
        }
      : {};

    const [categories, total] = await Promise.all([
      this.categoryRepository.findAllCategory(where, skip, limit),
      this.categoryRepository.count(where),
    ]);

    return {
      items: categories.map((category) => this.toEntity(category)),
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findCategoryById(id: number): Promise<Category> {
    const category = await this.categoryRepository.findCategoryById(id);

    if (!category) {
      throw new NotFoundException(`Category dengan ${id} tidak ditemukan`);
    }

    return this.toEntity(category);
  }

  async updateCategory(
    id: number,
    updateCategoryDto: UpdateCategoryDto,
  ): Promise<Category> {
    const data: Prisma.CategoryUpdateInput = {
      ...updateCategoryDto,
    };

    if (updateCategoryDto.name) {
      const existingCategory =
        await this.categoryRepository.findExistingForUpdate(
          id,
          updateCategoryDto.name,
        );

      if (existingCategory) {
        throw new ConflictException('Category sudah ada');
      }
    }

    try {
      const category = await this.categoryRepository.updateCategory(id, data);

      return this.toEntity(category);
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2025'
      ) {
        throw new NotFoundException(`Category dengan ${id} tidak ditemukan`);
      }

      throw error;
    }
  }

  async deleteCategory(id: number): Promise<Category> {
    try {
      const category = await this.categoryRepository.deleteCategory(id);

      return this.toEntity(category);
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          throw new NotFoundException(`Category dengan ${id} tidak ditemukan`);
        }

        if (error.code === 'P2003') {
          throw new ConflictException(
            `Category dengan ${id} tidak bisa dihapus karena masih memiliki product`,
          );
        }
      }

      throw error;
    }
  }

  private toEntity(category: {
    id: number;
    name: string;
    createdAt: Date;
    updatedAt: Date;
  }): Category {
    const entity = new Category();

    entity.id = category.id;
    entity.name = category.name;
    entity.createdAt = category.createdAt;
    entity.updatedAt = category.updatedAt;

    return entity;
  }
}
