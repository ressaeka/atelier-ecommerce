import type { ApiBodyOptions, ApiResponseOptions } from '@nestjs/swagger';

export const registerApiBody: ApiBodyOptions = {
  description: 'Data pendaftaran user baru',

  schema: {
    type: 'object',

    required: ['name', 'username', 'email', 'phone', 'password'],

    properties: {
      name: {
        type: 'string',
        minLength: 3,
        maxLength: 100,
        example: 'Reysa Eka',
      },

      username: {
        type: 'string',
        minLength: 3,
        maxLength: 50,
        example: 'reysa_eka',
        description: 'Hanya boleh huruf, angka, dan underscore',
      },

      email: {
        type: 'string',
        format: 'email',
        example: 'reysa@example.com',
      },

      phone: {
        type: 'string',
        example: '+6281234567890',
        description: 'Nomor telepon Indonesia',
      },

      password: {
        type: 'string',
        format: 'password',
        minLength: 8,
        example: 'Password123!',
      },
    },
  },
};

export const loginApiBody: ApiBodyOptions = {
  description:
    'Kredensial login menggunakan username, email, atau nomor telepon',

  schema: {
    type: 'object',

    required: ['identifier', 'password'],

    properties: {
      identifier: {
        type: 'string',
        example: 'reysa_eka',
        description: 'Username, email, atau nomor telepon',
      },

      password: {
        type: 'string',
        format: 'password',
        example: 'Password123!',
      },
    },
  },
};

export const refreshTokenApiBody: ApiBodyOptions = {
  description: 'Refresh token untuk memperbarui access token',

  schema: {
    type: 'object',

    required: ['refreshToken'],

    properties: {
      refreshToken: {
        type: 'string',
        example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
      },
    },
  },
};

export const forgotPasswordApiBody: ApiBodyOptions = {
  description: 'Email akun untuk permintaan reset password OTP',

  schema: {
    type: 'object',

    required: ['email'],

    properties: {
      email: {
        type: 'string',
        format: 'email',
        example: 'reysa@example.com',
      },
    },
  },
};

export const verifyOtpApiBody: ApiBodyOptions = {
  description: 'Verifikasi kode OTP 6-digit yang dikirim ke email',

  schema: {
    type: 'object',

    required: ['email', 'otp'],

    properties: {
      email: {
        type: 'string',
        format: 'email',
        example: 'reysa@example.com',
      },

      otp: {
        type: 'string',
        minLength: 6,
        maxLength: 6,
        example: '123456',
      },
    },
  },
};

export const resetPasswordApiBody: ApiBodyOptions = {
  description: 'Reset password menggunakan reset token hasil verifikasi OTP',

  schema: {
    type: 'object',

    required: ['resetToken', 'newPassword'],

    properties: {
      resetToken: {
        type: 'string',
        example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
      },

      newPassword: {
        type: 'string',
        format: 'password',
        minLength: 8,
        example: 'NewPassword123!',
      },
    },
  },
};

export const logoutApiBody: ApiBodyOptions = {
  description: 'Refresh token yang digunakan untuk logout',

  schema: {
    type: 'object',

    required: ['refreshToken'],

    properties: {
      refreshToken: {
        type: 'string',
        example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
      },
    },
  },
};

export const authSuccessResponse: ApiResponseOptions = {
  status: 200,
  description: 'Autentikasi berhasil',
  schema: {
    type: 'object',
    properties: {
      success: { type: 'boolean', example: true },
      message: { type: 'string', example: 'Login berhasil' },
      data: {
        type: 'object',
        properties: {
          user: {
            type: 'object',
            properties: {
              id: { type: 'number', example: 1 },
              name: { type: 'string', example: 'Reysa Eka' },
              username: { type: 'string', example: 'reysa_eka' },
              email: { type: 'string', example: 'reysa@example.com' },
              phone: { type: 'string', example: '+6281234567890' },
              role: { type: 'string', example: 'USER' },
            },
          },
          access_token: {
            type: 'string',
            example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
          },
          refresh_token: {
            type: 'string',
            example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
          },
        },
      },
    },
  },
};

export const registerResponseSchema: ApiResponseOptions = {
  status: 201,
  description: 'User berhasil didaftarkan',
  schema: {
    type: 'object',
    properties: {
      success: { type: 'boolean', example: true },
      message: { type: 'string', example: 'User berhasil didaftarkan' },
      data: {
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
  },
};

export const refreshTokenResponseSchema: ApiResponseOptions = {
  status: 200,
  description: 'Token berhasil diperbarui',
  schema: {
    type: 'object',
    properties: {
      success: { type: 'boolean', example: true },
      message: { type: 'string', example: 'Token berhasil diperbarui' },
      data: {
        type: 'object',
        properties: {
          access_token: {
            type: 'string',
            example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
          },
          refresh_token: {
            type: 'string',
            example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
          },
        },
      },
    },
  },
};

export const verifyOtpResponseSchema: ApiResponseOptions = {
  status: 200,
  description: 'OTP berhasil diverifikasi',
  schema: {
    type: 'object',
    properties: {
      success: { type: 'boolean', example: true },
      message: { type: 'string', example: 'OTP berhasil diverifikasi' },
      data: {
        type: 'object',
        properties: {
          resetToken: {
            type: 'string',
            example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
          },
        },
      },
    },
  },
};

export const generalMessageResponseSchema: ApiResponseOptions = {
  status: 200,
  description: 'Operasi berhasil diproses',
  schema: {
    type: 'object',
    properties: {
      success: { type: 'boolean', example: true },
      message: { type: 'string', example: 'Operasi berhasil' },
      data: { type: 'null', example: null },
    },
  },
};
