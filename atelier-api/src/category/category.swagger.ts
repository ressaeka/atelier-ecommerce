import type {
  ApiBodyOptions,
  ApiQueryOptions,
  ApiResponseOptions,
} from '@nestjs/swagger';

export const createCategoryApiBody: ApiBodyOptions = {
  description: 'Data kategori baru yang akan dibuat',
  schema: {
    type: 'object',
    required: ['name'],
    properties: {
      name: {
        type: 'string',
        minLength: 1,
        maxLength: 50,
        example: 'Elektronik',
        description: 'Nama kategori produk',
      },
    },
  },
};

export const updateCategoryApiBody: ApiBodyOptions = {
  description: 'Data pembaruan kategori',
  schema: {
    type: 'object',
    required: ['name'],
    properties: {
      name: {
        type: 'string',
        minLength: 1,
        maxLength: 50,
        example: 'Peralatan Elektronik',
        description: 'Nama kategori produk yang diperbarui',
      },
    },
  },
};

export const queryCategoryPage: ApiQueryOptions = {
  name: 'page',
  required: false,
  type: Number,
  example: 1,
  description: 'Nomor halaman (default: 1)',
};

export const queryCategoryLimit: ApiQueryOptions = {
  name: 'limit',
  required: false,
  type: Number,
  example: 10,
  description: 'Jumlah data per halaman (default: 10, max: 50)',
};

export const queryCategorySearch: ApiQueryOptions = {
  name: 'search',
  required: false,
  type: String,
  example: 'elektronik',
  description: 'Kata kunci pencarian nama kategori',
};

export const categoryResponseSchema: ApiResponseOptions = {
  status: 200,
  description: 'Detail data kategori',
  schema: {
    type: 'object',
    properties: {
      success: { type: 'boolean', example: true },
      message: { type: 'string', example: 'Category berhasil diambil' },
      data: {
        type: 'object',
        properties: {
          id: { type: 'number', example: 1 },
          name: { type: 'string', example: 'Elektronik' },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
        },
      },
    },
  },
};

export const categoriesListResponseSchema: ApiResponseOptions = {
  status: 200,
  description: 'Daftar kategori dengan pagination',
  schema: {
    type: 'object',
    properties: {
      success: { type: 'boolean', example: true },
      message: { type: 'string', example: 'Categories berhasil diambil' },
      data: {
        type: 'object',
        properties: {
          items: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                id: { type: 'number', example: 1 },
                name: { type: 'string', example: 'Elektronik' },
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
              total: { type: 'number', example: 5 },
              totalPages: { type: 'number', example: 1 },
            },
          },
        },
      },
    },
  },
};
