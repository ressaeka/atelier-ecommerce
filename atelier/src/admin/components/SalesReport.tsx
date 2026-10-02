import { useMemo, useState } from 'react';

import { Download, Search } from 'lucide-react';

import {
  ADMIN_ORDER_STATUS_META,
  type AdminSalesReportRow,
} from '../data/adminDashboardMockData';

import { formatPrice } from '../../lib/utils';

interface SalesReportProps {
  rows: AdminSalesReportRow[];
  totalOrders: number;
  rangeLabel: string;
}

const ROWS_PER_PAGE = 10;

export default function SalesReport({
  rows,
  totalOrders,
  rangeLabel,
}: SalesReportProps) {
  const [page, setPage] = useState(1);
  const [productFilter, setProductFilter] = useState('');

  const filteredRows = useMemo(() => {
    const keyword = productFilter.trim().toLowerCase();

    if (!keyword) {
      return rows;
    }

    return rows.filter((row) =>
      row.product.toLowerCase().includes(keyword),
    );
  }, [rows, productFilter]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredRows.length / ROWS_PER_PAGE),
  );

  const currentPage = Math.min(page, totalPages);

  const paginatedRows = useMemo(() => {
    const startIndex = (currentPage - 1) * ROWS_PER_PAGE;

    return filteredRows.slice(
      startIndex,
      startIndex + ROWS_PER_PAGE,
    );
  }, [filteredRows, currentPage]);

  const startItem =
    filteredRows.length === 0
      ? 0
      : (currentPage - 1) * ROWS_PER_PAGE + 1;

  const endItem = Math.min(
    currentPage * ROWS_PER_PAGE,
    filteredRows.length,
  );

  function handleFilterChange(value: string) {
    setProductFilter(value);
    setPage(1);
  }

  function handlePageChange(nextPage: number) {
    if (nextPage < 1 || nextPage > totalPages) {
      return;
    }

    setPage(nextPage);
  }

  return (
    <section className="rounded-2xl border border-[#E8E4DC] bg-white shadow-[0_1px_2px_rgba(26,26,26,0.03)]">
      <div className="border-b border-[#F0EDE7] p-5 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="font-editorial text-[18px] font-medium tracking-tight text-[#1A1A1A]">
              Laporan Penjualan
            </h2>

            <p className="mt-1 text-[12px] text-[#8A847B]">
              Rentang: {rangeLabel}
            </p>
          </div>

          <button
            type="button"
            className="inline-flex items-center gap-2 rounded-xl border border-[#D9E3EC] bg-[#F4F8FB] px-4 py-2 text-[12px] font-semibold text-[#2F5D86] transition-colors hover:bg-[#E8F1F8]"
          >
            <Download size={14} strokeWidth={2} />
            Export Excel
          </button>
        </div>

        <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="flex flex-1 flex-col gap-2 sm:flex-row">
            <label className="flex-1">
              <span className="sr-only">
                Rentang tanggal
              </span>

              <input
                type="text"
                value={rangeLabel}
                readOnly
                className="h-10 w-full rounded-xl border border-[#EDEAE3] bg-[#FAFAF8] px-3.5 text-[12px] text-[#6B6B6B]"
              />
            </label>

            <label className="relative flex-1">
              <span className="sr-only">
                Filter produk
              </span>

              <Search
                size={14}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#A39E95]"
              />

              <input
                type="text"
                value={productFilter}
                onChange={(event) =>
                  handleFilterChange(event.target.value)
                }
                placeholder="Filter produk..."
                className="h-10 w-full rounded-xl border border-[#EDEAE3] bg-[#FAFAF8] pl-9 pr-3.5 text-[12px] text-[#1A1A1A] placeholder:text-[#A39E95] focus:border-[#B7C9D9] focus:bg-white focus:outline-none"
              />
            </label>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        {rows.length === 0 && (
          <div className="px-6 py-10 text-center text-[12px] text-[#8A847B]">
            Belum ada data laporan penjualan.
          </div>
        )}

        {rows.length > 0 && filteredRows.length === 0 && (
          <div className="px-6 py-10 text-center text-[12px] text-[#8A847B]">
            Tidak ada produk yang sesuai dengan pencarian.
          </div>
        )}

        {paginatedRows.length > 0 && (
          <table className="w-full min-w-[760px] border-collapse text-left">
            <thead>
              <tr className="border-b border-[#F0EDE7] bg-[#FAFAF8]">
                {[
                  'No',
                  'Tanggal',
                  'No. Pesanan',
                  'Nama Pelanggan',
                  'Produk',
                  'Jumlah',
                  'Total',
                  'Status',
                ].map((column) => (
                  <th
                    key={column}
                    className="whitespace-nowrap px-4 py-3 text-[10.5px] font-semibold uppercase tracking-[0.1em] text-[#8A847B]"
                  >
                    {column}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {paginatedRows.map((row, index) => {
                const statusMeta =
                  ADMIN_ORDER_STATUS_META[row.status];

                const rowNumber =
                  (currentPage - 1) * ROWS_PER_PAGE +
                  index +
                  1;

                return (
                  <tr
                    key={`${row.orderNumber}-${row.no}`}
                    className="border-b border-[#F5F2EC] transition-colors last:border-0 hover:bg-[#FCFBF9]"
                  >
                    <td className="px-4 py-3.5 text-[12.5px] text-[#6B6B6B]">
                      {rowNumber}
                    </td>

                    <td className="whitespace-nowrap px-4 py-3.5 text-[12.5px] text-[#4A4A4A]">
                      {row.date}
                    </td>

                    <td className="whitespace-nowrap px-4 py-3.5 font-editorial text-[12.5px] font-semibold text-[#1A1A1A]">
                      {row.orderNumber}
                    </td>

                    <td className="px-4 py-3.5 text-[12.5px] text-[#4A4A4A]">
                      {row.customerName}
                    </td>

                    <td className="px-4 py-3.5 text-[12.5px] text-[#4A4A4A]">
                      {row.product}
                    </td>

                    <td className="px-4 py-3.5 text-[12.5px] text-[#4A4A4A]">
                      {row.quantity}
                    </td>

                    <td className="whitespace-nowrap px-4 py-3.5 text-[12.5px] font-semibold text-[#1A1A1A]">
                      {formatPrice(row.total)}
                    </td>

                    <td className="px-4 py-3.5">
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium ${statusMeta.className}`}
                      >
                        <span
                          className={`h-1.5 w-1.5 rounded-full ${statusMeta.dotClassName}`}
                        />

                        {row.status}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {rows.length > 0 && (
        <div className="flex flex-col gap-4 border-t border-[#F0EDE7] p-5 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-[12px] text-[#8A847B]">
            {filteredRows.length === 0
              ? 'Tidak ada pesanan yang sesuai'
              : `Menampilkan ${startItem}–${endItem} dari ${totalOrders} pesanan`}
          </p>

          {totalPages > 1 && (
            <div className="flex items-center gap-1">
              <button
                type="button"
                disabled={currentPage === 1}
                onClick={() =>
                  handlePageChange(currentPage - 1)
                }
                className="h-8 rounded-lg px-2.5 text-[12px] font-medium text-[#6B6B6B] transition-colors hover:bg-[#F3F1EC] disabled:cursor-not-allowed disabled:opacity-40"
              >
                Sebelumnya
              </button>

              {Array.from(
                { length: totalPages },
                (_, index) => index + 1,
              ).map((pageNumber) => (
                <button
                  key={pageNumber}
                  type="button"
                  onClick={() =>
                    handlePageChange(pageNumber)
                  }
                  className={`h-8 min-w-8 rounded-lg px-2 text-[12px] font-medium transition-colors ${
                    currentPage === pageNumber
                      ? 'bg-[#EEF4F9] text-[#2F5D86]'
                      : 'text-[#6B6B6B] hover:bg-[#F3F1EC]'
                  }`}
                >
                  {pageNumber}
                </button>
              ))}

              <button
                type="button"
                disabled={currentPage === totalPages}
                onClick={() =>
                  handlePageChange(currentPage + 1)
                }
                className="h-8 rounded-lg px-2.5 text-[12px] font-medium text-[#6B6B6B] transition-colors hover:bg-[#F3F1EC] disabled:cursor-not-allowed disabled:opacity-40"
              >
                Berikutnya
              </button>
            </div>
          )}
        </div>
      )}
    </section>
  );
}