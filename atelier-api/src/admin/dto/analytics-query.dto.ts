import { z } from 'zod';

const YMD_REGEX = /^\d{4}-\d{2}-\d{2}$/;

function isValidCalendarYmd(ymd: string): boolean {
  if (!YMD_REGEX.test(ymd)) return false;
  const [y, m, d] = ymd.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  return (
    dt.getUTCFullYear() === y &&
    dt.getUTCMonth() === m - 1 &&
    dt.getUTCDate() === d
  );
}

const ymdSchema = z.string().refine(isValidCalendarYmd, {
  message:
    'Format tanggal harus YYYY-MM-DD dan merupakan tanggal kalender yang valid',
});

export const AnalyticsQuerySchema = z
  .object({
    preset: z.enum(['7d', '30d', '1y', 'custom']).default('30d'),
    startDate: ymdSchema.optional(),
    endDate: ymdSchema.optional(),
  })
  .superRefine((data, ctx) => {
    if (data.preset === 'custom') {
      if (!data.startDate) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'startDate wajib diisi saat menggunakan preset custom',
          path: ['startDate'],
        });
      }
      if (!data.endDate) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'endDate wajib diisi saat menggunakan preset custom',
          path: ['endDate'],
        });
      }
    } else {
      if (data.startDate !== undefined) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'startDate hanya boleh diisi saat menggunakan preset custom',
          path: ['startDate'],
        });
      }
      if (data.endDate !== undefined) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'endDate hanya boleh diisi saat menggunakan preset custom',
          path: ['endDate'],
        });
      }
    }

    if (data.startDate && data.endDate) {
      if (data.startDate > data.endDate) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'startDate tidak boleh lebih besar dari endDate',
          path: ['startDate'],
        });
      }

      const [sy, sm, sd] = data.startDate.split('-').map(Number);
      const [ey, em, ed] = data.endDate.split('-').map(Number);
      const diffDays =
        Math.round(
          (Date.UTC(ey, em - 1, ed) - Date.UTC(sy, sm - 1, sd)) /
            (24 * 60 * 60 * 1000),
        ) + 1;

      if (diffDays > 400) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Rentang tanggal maksimum adalah 400 hari',
          path: ['endDate'],
        });
      }
    }
  });

export type AnalyticsQueryDto = z.infer<typeof AnalyticsQuerySchema>;
