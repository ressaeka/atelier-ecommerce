import { z } from 'zod';

export const registerSchema = z.object({
  name: z
    .string()
    .trim()
    .min(3, 'Nama minimal 3 karakter')
    .max(100, 'Nama maksimal 100 karakter'),

  username: z
    .string()
    .trim()
    .min(3, 'Username minimal 3 karakter')
    .max(50, 'Username maksimal 50 karakter')
    .regex(
      /^[a-zA-Z0-9_]+$/,
      'Username hanya boleh huruf, angka, dan underscore',
    ),

  email: z
    .email('Email tidak valid')
    .trim()
    .toLowerCase()
    .max(255, 'Email maksimal 255 karakter'),

  phone: z
    .string()
    .trim()
    .regex(/^(?:\+62|62|0)8[1-9][0-9]{7,11}$/, 'Nomor telepon tidak valid'),

  password: z.string().min(8, 'Password minimal 8 karakter'),
});

export type RegisterDto = z.infer<typeof registerSchema>;
