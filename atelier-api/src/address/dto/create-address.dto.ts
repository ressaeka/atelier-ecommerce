import { z } from 'zod';

export const addressSchema = z
  .object({
    label: z
      .string()
      .trim()
      .min(1, 'Label harus diisi')
      .max(50, 'Label maksimal 50 karakter'),

    recipientName: z
      .string()
      .trim()
      .min(1, 'Nama penerima harus diisi')
      .max(100, 'Nama penerima maksimal 100 karakter'),

    phone: z
      .string()
      .trim()
      .regex(/^(?:\+62|62|0)8[1-9][0-9]{7,11}$/, 'Nomor telepon tidak valid'),

    addressLine: z
      .string()
      .trim()
      .min(10, 'Alamat minimal 10 karakter')
      .max(255, 'Alamat maksimal 255 karakter'),

    city: z
      .string()
      .trim()
      .min(2, 'Kota minimal 2 karakter')
      .max(100, 'Kota maksimal 100 karakter'),

    province: z
      .string()
      .trim()
      .min(2, 'Provinsi minimal 2 karakter')
      .max(100, 'Provinsi maksimal 100 karakter'),

    postalCode: z
      .string()
      .trim()
      .regex(/^\d{5}$/, 'Kode pos harus 5 digit'),

    isDefault: z.boolean().optional().default(false),
  })
  .strict();

export type AddressDto = z.infer<typeof addressSchema>;
