import type {
  ApiBodyOptions,
  ApiQueryOptions,
  ApiResponseOptions,
} from '@nestjs/swagger';

export const updateUserApiBody: ApiBodyOptions = {
  description: 'Data pembaruan user (semua field bersifat opsional)',
  schema: {
    type: 'object',
    properties: {
      name: {
        type: 'string',
        minLength: 3,
        maxLength: 100,
        example: 'Reysa Eka Pratama',
      },
      username: {
        type: 'string',
        minLength: 3,
        maxLength: 50,
        example: 'reysa_eka_new',
      },
      email: {
        type: 'string',
        format: 'email',
        example: 'reysa.new@example.com',
      },
      phone: {
        type: 'string',
        example: '+6281234567890',
        description: 'Nomor telepon Indonesia (+62/62/08...)',
      },
    },
  },
};

export const queryUsersPage: ApiQueryOptions = {
  name: 'page',
  required: false,
  type: Number,
  example: 1,
  description: 'Nomor halaman (default: 1)',
};

export const queryUsersLimit: ApiQueryOptions = {
  name: 'limit',
  required: false,
  type: Number,
  example: 10,
  description: 'Jumlah data per halaman (default: 10, max: 50)',
};

export const queryUsersSearch: ApiQueryOptions = {
  name: 'search',
  required: false,
  type: String,
  example: 'reysa',
  description: 'Kata kunci pencarian nama, username, email, atau nomor telepon',
};

export const userResponseSchema: ApiResponseOptions = {
  status: 200,
  description: 'Data user',
  schema: {
    type: 'object',
    properties: {
      success: { type: 'boolean', example: true },
      message: { type: 'string', example: 'User berhasil diambil' },
      data: {
        type: 'object',
        properties: {
          id: { type: 'number', example: 1 },
          name: { type: 'string', example: 'Reysa Eka' },
          username: { type: 'string', example: 'reysa_eka' },
          email: { type: 'string', example: 'reysa@example.com' },
          phone: { type: 'string', example: '+6281234567890' },
          role: { type: 'string', example: 'ADMIN' },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
        },
      },
    },
  },
};

export const usersListResponseSchema: ApiResponseOptions = {
  status: 200,
  description: 'Daftar pengguna dengan pagination',
  schema: {
    type: 'object',
    properties: {
      success: { type: 'boolean', example: true },
      message: { type: 'string', example: 'Users berhasil diambil' },
      data: {
        type: 'object',
        properties: {
          items: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                id: { type: 'number', example: 1 },
                name: { type: 'string', example: 'Reysa Eka' },
                username: { type: 'string', example: 'reysa_eka' },
                email: { type: 'string', example: 'reysa@example.com' },
                phone: { type: 'string', example: '+6281234567890' },
                role: { type: 'string', example: 'USER' },
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
              total: { type: 'number', example: 25 },
              totalPages: { type: 'number', example: 3 },
            },
          },
        },
      },
    },
  },
};

export const userDeleteResponseSchema: ApiResponseOptions = {
  status: 200,
  description: 'User berhasil dihapus',
  schema: {
    type: 'object',
    properties: {
      success: { type: 'boolean', example: true },
      message: { type: 'string', example: 'User berhasil dihapus' },
      data: {
        type: 'object',
        properties: {
          message: { type: 'string', example: 'User 1 dihapus' },
        },
      },
    },
  },
};
