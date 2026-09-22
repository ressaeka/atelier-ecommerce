import type {
  ApiBodyOptions,
  ApiQueryOptions,
  ApiResponseOptions,
} from '@nestjs/swagger';

export const createAddressApiBody: ApiBodyOptions = {
  description:
    'Data alamat baru yang akan dibuat. userId diambil otomatis dari user yang terautentikasi.',
  schema: {
    type: 'object',
    required: [
      'label',
      'recipientName',
      'phone',
      'addressLine',
      'city',
      'province',
      'postalCode',
    ],
    properties: {
      label: {
        type: 'string',
        minLength: 1,
        maxLength: 50,
        example: 'Rumah',
        description: 'Label alamat',
      },
      recipientName: {
        type: 'string',
        minLength: 1,
        maxLength: 100,
        example: 'Reysa Eka Saputra',
        description: 'Nama penerima',
      },
      phone: {
        type: 'string',
        example: '081234567890',
        description: 'Nomor telepon penerima',
      },
      addressLine: {
        type: 'string',
        minLength: 10,
        maxLength: 255,
        example: 'Jl. Contoh No. 123, RT 01/RW 02',
        description: 'Detail alamat',
      },
      city: {
        type: 'string',
        minLength: 2,
        maxLength: 100,
        example: 'Bekasi',
        description: 'Kota atau kabupaten',
      },
      province: {
        type: 'string',
        minLength: 2,
        maxLength: 100,
        example: 'Jawa Barat',
        description: 'Provinsi',
      },
      postalCode: {
        type: 'string',
        pattern: '^\\d{5}$',
        example: '17121',
        description: 'Kode pos 5 digit',
      },
      isDefault: {
        type: 'boolean',
        example: false,
        description: 'Menentukan apakah alamat menjadi alamat utama',
      },
    },
  },
};

export const updateAddressApiBody: ApiBodyOptions = {
  description:
    'Data pembaruan alamat (semua field bersifat opsional). Ownership tidak dapat dipindahkan.',
  schema: {
    type: 'object',
    properties: {
      label: {
        type: 'string',
        minLength: 1,
        maxLength: 50,
        example: 'Kantor',
        description: 'Label alamat',
      },
      recipientName: {
        type: 'string',
        minLength: 1,
        maxLength: 100,
        example: 'Reysa Eka Saputra',
        description: 'Nama penerima',
      },
      phone: {
        type: 'string',
        example: '081234567890',
        description: 'Nomor telepon penerima',
      },
      addressLine: {
        type: 'string',
        minLength: 1,
        maxLength: 255,
        example: 'Jl. Contoh No. 456',
        description: 'Detail alamat',
      },
      city: {
        type: 'string',
        minLength: 1,
        maxLength: 100,
        example: 'Jakarta Selatan',
        description: 'Kota atau kabupaten',
      },
      province: {
        type: 'string',
        minLength: 1,
        maxLength: 100,
        example: 'DKI Jakarta',
        description: 'Provinsi',
      },
      postalCode: {
        type: 'string',
        pattern: '^\\d{5}$',
        example: '12345',
        description: 'Kode pos 5 digit',
      },
      isDefault: {
        type: 'boolean',
        example: true,
        description: 'Menentukan apakah alamat menjadi alamat utama',
      },
    },
  },
};

export const queryAddressPage: ApiQueryOptions = {
  name: 'page',
  required: false,
  type: Number,
  example: 1,
  description: 'Nomor halaman (default: 1)',
};

export const queryAddressLimit: ApiQueryOptions = {
  name: 'limit',
  required: false,
  type: Number,
  example: 10,
  description: 'Jumlah data per halaman (default: 10, max: 50)',
};

export const queryAddressSearch: ApiQueryOptions = {
  name: 'search',
  required: false,
  type: String,
  example: 'rumah',
  description:
    'Pencarian berdasarkan label, nama penerima, kota, provinsi, atau kode pos',
};

export const addressResponseSchema: ApiResponseOptions = {
  status: 200,
  description: 'Detail data alamat',
  schema: {
    type: 'object',
    properties: {
      success: {
        type: 'boolean',
        example: true,
      },
      message: {
        type: 'string',
        example: 'Address berhasil diambil',
      },
      data: {
        type: 'object',
        properties: {
          id: {
            type: 'number',
            example: 1,
          },
          userId: {
            type: 'number',
            example: 1,
          },
          label: {
            type: 'string',
            example: 'Rumah',
          },
          recipientName: {
            type: 'string',
            example: 'Reysa Eka Saputra',
          },
          phone: {
            type: 'string',
            example: '081234567890',
          },
          addressLine: {
            type: 'string',
            example: 'Jl. Contoh No. 123, RT 01/RW 02',
          },
          city: {
            type: 'string',
            example: 'Bekasi',
          },
          province: {
            type: 'string',
            example: 'Jawa Barat',
          },
          postalCode: {
            type: 'string',
            example: '17121',
          },
          isDefault: {
            type: 'boolean',
            example: true,
          },
          createdAt: {
            type: 'string',
            format: 'date-time',
          },
          updatedAt: {
            type: 'string',
            format: 'date-time',
          },
        },
      },
    },
  },
};

export const addressesListResponseSchema: ApiResponseOptions = {
  status: 200,
  description: 'Daftar alamat dengan pagination',
  schema: {
    type: 'object',
    properties: {
      success: {
        type: 'boolean',
        example: true,
      },
      message: {
        type: 'string',
        example: 'Address berhasil diambil',
      },
      data: {
        type: 'object',
        properties: {
          items: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                id: {
                  type: 'number',
                  example: 1,
                },
                userId: {
                  type: 'number',
                  example: 1,
                },
                label: {
                  type: 'string',
                  example: 'Rumah',
                },
                recipientName: {
                  type: 'string',
                  example: 'Reysa Eka Saputra',
                },
                phone: {
                  type: 'string',
                  example: '081234567890',
                },
                addressLine: {
                  type: 'string',
                  example: 'Jl. Contoh No. 123, RT 01/RW 02',
                },
                city: {
                  type: 'string',
                  example: 'Bekasi',
                },
                province: {
                  type: 'string',
                  example: 'Jawa Barat',
                },
                postalCode: {
                  type: 'string',
                  example: '17121',
                },
                isDefault: {
                  type: 'boolean',
                  example: false,
                },
                createdAt: {
                  type: 'string',
                  format: 'date-time',
                },
                updatedAt: {
                  type: 'string',
                  format: 'date-time',
                },
              },
            },
          },
          meta: {
            type: 'object',
            properties: {
              page: {
                type: 'number',
                example: 1,
              },
              limit: {
                type: 'number',
                example: 10,
              },
              total: {
                type: 'number',
                example: 25,
              },
              totalPages: {
                type: 'number',
                example: 3,
              },
            },
          },
        },
      },
    },
  },
};
