import { z } from 'zod';

export const loginSchema = z.object({
  identifier: z
    .string('Email, username, atau nomor telepon wajib diisi')
    .trim()
    .min(1, 'Email, username, atau nomor telepon wajib diisi'),

  username: z
    .string('Username wajib diisi')
    .trim()
    .min(1, 'Username wajib diisi'),

  password: z.string('Password wajib diisi').min(1, 'Password wajib diisi'),
});

export type LoginDto = z.infer<typeof loginSchema>;
