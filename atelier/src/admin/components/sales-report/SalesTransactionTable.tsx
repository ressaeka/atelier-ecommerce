import { memo } from 'react';
import { ArrowUpDown, Calendar, RefreshCw, Search } from 'lucide-react';
import { formatPrice } from '../../../lib/utils';
import type {
  PaginationMeta,
  SalesReportSortBy,
  SalesReportTransaction,
} from '../../../types/api';
import { ADMIN_ORDER_STATUS_META } from '../AdminOrdersTable';
import { SalesReportPagination } from './SalesReportPagination';
import {
  formatFullIndonesianDateTime,
  numberFormatter,
} from './salesReportUtils';

interface SalesTransactionRowProps {
  tx: SalesReportTransaction;
}

const SalesTransactionRow = memo(function SalesTransactionRow({
  tx,
}: SalesTransactionRowProps) {
  const statusMeta =
    ADMIN_ORDER_STATUS_META[tx.status] ?? ADMIN_ORDER_STATUS_META.PENDING;
  const grossAmount = tx.grossAmount ?? tx.total;
  const discountVal = tx.discount ?? 0;
  const refundVal = tx.refund ?? 0;
  const recognizedVal = tx.recognizedRevenue ?? (tx.isRevenue ? tx.total : 0);
  const displayCustomer = tx.customerName || tx.recipientName;

  return (
    <tr className="transition-colors hover:bg-[#FAF8F4]/70">
      <td className="whitespace-nowrap px-4 py-3.5 text-[12.5px] tabular-nums text-[#3F3B36]">
        {formatFullIndonesianDateTime(tx.createdAt)}
      </td>
      <td className="px-3 py-3.5">
        <span className="text-[13px] font-bold tabular-nums text-[#5C4033]">
          {tx.orderNumber}
        </span>
        <div className="mt-0.5 break-words text-[11.5px] leading-4 text-[#6F6A62]">
          {tx.itemsCount} unit ·{' '}
          {tx.items
            .slice(0, 2)
            .map((it) => `${it.productName} (x${it.quantity})`)
            .join(', ')}
          {tx.items.length > 2 ? ` +${tx.items.length - 2} lainnya` : ''}
        </div>
      </td>
      <td className="px-3 py-3.5">
        <p className="break-words text-[13px] font-semibold text-[#1A1A1A]">
          {displayCustomer}
        </p>
        <p className="mt-0.5 break-words text-[11.5px] leading-4 text-[#6F6A62]">
          {[tx.city, tx.province].filter(Boolean).join(', ') || '—'}
        </p>
      </td>
      <td className="whitespace-nowrap px-4 py-3.5 text-right text-[13px] font-medium tabular-nums text-[#3F3B36]">
        {formatPrice(grossAmount)}
      </td>
      <td className="whitespace-nowrap px-4 py-3.5 text-right text-[12.5px] tabular-nums text-[#6F6A62]">
        {formatPrice(discountVal)}
      </td>
      <td className="whitespace-nowrap px-4 py-3.5 text-right text-[12.5px] tabular-nums text-[#6F6A62]">
        {formatPrice(refundVal)}
      </td>
      <td className="whitespace-nowrap px-4 py-3.5 text-right">
        <span
          className={`text-[13px] font-bold tabular-nums ${
            tx.isRevenue
              ? 'text-[#2F7A4F]'
              : 'text-[#A39D93] line-through decoration-[#A39D93]/50'
          }`}
        >
          {formatPrice(recognizedVal)}
        </span>
        {!tx.isRevenue && (
          <span className="block text-[10.5px] font-medium text-[#6F6A62]">
            Tidak diakui
          </span>
        )}
      </td>
      <td className="whitespace-nowrap px-4 py-3.5 text-center">
        <span
          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11.5px] font-semibold ${statusMeta.className}`}
        >
          <span
            className={`h-1.5 w-1.5 rounded-full ${statusMeta.dotClassName}`}
          />
          {statusMeta.label}
        </span>
      </td>
    </tr>
  );
});

const SalesTransactionMobileCard = memo(function SalesTransactionMobileCard({
  tx,
}: SalesTransactionRowProps) {
  const statusMeta =
    ADMIN_ORDER_STATUS_META[tx.status] ?? ADMIN_ORDER_STATUS_META.PENDING;
  const grossAmount = tx.grossAmount ?? tx.total;
  const discountVal = tx.discount ?? 0;
  const refundVal = tx.refund ?? 0;
  const recognizedVal = tx.recognizedRevenue ?? (tx.isRevenue ? tx.total : 0);
  const displayCustomer = tx.customerName || tx.recipientName;

  return (
    <article className="space-y-2.5 p-4">
      <div className="flex items-start justify-between gap-2">
        <div>
          <span className="text-[13.5px] font-bold tabular-nums text-[#5C4033]">
            {tx.orderNumber}
          </span>
          <p className="text-[11.5px] tabular-nums text-[#6F6A62]">
            {formatFullIndonesianDateTime(tx.createdAt)}
          </p>
        </div>
        <span
          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold ${statusMeta.className}`}
        >
          <span
            className={`h-1.5 w-1.5 rounded-full ${statusMeta.dotClassName}`}
          />
          {statusMeta.label}
        </span>
      </div>

      <div>
        <p className="text-[13px] font-semibold text-[#1A1A1A]">
          {displayCustomer}
        </p>
        <p className="text-[11.5px] text-[#6F6A62]">
          {tx.itemsCount} unit ·{' '}
          {tx.items
            .map((it) => `${it.productName} (x${it.quantity})`)
            .join(', ')}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-2 rounded-xl border border-[#ECE7DE] bg-[#FAF8F4] p-2.5 text-[11.5px]">
        <div>
          <span className="text-[#6F6A62]">Nilai Transaksi:</span>
          <p className="font-semibold tabular-nums text-[#1A1A1A]">
            {formatPrice(grossAmount)}
          </p>
        </div>
        <div>
          <span className="text-[#6F6A62]">Diskon / Refund:</span>
          <p className="font-medium tabular-nums text-[#6F6A62]">
            {formatPrice(discountVal)} / {formatPrice(refundVal)}
          </p>
        </div>
        <div className="col-span-2 flex items-center justify-between border-t border-[#ECE7DE] pt-2">
          <span className="font-semibold text-[#3F3B36]">
            Pendapatan Diakui:
          </span>
          <span
            className={`text-[13px] font-bold tabular-nums ${
              tx.isRevenue ? 'text-[#2F7A4F]' : 'text-[#6F6A62]'
            }`}
          >
            {formatPrice(recognizedVal)}
          </span>
        </div>
      </div>
    </article>
  );
});

interface SalesTransactionTableProps {
  transactions: SalesReportTransaction[];
  meta: PaginationMeta;
  page: number;
  totalRevenue: number;
  isInitialLoading: boolean;
  isFetching: boolean;
  search: string;
  onSearchChange: (value: string) => void;
  onSortChange: (field: SalesReportSortBy) => void;
  onPageChange: (page: number) => void;
}

export const SalesTransactionTable = memo(function SalesTransactionTable({
  transactions,
  meta,
  page,
  totalRevenue,
  isInitialLoading,
  isFetching,
  search,
  onSearchChange,
  onSortChange,
  onPageChange,
}: SalesTransactionTableProps) {
  return (
    <section
      aria-labelledby="transaction-details-heading"
      className="overflow-hidden rounded-2xl border border-[#ECE7DE] bg-white shadow-[0_1px_3px_rgba(26,22,18,0.04)]"
    >
      <div className="flex flex-col gap-3 border-b border-[#ECE7DE] px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div>
          <h2
            id="transaction-details-heading"
            className="text-[17px] font-semibold tracking-tight text-[#1A1A1A]"
          >
            Rincian Transaksi Periode Ini
          </h2>
          <p className="mt-0.5 text-[12.5px] text-[#6F6A62]">
            Menampilkan {transactions.length} dari{' '}
            {numberFormatter.format(meta.total)} transaksi · Transaksi batal
            atau belum dibayar bernilai Rp 0 pada kolom Pendapatan Diakui
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 sm:justify-end">
          <div className="relative w-full sm:w-[240px]">
            <Search
              size={14}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#8B7F79]"
              aria-hidden="true"
            />
            <input
              type="search"
              value={search}
              onChange={(event) => onSearchChange(event.target.value)}
              placeholder="Cari pelanggan atau pesanan"
              aria-label="Cari pelanggan atau pesanan"
              className="h-10 w-full rounded-[10px] border border-[#ECE6E0] bg-white pl-9 pr-3 text-[13px] text-[#2A201D] placeholder:text-[#8B7F79] focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[#5B3F36]"
            />
          </div>
          {isFetching && !isInitialLoading && (
            <span className="inline-flex items-center gap-1.5 rounded-lg border border-[#ECE7DE] bg-[#FAF8F4] px-2.5 py-1 text-[11px] font-medium text-[#5C4033]">
              <RefreshCw
                size={11}
                className="animate-spin"
                aria-hidden="true"
              />
              <span>Memperbarui…</span>
            </span>
          )}
          <span className="rounded-lg border border-[#ECE7DE] bg-[#FAF8F4] px-3 py-1 text-[11.5px] font-medium text-[#6F6A62]">
            Halaman {page} dari {Math.max(meta.totalPages, 1)}
          </span>
        </div>
      </div>

      {/* Initial Loading State (ONLY when no data has ever been loaded yet) */}
      {isInitialLoading && transactions.length === 0 && (
        <div className="flex min-h-[260px] items-center justify-center p-8">
          <div className="flex items-center gap-2.5 text-[13px] font-medium text-[#6F6A62]">
            <RefreshCw size={16} className="animate-spin text-[#5C4033]" />
            <span>Memuat rincian transaksi laporan…</span>
          </div>
        </div>
      )}

      {/* Empty State */}
      {!isInitialLoading && transactions.length === 0 && (
        <div className="flex min-h-[260px] flex-col items-center justify-center px-6 py-12 text-center">
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-[#F4EFE8] text-[#5C4033]">
            <Calendar size={20} strokeWidth={1.7} aria-hidden="true" />
          </div>
          <p className="text-[15px] font-semibold text-[#1A1A1A]">
            Tidak Ada Transaksi pada Periode Ini
          </p>
          <p className="mt-1.5 max-w-md text-[12.5px] leading-relaxed text-[#6F6A62]">
            Tidak ditemukan transaksi yang cocok dengan filter periode, status,
            atau kata kunci pencarian. Silakan ubah periode atau reset filter.
          </p>
        </div>
      )}

      {/* Desktop & Tablet Table (md and up) */}
      {transactions.length > 0 && (
        <div
          className={`hidden overflow-x-auto transition-opacity duration-150 md:block ${
            isFetching && !isInitialLoading ? 'opacity-80' : 'opacity-100'
          }`}
        >
          <table className="w-full min-w-[1060px] table-fixed border-collapse text-left">
            <colgroup>
              <col className="w-[145px]" />
              <col className="w-[190px]" />
              <col className="w-[150px]" />
              <col className="w-[135px]" />
              <col className="w-[85px]" />
              <col className="w-[85px]" />
              <col className="w-[150px]" />
              <col className="w-[120px]" />
            </colgroup>
            <thead>
              <tr className="border-b border-[#ECE7DE] bg-[#FAF8F4]">
                <th className="whitespace-nowrap px-4 py-3 text-[12.5px] font-medium text-[#6F6A62]">
                  <button
                    type="button"
                    onClick={() => onSortChange('createdAt')}
                    className="inline-flex items-center gap-1 hover:text-[#1A1A1A]"
                  >
                    <span>Tanggal Transaksi</span>
                    <ArrowUpDown size={12} aria-hidden="true" />
                  </button>
                </th>
                <th className="whitespace-nowrap px-4 py-3 text-[12.5px] font-medium text-[#6F6A62]">
                  Nomor Pesanan
                </th>
                <th className="whitespace-nowrap px-4 py-3 text-[12.5px] font-medium text-[#6F6A62]">
                  Nama Pelanggan
                </th>
                <th className="whitespace-nowrap px-4 py-3 text-right text-[12.5px] font-medium text-[#6F6A62]">
                  <button
                    type="button"
                    onClick={() => onSortChange('total')}
                    className="inline-flex items-center justify-end gap-1 hover:text-[#1A1A1A]"
                  >
                    <span>Nilai Transaksi</span>
                    <ArrowUpDown size={12} aria-hidden="true" />
                  </button>
                </th>
                <th className="whitespace-nowrap px-4 py-3 text-right text-[12.5px] font-medium text-[#6F6A62]">
                  Diskon
                </th>
                <th className="whitespace-nowrap px-4 py-3 text-right text-[12.5px] font-medium text-[#6F6A62]">
                  Refund
                </th>
                <th className="whitespace-nowrap px-4 py-3 text-right text-[12.5px] font-medium text-[#6F6A62]">
                  <button
                    type="button"
                    onClick={() => onSortChange('recognizedRevenue')}
                    className="inline-flex items-center justify-end gap-1 hover:text-[#1A1A1A]"
                  >
                    <span>Pendapatan Diakui</span>
                    <ArrowUpDown size={12} aria-hidden="true" />
                  </button>
                </th>
                <th className="whitespace-nowrap px-4 py-3 text-center text-[12.5px] font-medium text-[#6F6A62]">
                  <button
                    type="button"
                    onClick={() => onSortChange('status')}
                    className="inline-flex items-center justify-center gap-1 hover:text-[#1A1A1A]"
                  >
                    <span>Status Transaksi</span>
                    <ArrowUpDown size={12} aria-hidden="true" />
                  </button>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#ECE7DE]">
              {transactions.map((tx) => (
                <SalesTransactionRow key={tx.id} tx={tx} />
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Mobile Dedicated Card Layout (< 768px) */}
      {transactions.length > 0 && (
        <div
          className={`divide-y divide-[#ECE7DE] transition-opacity duration-150 md:hidden ${
            isFetching && !isInitialLoading ? 'opacity-80' : 'opacity-100'
          }`}
        >
          {transactions.map((tx) => (
            <SalesTransactionMobileCard key={tx.id} tx={tx} />
          ))}
        </div>
      )}

      {/* Footer Reconciliation & Pagination */}
      {transactions.length > 0 && (
        <SalesReportPagination
          displayedCount={transactions.length}
          totalCount={meta.total}
          page={page}
          totalPages={meta.totalPages}
          totalRevenue={totalRevenue}
          isInitialLoading={isInitialLoading}
          onPageChange={onPageChange}
        />
      )}
    </section>
  );
});
