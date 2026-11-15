jest.mock('../../generated/prisma/client.js', () => ({
  Prisma: {
    PrismaClientKnownRequestError: class MockPrismaClientKnownRequestError extends Error {
      code = '';
    },
  },
}));

jest.mock('../prisma/prisma.service.js', () => ({
  PrismaService: class MockPrismaService {},
}));

import { NotFoundException } from '@nestjs/common';
import { ProductService } from './product.service.js';
import { createProductSchema } from './dto/create-product.dto.js';
import { updateProductSchema } from './dto/update-product.dto.js';
import type { ProductRepository } from './product.repository.js';
import type { CategoryRepository } from '../category/category.repository.js';

describe('ProductService & Product DTOs — Image Preservation on Edit', () => {
  let service: ProductService;
  let mockProductRepo: {
    create: jest.Mock;
    findById: jest.Mock;
    findAll: jest.Mock;
    count: jest.Mock;
    update: jest.Mock;
    remove: jest.Mock;
  };
  let mockCategoryRepo: {
    findCategoryById: jest.Mock;
  };

  const baseDbProduct = {
    id: 1,
    name: 'Kemeja Casual',
    description: 'Kemeja bahan katun nyaman',
    price: 520000,
    stock: 15,
    image: 'public/images/recommend5.jpeg',
    isActive: true,
    categoryId: 2,
    createdAt: new Date('2026-10-01T00:00:00.000Z'),
    updatedAt: new Date('2026-10-01T00:00:00.000Z'),
  };

  beforeEach(() => {
    mockProductRepo = {
      create: jest.fn(),
      findById: jest.fn(),
      findAll: jest.fn(),
      count: jest.fn(),
      update: jest
        .fn()
        .mockImplementation((_id: number, data: Record<string, unknown>) =>
          Promise.resolve({
            ...baseDbProduct,
            ...data,
            image: (data.image as string | undefined) ?? baseDbProduct.image,
            categoryId:
              (data.category as { connect?: { id?: number } } | undefined)
                ?.connect?.id ?? baseDbProduct.categoryId,
          }),
        ),
      remove: jest.fn(),
    };

    mockCategoryRepo = {
      findCategoryById: jest.fn().mockResolvedValue({ id: 2, name: 'Kemeja' }),
    };

    service = new ProductService(
      mockProductRepo as unknown as ProductRepository,
      mockCategoryRepo as unknown as CategoryRepository,
    );
  });

  it('1. Edit stok saja -> berhasil, foto lama (public/images/recommend5.jpeg) tetap dan tidak ditimpa', async () => {
    const parsed = updateProductSchema.parse({ stock: 25 });
    const updated = await service.updateProduct(1, parsed);

    expect(mockProductRepo.update).toHaveBeenCalledWith(1, { stock: 25 });
    expect(updated.stock).toBe(25);
    expect(updated.image).toBe('public/images/recommend5.jpeg');
  });

  it('2. Edit harga saja -> berhasil, foto lama tetap', async () => {
    const parsed = updateProductSchema.parse({ price: 590000 });
    const updated = await service.updateProduct(1, parsed);

    expect(mockProductRepo.update).toHaveBeenCalledWith(1, { price: 590000 });
    expect(updated.price).toBe(590000);
    expect(updated.image).toBe('public/images/recommend5.jpeg');
  });

  it('3. Edit deskripsi saja -> berhasil, foto lama tetap', async () => {
    const parsed = updateProductSchema.parse({
      description: 'Deskripsi baru edisi terbatas',
    });
    const updated = await service.updateProduct(1, parsed);

    expect(mockProductRepo.update).toHaveBeenCalledWith(1, {
      description: 'Deskripsi baru edisi terbatas',
    });
    expect(updated.description).toBe('Deskripsi baru edisi terbatas');
    expect(updated.image).toBe('public/images/recommend5.jpeg');
  });

  it('4. Edit kategori saja -> berhasil, foto lama tetap', async () => {
    const parsed = updateProductSchema.parse({ categoryId: 3 });
    const updated = await service.updateProduct(1, parsed);

    expect(mockProductRepo.update).toHaveBeenCalledWith(1, {
      category: { connect: { id: 3 } },
    });
    expect(updated.categoryId).toBe(3);
    expect(updated.image).toBe('public/images/recommend5.jpeg');
  });

  it('5. Ganti foto -> berhasil, foto baru tersimpan', async () => {
    const newUploadedUrl =
      'http://localhost:4000/uploads/products/new-photo.webp';
    const parsed = updateProductSchema.parse({
      stock: 20,
      image: newUploadedUrl,
    });
    const updated = await service.updateProduct(1, parsed);

    expect(mockProductRepo.update).toHaveBeenCalledWith(1, {
      stock: 20,
      image: newUploadedUrl,
    });
    expect(updated.image).toBe(newUploadedUrl);
  });

  it('6. Menolak string image kosong atau hanya spasi pada updateProductSchema', () => {
    expect(updateProductSchema.safeParse({ image: '' }).success).toBe(false);
    expect(updateProductSchema.safeParse({ image: '   ' }).success).toBe(false);
  });

  it('7. Tambah produk tanpa foto -> validasi gagal pada createProductSchema', () => {
    const resEmpty = createProductSchema.safeParse({
      name: 'Produk Baru',
      price: 350000,
      stock: 10,
      image: '',
      categoryId: 2,
    });
    expect(resEmpty.success).toBe(false);
  });

  it('8. Tambah produk dengan foto valid -> berhasil', async () => {
    const dto = createProductSchema.parse({
      name: 'Blazer Linen',
      description: 'Blazer formal',
      price: 890000,
      stock: 8,
      image: 'http://localhost:4000/uploads/products/blazer.jpg',
      categoryId: 2,
    });

    mockProductRepo.create.mockResolvedValue({
      ...baseDbProduct,
      id: 99,
      ...dto,
    });

    const created = await service.create(dto);
    expect(created.id).toBe(99);
    expect(created.image).toBe(
      'http://localhost:4000/uploads/products/blazer.jpg',
    );
  });

  it('melempar NotFoundException saat kategori tidak ditemukan pada create', async () => {
    mockCategoryRepo.findCategoryById.mockResolvedValueOnce(null);
    await expect(
      service.create({
        name: 'Produk X',
        price: 100000,
        stock: 5,
        image: 'https://example.com/img.jpg',
        categoryId: 999,
      }),
    ).rejects.toThrow(NotFoundException);
  });
});
