import type {
  ApiBodyOptions,
  ApiQueryOptions,
  ApiResponseOptions,
} from '@nestjs/swagger';

export const createProductApiBody: ApiBodyOptions = {
  description: 'Data produk baru yang akan dibuat',
  schema: {
    type: 'object',
    required: ['name', 'price', 'stock', 'image', 'categoryId'],
    properties: {
      name: {
        type: 'string',
        minLength: 1,
        maxLength: 100,
        example: 'Laptop Gaming ROG',
        description: 'Nama produk',
      },
      description: {
        type: 'string',
        example: 'Laptop gaming berperforma tinggi dengan GPU RTX 4070',
        description: 'Deskripsi produk (opsional)',
      },
      price: {
        type: 'integer',
        minimum: 1,
        example: 25000000,
        description: 'Harga produk dalam format integer rupiah (positif)',
      },
      stock: {
        type: 'integer',
        minimum: 0,
        example: 15,
        description: 'Jumlah stok produk',
      },
      image: {
        type: 'string',
        format: 'uri',
        example: 'https://example.com/product.jpg',
        description: 'URL gambar produk',
      },
      categoryId: {
        type: 'integer',
        minimum: 1,
        example: 1,
        description: 'ID kategori produk',
      },
    },
  },
};

export const updateProductApiBody: ApiBodyOptions = {
  description: 'Data pembaruan produk (semua field bersifat opsional)',
  schema: {
    type: 'object',
    properties: {
      name: {
        type: 'string',
        minLength: 1,
        maxLength: 100,
        example: 'Laptop Gaming ROG Strix',
      },
      description: {
        type: 'string',
        example: 'Pembaruan deskripsi produk',
      },
      price: {
        type: 'number',
        example: 24500000,
      },
      stock: {
        type: 'integer',
        example: 20,
      },
      image: {
        type: 'string',
        format: 'uri',
        example: 'https://example.com/product-new.jpg',
      },
      categoryId: {
        type: 'integer',
        example: 1,
      },
    },
  },
};

export const queryProductPage: ApiQueryOptions = {
  name: 'page',
  required: false,
  type: Number,
  example: 1,
  description: 'Nomor halaman (default: 1)',
};

export const queryProductLimit: ApiQueryOptions = {
  name: 'limit',
  required: false,
  type: Number,
  example: 10,
  description: 'Jumlah data per halaman (default: 10, max: 50)',
};

export const queryProductSearch: ApiQueryOptions = {
  name: 'search',
  required: false,
  type: String,
  example: 'laptop',
  description: 'Pencarian berdasarkan nama produk',
};

export const queryProductCategoryId: ApiQueryOptions = {
  name: 'categoryId',
  required: false,
  type: Number,
  example: 1,
  description: 'Filter produk berdasarkan Category ID',
};

export const queryProductMinPrice: ApiQueryOptions = {
  name: 'minPrice',
  required: false,
  type: Number,
  example: 1000000,
  description: 'Filter harga minimum produk',
};

export const queryProductMaxPrice: ApiQueryOptions = {
  name: 'maxPrice',
  required: false,
  type: Number,
  example: 30000000,
  description: 'Filter harga maksimum produk',
};

export const productResponseSchema: ApiResponseOptions = {
  status: 200,
  description: 'Detail data produk',
  schema: {
    type: 'object',
    properties: {
      success: { type: 'boolean', example: true },
      message: { type: 'string', example: 'Product berhasil diambil' },
      data: {
        type: 'object',
        properties: {
          id: { type: 'number', example: 1 },
          name: { type: 'string', example: 'Laptop Gaming ROG' },
          description: { type: 'string', example: 'Laptop gaming' },
          price: { type: 'number', example: 25000000 },
          stock: { type: 'number', example: 15 },
          image: { type: 'string', example: 'https://example.com/product.jpg' },
          categoryId: { type: 'number', example: 1 },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
        },
      },
    },
  },
};

export const productsListResponseSchema: ApiResponseOptions = {
  status: 200,
  description: 'Daftar produk dengan pagination',
  schema: {
    type: 'object',
    properties: {
      success: { type: 'boolean', example: true },
      message: { type: 'string', example: 'Product berhasil diambil' },
      data: {
        type: 'object',
        properties: {
          items: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                id: { type: 'number', example: 1 },
                name: { type: 'string', example: 'Laptop Gaming ROG' },
                description: { type: 'string', example: 'Laptop gaming' },
                price: { type: 'number', example: 25000000 },
                stock: { type: 'number', example: 15 },
                image: {
                  type: 'string',
                  example: 'https://example.com/product.jpg',
                },
                categoryId: { type: 'number', example: 1 },
                createdAt: { type: 'string', format: 'date-time' },
                updatedAt: { type: 'string', format: 'date-time' },
              },
            },
          },
          meta: {
            type: 'object',
            properties: {
              page: { type: 'number', example: 1 },
              limit: { type: 'number', example: 10 },
              total: { type: 'number', example: 50 },
              totalPages: { type: 'number', example: 5 },
            },
          },
        },
      },
    },
  },
};
