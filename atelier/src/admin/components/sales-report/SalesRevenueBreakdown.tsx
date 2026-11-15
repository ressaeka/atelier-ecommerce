import { memo } from 'react';
import { CheckCircle2, Info, Receipt } from 'lucide-react';
import { formatPrice } from '../../../lib/utils';
import type { SalesReportRevenueBreakdown } from '../../../types/api';
import { numberFormatter } from './salesReportUtils';

interface SalesRevenueBreakdownProps {
  breakdown: SalesReportRevenueBreakdown;
}

export const SalesRevenueBreakdown = memo(function SalesRevenueBreakdown({
  breakdown,
}: SalesRevenueBreakdownProps) {
  return (
    <section
      aria-labelledby="revenue-breakdown-heading"
      className="rounded-2xl border border-[#ECE7DE] bg-white p-5 shadow-[0_1px_3px_rgba(26,22,18,0.04)] sm:p-6"
    >
      <div className="flex flex-col gap-1 border-b border-[#ECE7DE] pb-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#F4EFE8] text-[#5C4033]">
            <Receipt size={18} strokeWidth={1.8} aria-hidden="true" />
          </span>
          <div>
            <h2
              id="revenue-breakdown-heading"
              className="text-[17px] font-semibold tracking-tight text-[#1A1A1A]"
            >
              Rincian Perhitungan Pendapatan (Revenue Breakdown)
            </h2>
            <p className="text-[12.5px] text-[#6F6A62]">
              Rekonsiliasi transparan antara Total Penjualan, pengurangan, dan
              pendapatan yang diakui pada periode aktif
            </p>
          </div>
        </div>

        <span className="inline-flex items-center gap-1.5 self-start rounded-lg border border-[#ECE7DE] bg-[#FAF8F4] px-3 py-1 text-[11.5px] font-medium text-[#5C4033] sm:self-auto">
          <CheckCircle2 size={13} className="text-[#2F7A4F]" />
          Sumber perhitungan tunggal (API · UI · Excel)
        </span>
      </div>

      {/* 4 Breakdown Columns */}
      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {/* 1. Total Penjualan */}
        <div className="rounded-xl border border-[#ECE7DE] bg-[#FAF8F4] p-4">
          <div className="flex items-center justify-between">
            <span className="text-[12px] font-semibold text-[#3F3B36]">
              1. Total Penjualan
            </span>
            <span className="rounded bg-white px-2 py-0.5 text-[10.5px] font-medium text-[#6F6A62]">
              Penjualan + Ongkir
            </span>
          </div>
          <p className="mt-2 text-[21px] font-bold tabular-nums text-[#1A1A1A]">
            {formatPrice(breakdown.grossRevenue)}
          </p>
          <p className="mt-1.5 text-[11.5px] leading-relaxed text-[#6F6A62]">
            Produk: {formatPrice(breakdown.grossProductSales)} · Ongkir:{' '}
            {formatPrice(breakdown.shippingRevenue)}
          </p>
        </div>

        {/* 2. Diskon */}
        <div className="rounded-xl border border-[#ECE7DE] bg-[#FAF8F4] p-4">
          <div className="flex items-center justify-between">
            <span className="text-[12px] font-semibold text-[#3F3B36]">
              2. Potongan Diskon
            </span>
            <span className="rounded bg-white px-2 py-0.5 text-[10.5px] font-medium text-[#6F6A62]">
              Pengurang
            </span>
          </div>
          <p className="mt-2 text-[21px] font-bold tabular-nums text-[#3F3B36]">
            - {formatPrice(breakdown.discountTotal)}
          </p>
          <p className="mt-1.5 text-[11.5px] leading-relaxed text-[#6F6A62]">
            Belum ada skema diskon/voucher pada pesanan saat ini (Rp 0).
          </p>
        </div>

        {/* 3. Refund */}
        <div className="rounded-xl border border-[#ECE7DE] bg-[#FAF8F4] p-4">
          <div className="flex items-center justify-between">
            <span className="text-[12px] font-semibold text-[#3F3B36]">
              3. Refund (Penuh / Parsial)
            </span>
            <span className="rounded bg-white px-2 py-0.5 text-[10.5px] font-medium text-[#6F6A62]">
              Pengurang
            </span>
          </div>
          <p className="mt-2 text-[21px] font-bold tabular-nums text-[#3F3B36]">
            - {formatPrice(breakdown.refundTotal)}
          </p>
          <p className="mt-1.5 text-[11.5px] leading-relaxed text-[#6F6A62]">
            Belum ada skema refund pada transaksi saat ini (Rp 0).
          </p>
        </div>

        {/* 4. Pendapatan Setelah Pengurangan */}
        <div className="rounded-xl border-2 border-[#5C4033]/25 bg-[#F4EFE8]/70 p-4">
          <div className="flex items-center justify-between">
            <span className="text-[12px] font-bold text-[#5C4033]">
              4. Pendapatan Setelah Pengurangan
            </span>
            <span className="rounded bg-[#E7F3EC] px-2 py-0.5 text-[10.5px] font-semibold text-[#2F7A4F]">
              Diakui
            </span>
          </div>
          <p className="mt-2 text-[21px] font-bold tabular-nums text-[#2F7A4F]">
            {formatPrice(breakdown.netRevenue)}
          </p>
          <p className="mt-1.5 text-[11.5px] leading-relaxed text-[#3F3B36]">
            Total Penjualan dikurangi Diskon & Refund.{' '}
            <strong>Bukan laba bersih</strong> (belum dikurangi HPP & biaya
            operasional).
          </p>
        </div>
      </div>

      {/* Excluded Transactions & Audit Note */}
      <div className="mt-4 flex flex-col gap-3 rounded-xl border border-[#ECE7DE] bg-[#FAF8F4] p-3.5 text-[12px] text-[#3F3B36] lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-start gap-2">
          <Info
            size={15}
            className="mt-0.5 shrink-0 text-[#5C4033]"
            aria-hidden="true"
          />
          <span>
            <strong>Catatan Akuntansi:</strong> Pesanan berstatus{' '}
            <strong>Dibatalkan / Kedaluwarsa</strong> (
            {numberFormatter.format(breakdown.excludedCancelledCount)} pesanan ·{' '}
            {formatPrice(breakdown.excludedCancelledAmount)}) dan{' '}
            <strong>Menunggu Pembayaran</strong> (
            {numberFormatter.format(breakdown.excludedPendingCount)} pesanan ·{' '}
            {formatPrice(breakdown.excludedPendingAmount)}) tidak diakui sebagai
            pendapatan toko (Rp 0).
          </span>
        </div>
      </div>
    </section>
  );
});
