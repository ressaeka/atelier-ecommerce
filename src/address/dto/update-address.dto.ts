import { z } from 'zod';

export const updateAddressSchema = z
  .object({
    label: z
      .string()
      .trim()
      .min(1, 'Label tidak boleh kosong')
      .max(50, 'Label maksimal 50 karakter')
      .optional(),

    recipientName: z
      .string()
      .trim()
      .min(1, 'Nama penerima tidak boleh kosong')
      .max(100, 'Nama penerima maksimal 100 karakter')
      .optional(),

    phone: z
      .string()
      .trim()
      .regex(/^(?:\+62|62|0)8[1-9][0-9]{7,11}$/, 'Nomor telepon tidak valid')
      .optional(),

    addressLine: z
      .string()
      .trim()
      .min(1, 'Alamat tidak boleh kosong')
      .max(255, 'Alamat maksimal 255 karakter')
      .optional(),

    city: z
      .string()
      .trim()
      .min(1, 'Kota tidak boleh kosong')
      .max(100, 'Kota maksimal 100 karakter')
      .optional(),

    province: z
      .string()
      .trim()
      .min(1, 'Provinsi tidak boleh kosong')
      .max(100, 'Provinsi maksimal 100 karakter')
      .optional(),

    postalCode: z
      .string()
      .trim()
      .regex(/^\d{5}$/, 'Kode pos harus 5 digit angka')
      .optional(),

    isDefault: z.boolean().optional(),
  })
  .strict();

export type UpdateAddressDto = z.infer<typeof updateAddressSchema>;
