import type { ApiBodyOptions, ApiResponseOptions } from '@nestjs/swagger';

export const addCartItemApiBody: ApiBodyOptions = {
  description: 'Data item yang akan ditambahkan ke cart',
  schema: {
    type: 'object',
    required: ['productId', 'quantity'],
    properties: {
      productId: {
        type: 'integer',
        minimum: 1,
        example: 1,
        description: 'ID produk yang akan ditambahkan',
      },
      quantity: {
        type: 'integer',
        minimum: 1,
        example: 1,
        description: 'Jumlah item yang akan ditambahkan',
      },
    },
  },
};

export const updateCartItemApiBody: ApiBodyOptions = {
  description: 'Data pembaruan quantity item di cart',
  schema: {
    type: 'object',
    required: ['quantity'],
    properties: {
      quantity: {
        type: 'integer',
        minimum: 1,
        example: 2,
        description: 'Jumlah quantity baru',
      },
    },
  },
};

const cartItemSchema = {
  type: 'object',
  properties: {
    id: { type: 'number', example: 1 },
    cartId: { type: 'number', example: 1 },
    productId: { type: 'number', example: 1 },
    quantity: { type: 'number', example: 2 },
    createdAt: { type: 'string', format: 'date-time' },
    updatedAt: { type: 'string', format: 'date-time' },
  },
};

export const cartResponseSchema: ApiResponseOptions = {
  status: 200,
  description: 'Detail cart milik user',
  schema: {
    type: 'object',
    properties: {
      success: { type: 'boolean', example: true },
      message: { type: 'string', example: 'Cart berhasil diambil' },
      data: {
        type: 'object',
        properties: {
          id: { type: 'number', example: 1 },
          userId: { type: 'number', example: 1 },
          items: {
            type: 'array',
            items: cartItemSchema,
          },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
        },
      },
    },
  },
};

export const cartItemResponseSchema: ApiResponseOptions = {
  status: 200,
  description: 'Detail item di cart',
  schema: {
    type: 'object',
    properties: {
      success: { type: 'boolean', example: true },
      message: { type: 'string', example: 'Item berhasil ditambahkan ke cart' },
      data: cartItemSchema,
    },
  },
};

export const cartItemCreatedResponseSchema: ApiResponseOptions = {
  status: 201,
  description: 'Item berhasil ditambahkan ke cart',
  schema: {
    type: 'object',
    properties: {
      success: { type: 'boolean', example: true },
      message: { type: 'string', example: 'Item berhasil ditambahkan ke cart' },
      data: cartItemSchema,
    },
  },
};

export const cartMessageResponseSchema: ApiResponseOptions = {
  status: 200,
  description: 'Operasi berhasil',
  schema: {
    type: 'object',
    properties: {
      success: { type: 'boolean', example: true },
      message: {
        type: 'string',
        example: 'Product berhasil dihapus dari cart',
      },
      data: {
        type: 'object',
        properties: {
          message: {
            type: 'string',
            example: 'Product berhasil dihapus dari cart',
          },
        },
      },
    },
  },
};
