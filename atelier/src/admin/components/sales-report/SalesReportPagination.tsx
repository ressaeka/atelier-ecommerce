import { memo } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { formatPrice } from '../../../lib/utils';
import { numberFormatter } from './salesReportUtils';

interface SalesReportPaginationProps {
  displayedCount: number;
  totalCount: number;
  page: number;
  totalPages: number;
  totalRevenue: number;
  isInitialLoading: boolean;
  onPageChange: (page: number) => void;
}

export const SalesReportPagination = memo(function SalesReportPagination({
  displayedCount,
  totalCount,
  page,
  totalPages,
  totalRevenue,
  isInitialLoading,
  onPageChange,
}: SalesReportPaginationProps) {
  const safeTotalPages = Math.max(totalPages, 1);

  return (
    <div className="flex flex-col gap-3 border-t border-[#ECE7DE] bg-[#FAF8F4] px-5 py-3.5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
      <div className="text-[12px] text-[#3F3B36]">
        <span>
          Menampilkan <strong>{displayedCount}</strong> dari{' '}
          <strong>{numberFormatter.format(totalCount)}</strong> transaksi
        </span>
        <span className="mx-2 text-[#D6CFC2]">|</span>
        <span>
          Total Pendapatan Diakui Periode Ini:{' '}
          <strong className="font-bold tabular-nums text-[#2F7A4F]">
            {formatPrice(totalRevenue)}
          </strong>
        </span>
      </div>

      <div className="flex items-center gap-1.5">
        <button
          type="button"
          onClick={() => onPageChange(Math.max(page - 1, 1))}
          disabled={page <= 1 || isInitialLoading}
          className="inline-flex h-8 items-center gap-1 rounded-lg border border-[#ECE7DE] bg-white px-2.5 text-[12px] font-medium text-[#3F3B36] transition-colors hover:bg-[#F4EFE8] disabled:cursor-not-allowed disabled:opacity-40"
        >
          <ChevronLeft size={14} aria-hidden="true" />
          <span>Sebelumnya</span>
        </button>

        <span className="px-2 text-[12px] font-semibold tabular-nums text-[#1A1A1A]">
          {page} / {safeTotalPages}
        </span>

        <button
          type="button"
          onClick={() => onPageChange(Math.min(page + 1, safeTotalPages))}
          disabled={page >= safeTotalPages || isInitialLoading}
          className="inline-flex h-8 items-center gap-1 rounded-lg border border-[#ECE7DE] bg-white px-2.5 text-[12px] font-medium text-[#3F3B36] transition-colors hover:bg-[#F4EFE8] disabled:cursor-not-allowed disabled:opacity-40"
        >
          <span>Berikutnya</span>
          <ChevronRight size={14} aria-hidden="true" />
        </button>
      </div>
    </div>
  );
});
