import { useMemo, useState } from 'react';
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Download,
  FileText,
  Search,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import type { AdminSalesReportRow } from '../data/adminDashboardMockData';
import { CardHeader, StatusBadge, formatPrice } from './ui/AdminPrimitives';

interface SalesReportProps {
  rows: AdminSalesReportRow[];
  totalOrders: number;
  rangeLabel: string;
}

const ROWS_PER_PAGE = 5;

const MONTH_ID_MAP: Record<string, string> = {
  '01': 'Jan',
  '02': 'Feb',
  '03': 'Mar',
  '04': 'Apr',
  '05': 'Mei',
  '06': 'Jun',
  '07': 'Jul',
  '08': 'Agu',
  '09': 'Sep',
  '10': 'Okt',
  '11': 'Nov',
  '12': 'Des',
};

function formatSubtitleRange(rangeLabel: string): string {
  // Convert "08/11/2026 - 14/11/2026" to "Rentang 08 Nov 2026 – 14 Nov 2026"
  const parts = rangeLabel.split(/\s*[-–]\s*/);
  if (parts.length === 2) {
    const fmt = (dmy: string) => {
      const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(dmy.trim());
      if (!m) return dmy;
      return `${m[1]} ${MONTH_ID_MAP[m[2]] ?? m[2]} ${m[3]}`;
    };
    return `Rentang ${fmt(parts[0])} – ${fmt(parts[1])}`;
  }
  return `Rentang ${rangeLabel}`;
}

export default function SalesReport({
  rows,
  totalOrders,
  rangeLabel,
}: SalesReportProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  const filteredRows = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return rows;

    return rows.filter(
      (row) =>
        row.product.toLowerCase().includes(query) ||
        row.customerName.toLowerCase().includes(query) ||
        row.orderNumber.toLowerCase().includes(query),
    );
  }, [rows, searchQuery]);

  const isFiltered = searchQuery.trim().length > 0;
  const effectiveTotal = isFiltered ? filteredRows.length : totalOrders;
  const totalPages = Math.max(1, Math.ceil(effectiveTotal / ROWS_PER_PAGE));

  const safeCurrentPage = Math.min(currentPage, totalPages);

  const paginatedRows = useMemo(() => {
    const startIndex = (safeCurrentPage - 1) * ROWS_PER_PAGE;
    return filteredRows.slice(startIndex, startIndex + ROWS_PER_PAGE);
  }, [filteredRows, safeCurrentPage]);

  const startItem =
    filteredRows.length === 0 ? 0 : (safeCurrentPage - 1) * ROWS_PER_PAGE + 1;
  const endItem = Math.min(
    safeCurrentPage * ROWS_PER_PAGE,
    isFiltered ? filteredRows.length : Math.max(filteredRows.length, totalOrders),
  );

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    setCurrentPage(1);
  };

  const handlePageChange = (page: number) => {
    if (page < 1 || page > totalPages) return;
    setCurrentPage(page);
  };

  return (
    <section
      aria-labelledby="sales-report-title"
      className="rounded-2xl border border-[#ECE7DE] bg-white p-6 shadow-[0_1px_3px_rgba(26,22,18,0.04)]"
    >
      <CardHeader
        id="sales-report-title"
        icon={FileText}
        title="Laporan Penjualan"
        subtitle={formatSubtitleRange(rangeLabel)}
      />

      {/* Toolbar */}
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <div className="inline-flex h-10 items-center gap-2.5 rounded-xl border border-[#ECE7DE] bg-[#FAF8F4] px-3.5 font-sans text-[13px] tabular-nums text-[#3F3B36]">
            <Calendar
              size={15}
              className="shrink-0 text-[#6F6A62]"
              aria-hidden="true"
            />
            <span>{rangeLabel.replace(/\s*-\s*/, ' – ')}</span>
          </div>

          <div className="relative w-full sm:w-[280px]">
            <Search
              size={15}
              className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[#A39D93]"
              aria-hidden="true"
            />
            <input
              type="search"
              value={searchQuery}
              onChange={(event) => handleSearchChange(event.target.value)}
              placeholder="Filter produk..."
              aria-label="Filter produk laporan penjualan"
              className="h-10 w-full rounded-xl border border-[#ECE7DE] bg-[#FAF8F4] pl-9 pr-3.5 text-[13px] text-[#1A1A1A] placeholder:text-[#6F6A62] transition-colors focus:border-[#9A7458] focus:bg-white focus:outline-none"
            />
          </div>
        </div>

        <Link
          to="/admin/reports"
          className="inline-flex h-10 items-center gap-2 rounded-xl border border-[#D8CBB8] bg-white px-4 text-[13px] font-semibold text-[#5C4033] transition-colors hover:bg-[#FAF8F4]"
        >
          <Download size={15} aria-hidden="true" />
          <span>Ekspor Excel</span>
        </Link>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        {rows.length === 0 && (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-[#ECE7DE] bg-[#FAF8F4] py-12 text-center">
            <p className="text-[13.5px] font-semibold text-[#3F3B36]">
              Belum ada data penjualan.
            </p>
            <p className="mt-1 text-[12px] text-[#6F6A62]">
              Transaksi dalam 7 hari terakhir akan muncul di sini.
            </p>
          </div>
        )}

        {rows.length > 0 && paginatedRows.length === 0 && (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-[#ECE7DE] bg-[#FAF8F4] py-10 text-center">
            <p className="text-[13px] text-[#6F6A62]">
              Tidak ada pesanan yang cocok dengan &ldquo;{searchQuery}&rdquo;.
            </p>
          </div>
        )}

        {paginatedRows.length > 0 && (
          <table className="w-full min-w-[760px] border-collapse text-left">
            <thead>
              <tr className="border-y border-[#ECE7DE] bg-[#FAF8F4]">
                <th className="whitespace-nowrap px-4 py-3 text-[11.5px] font-semibold uppercase tracking-wider text-[#6F6A62]">
                  Tanggal
                </th>
                <th className="whitespace-nowrap px-4 py-3 text-[11.5px] font-semibold uppercase tracking-wider text-[#6F6A62]">
                  No. Pesanan
                </th>
                <th className="whitespace-nowrap px-4 py-3 text-[11.5px] font-semibold uppercase tracking-wider text-[#6F6A62]">
                  Pelanggan
                </th>
                <th className="whitespace-nowrap px-4 py-3 text-[11.5px] font-semibold uppercase tracking-wider text-[#6F6A62]">
                  Produk
                </th>
                <th className="whitespace-nowrap px-4 py-3 text-right text-[11.5px] font-semibold uppercase tracking-wider text-[#6F6A62]">
                  Jumlah
                </th>
                <th className="whitespace-nowrap px-4 py-3 text-right text-[11.5px] font-semibold uppercase tracking-wider text-[#6F6A62]">
                  Total
                </th>
                <th className="whitespace-nowrap px-4 py-3 text-[11.5px] font-semibold uppercase tracking-wider text-[#6F6A62]">
                  Status
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-[#ECE7DE]">
              {paginatedRows.map((row) => (
                <tr
                  key={`${row.orderNumber}-${row.no}`}
                  className="h-[50px] transition-colors hover:bg-[#FAF8F4]/70"
                >
                  <td className="whitespace-nowrap px-4 py-3 font-sans text-[13.5px] tabular-nums text-[#3F3B36]">
                    {row.date}
                  </td>

                  <td className="whitespace-nowrap px-4 py-3 font-sans text-[13.5px] font-bold tabular-nums text-[#1A1A1A]">
                    {row.orderNumber}
                  </td>

                  <td className="px-4 py-3 text-[13.5px] text-[#3F3B36]">
                    {row.customerName}
                  </td>

                  <td className="px-4 py-3 text-[13.5px] text-[#3F3B36]">
                    {row.product}
                  </td>

                  <td className="whitespace-nowrap px-4 py-3 text-right font-sans text-[13.5px] tabular-nums text-[#3F3B36]">
                    {row.quantity}
                  </td>

                  <td className="whitespace-nowrap px-4 py-3 text-right font-sans text-[13.5px] font-bold tabular-nums text-[#1A1A1A]">
                    {formatPrice(row.total)}
                  </td>

                  <td className="px-4 py-3">
                    <StatusBadge status={row.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Footer + Pagination */}
      {rows.length > 0 && (
        <div className="mt-4 flex flex-col gap-3 border-t border-[#ECE7DE] pt-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-[12.5px] text-[#6F6A62]">
            {filteredRows.length === 0
              ? 'Tidak ada pesanan yang sesuai'
              : `Menampilkan ${startItem}–${endItem} dari ${effectiveTotal} pesanan`}
          </p>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              disabled={safeCurrentPage === 1}
              onClick={() => handlePageChange(safeCurrentPage - 1)}
              aria-label="Halaman sebelumnya"
              className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-[#ECE7DE] bg-white text-[#3F3B36] transition-colors hover:bg-[#FAF8F4] disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ChevronLeft size={15} />
            </button>

            {Array.from({ length: totalPages }, (_, index) => index + 1).map(
              (pageNumber) => (
                <button
                  key={pageNumber}
                  type="button"
                  onClick={() => handlePageChange(pageNumber)}
                  aria-current={
                    safeCurrentPage === pageNumber ? 'page' : undefined
                  }
                  className={`h-8 min-w-8 rounded-lg px-2.5 font-sans text-[12.5px] font-semibold tabular-nums transition-colors ${
                    safeCurrentPage === pageNumber
                      ? 'bg-[#5C4033] text-white'
                      : 'border border-[#ECE7DE] bg-white text-[#3F3B36] hover:bg-[#FAF8F4]'
                  }`}
                >
                  {pageNumber}
                </button>
              ),
            )}

            <button
              type="button"
              disabled={safeCurrentPage === totalPages}
              onClick={() => handlePageChange(safeCurrentPage + 1)}
              aria-label="Halaman berikutnya"
              className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-[#ECE7DE] bg-white text-[#3F3B36] transition-colors hover:bg-[#FAF8F4] disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ChevronRight size={15} />
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
