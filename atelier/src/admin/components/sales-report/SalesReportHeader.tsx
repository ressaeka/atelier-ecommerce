import { memo } from 'react';
import { Link } from 'react-router-dom';
import { Download, FileSpreadsheet, RefreshCw } from 'lucide-react';

interface SalesReportHeaderProps {
  lastUpdatedWib: string;
  isLoading: boolean;
  isFetching: boolean;
  isExportingExcel: boolean;
  hasTransactions: boolean;
  hasError: boolean;
  onRefetch: () => void;
  onExportCsv: () => void;
  onExportExcel: () => void;
}

export const SalesReportHeader = memo(function SalesReportHeader({
  lastUpdatedWib,
  isLoading,
  isFetching,
  isExportingExcel,
  hasTransactions,
  hasError,
  onRefetch,
  onExportCsv,
  onExportExcel,
}: SalesReportHeaderProps) {
  return (
    <header className="flex flex-col gap-3.5 lg:flex-row lg:items-end lg:justify-between">
      <div>
        <nav
          aria-label="Breadcrumb"
          className="flex items-center gap-1.5 text-[12px] font-medium text-[#6F6A62]"
        >
          <Link
            to="/admin"
            className="transition-colors hover:text-[#5C4033]"
          >
            Admin
          </Link>
          <span aria-hidden="true">/</span>
          <span>Laporan</span>
          <span aria-hidden="true">/</span>
          <span className="font-semibold text-[#5C4033]">
            Laporan Penjualan
          </span>
        </nav>

        <h1 className="mt-1 text-[26px] font-bold tracking-tight text-[#1A1A1A] sm:text-[28px]">
          Laporan Penjualan
        </h1>
        <p className="mt-0.5 text-[13px] text-[#6F6A62]">
          Pusat pelaporan pendapatan toko, rincian omzet sah, tren penjualan,
          dan rekonsiliasi transaksi.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {isFetching && !isLoading ? (
          <span
            aria-live="polite"
            className="mr-1 inline-flex items-center gap-1.5 rounded-lg border border-[#ECE7DE] bg-[#FAF8F4] px-2.5 py-1 text-[11.5px] font-medium text-[#5C4033]"
          >
            <RefreshCw size={12} className="animate-spin" aria-hidden="true" />
            <span>Memperbarui data…</span>
          </span>
        ) : lastUpdatedWib ? (
          <span className="mr-1 text-[12px] font-medium text-[#6F6A62]">
            Diperbarui {lastUpdatedWib}
          </span>
        ) : null}

        <button
          type="button"
          onClick={onRefetch}
          disabled={isFetching}
          className="inline-flex min-h-[40px] items-center justify-center gap-2 rounded-xl border border-[#ECE7DE] bg-white px-3.5 py-2 text-[12.5px] font-semibold text-[#3F3B36] shadow-[0_1px_2px_rgba(26,22,18,0.03)] transition-colors hover:bg-[#FAF8F4] hover:text-[#1A1A1A] disabled:opacity-50"
        >
          <RefreshCw
            size={14}
            className={isFetching ? 'animate-spin' : undefined}
            aria-hidden="true"
          />
          <span>Muat Ulang</span>
        </button>

        <button
          type="button"
          onClick={onExportCsv}
          disabled={!hasTransactions || isLoading}
          className="inline-flex min-h-[40px] items-center gap-2 rounded-xl border border-[#ECE7DE] bg-white px-3.5 py-2 text-[12.5px] font-semibold text-[#3F3B36] shadow-[0_1px_2px_rgba(26,22,18,0.03)] transition-colors hover:bg-[#FAF8F4] hover:text-[#1A1A1A] disabled:cursor-not-allowed disabled:opacity-40"
          title="Unduh rincian transaksi halaman ini dalam format CSV"
        >
          <Download size={14} strokeWidth={1.8} aria-hidden="true" />
          <span>Ekspor CSV</span>
        </button>

        <button
          type="button"
          onClick={onExportExcel}
          disabled={isExportingExcel || isLoading || hasError}
          className="inline-flex min-h-[40px] items-center gap-2 rounded-xl bg-[#5C4033] px-4 py-2 text-[12.5px] font-semibold text-white shadow-[0_2px_6px_rgba(92,64,51,0.18)] transition-colors hover:bg-[#3D2920] disabled:cursor-not-allowed disabled:opacity-50"
          title="Unduh Laporan Pendapatan Excel (.xlsx) 2 Worksheet sesuai periode terpilih"
        >
          {isExportingExcel ? (
            <RefreshCw
              size={15}
              className="animate-spin text-white"
              aria-hidden="true"
            />
          ) : (
            <FileSpreadsheet size={15} strokeWidth={1.8} aria-hidden="true" />
          )}
          <span>
            {isExportingExcel ? 'Menyiapkan Excel…' : 'Ekspor Excel (.xlsx)'}
          </span>
        </button>
      </div>
    </header>
  );
});
