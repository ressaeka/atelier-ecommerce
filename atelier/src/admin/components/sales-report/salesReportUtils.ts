import type { SalesReportPeriodType } from '../../../types/api';

export const PERIOD_MODES: Array<{ id: SalesReportPeriodType; label: string }> =
  [
    { id: 'today', label: 'Hari Ini' },
    { id: 'monthly', label: 'Bulanan' },
    { id: 'yearly', label: 'Tahunan' },
    { id: 'custom', label: 'Custom' },
  ];

export const MONTH_OPTIONS = [
  { value: 1, label: 'Januari' },
  { value: 2, label: 'Februari' },
  { value: 3, label: 'Maret' },
  { value: 4, label: 'April' },
  { value: 5, label: 'Mei' },
  { value: 6, label: 'Juni' },
  { value: 7, label: 'Juli' },
  { value: 8, label: 'Agustus' },
  { value: 9, label: 'September' },
  { value: 10, label: 'Oktober' },
  { value: 11, label: 'November' },
  { value: 12, label: 'Desember' },
];

export const YEAR_OPTIONS = [2024, 2025, 2026];

export const STATUS_OPTIONS: Array<{ value: string; label: string }> = [
  { value: 'ALL', label: 'Semua Status' },
  { value: 'PAID', label: 'Dibayar' },
  { value: 'PROCESSING', label: 'Diproses' },
  { value: 'SHIPPED', label: 'Dikirim' },
  { value: 'DELIVERED', label: 'Selesai' },
  { value: 'PENDING', label: 'Menunggu Pembayaran' },
  { value: 'CANCELLED', label: 'Dibatalkan' },
  { value: 'EXPIRED', label: 'Kedaluwarsa' },
];

export const numberFormatter = new Intl.NumberFormat('id-ID');
export const pctFormatter = new Intl.NumberFormat('id-ID', {
  maximumFractionDigits: 1,
});

export function formatFullIndonesianDateTime(isoString: string): string {
  try {
    return new Date(isoString).toLocaleString('id-ID', {
      timeZone: 'Asia/Jakarta',
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return isoString;
  }
}

export function formatCompactRp(value: number): string {
  if (value >= 1_000_000_000) {
    return `Rp ${(value / 1_000_000_000).toFixed(1).replace('.', ',')} M`;
  }
  if (value >= 1_000_000) {
    const jt = value / 1_000_000;
    return `Rp ${(value % 1_000_000 === 0 ? jt.toFixed(0) : jt.toFixed(1)).replace('.', ',')} jt`;
  }
  if (value >= 1_000) {
    return `Rp ${Math.round(value / 1_000)} rb`;
  }
  return `Rp ${value}`;
}
