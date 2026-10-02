import { ChevronLeft, ChevronRight, Users } from 'lucide-react';
import type { AdminCustomer } from '../hooks/useAdminCustomers';
import type { PaginationMeta } from '../../types/api';

interface AdminCustomersTableProps {
  customers: AdminCustomer[];
  meta: PaginationMeta | null;
  page: number;
  isLoading: boolean;
  error: string | null;
  visibleCount: number;
  filteredTotal: number;
  onRetry: () => void;
  onPageChange: (page: number) => void;
}

function formatPhone(phone: string | null | undefined): string {
  const value = phone?.trim();
  return value ? value : '-';
}

export default function AdminCustomersTable({
  customers,
  meta,
  page,
  isLoading,
  error,
  visibleCount,
  filteredTotal,
  onRetry,
  onPageChange,
}: AdminCustomersTableProps) {
  if (error) {
    return (
      <div className="rounded-2xl border border-[#F3B0A3] bg-[#FBD9D3] px-5 py-6">
        <p className="text-[13px] font-semibold text-[#8C3A1E]">
          Gagal memuat pelanggan
        </p>
        <p className="mt-1.5 text-[12px] text-[#8C3A1E]/90">
          Gagal memuat pelanggan. Silakan coba lagi.
        </p>
        <button
          type="button"
          onClick={onRetry}
          className="mt-4 rounded-xl bg-[#1A1A1A] px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-white transition-colors hover:bg-[#333]"
        >
          Coba Lagi
        </button>
      </div>
    );
  }

  if (isLoading && customers.length === 0) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center rounded-2xl border border-[#E8E4DC] bg-white">
        <p className="text-[11px] uppercase tracking-[0.22em] text-[#8A847B]">
          Memuat pelanggan…
        </p>
      </div>
    );
  }

  if (!isLoading && customers.length === 0) {
    return (
      <div className="flex min-h-[40vh] flex-col items-center justify-center rounded-2xl border border-[#E8E4DC] bg-white px-6 text-center">
        <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-[#EEF4F9] text-[#4A7BA8]">
          <Users size={20} strokeWidth={1.6} />
        </div>
        <p className="font-editorial text-[17px] text-[#1A1A1A]">
          Belum ada pelanggan.
        </p>
        <p className="mt-2 max-w-sm text-[12px] text-[#8A847B]">
          Belum ada pelanggan yang sesuai dengan pencarian atau filter.
        </p>
      </div>
    );
  }

  return (
    <section className="overflow-hidden rounded-2xl border border-[#E8E4DC] bg-white shadow-[0_1px_2px_rgba(26,26,26,0.03)]">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#F0EDE7] px-5 py-4 sm:px-6">
        <h2 className="font-editorial text-[18px] font-medium tracking-tight text-[#1A1A1A]">
          Daftar Pelanggan
        </h2>
          <span className="text-[11px] uppercase tracking-[0.1em] text-[#8A847B]">
            {visibleCount} pelanggan
          </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[760px] border-collapse text-left">
          <thead>
            <tr className="border-b border-[#F0EDE7] bg-[#FAFAF8]">
              {['No', 'Nama', 'Email', 'Telepon'].map(
                (col) => (
                  <th
                    key={col}
                    className="whitespace-nowrap px-4 py-3 text-[10.5px] font-semibold uppercase tracking-[0.1em] text-[#8A847B]"
                  >
                    {col}
                  </th>
                ),
              )}
            </tr>
          </thead>
          <tbody>
            {customers.map((customer, index) => (
              <tr
                key={customer.id}
                className="border-b border-[#F5F2EC] transition-colors last:border-0 hover:bg-[#FCFBF9]"
              >
                <td className="px-4 py-3.5 text-[12.5px] text-[#6B6B6B]">
                  {(page - 1) * (meta?.limit ?? 10) + index + 1}
                </td>
                <td className="whitespace-nowrap px-4 py-3.5 text-[12.5px] font-medium text-[#1A1A1A]">
                  {customer.name || '-'}
                </td>
                <td className="px-4 py-3.5 text-[12.5px] text-[#4A4A4A]">
                  {customer.email || '-'}
                </td>
                <td className="whitespace-nowrap px-4 py-3.5 text-[12.5px] text-[#4A4A4A]">
                  {formatPhone(customer.phone)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {meta && (
        <div className="flex flex-col gap-4 border-t border-[#F0EDE7] px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <p className="text-[12px] text-[#8A847B]">
            Halaman {meta.page} dari {Math.max(meta.totalPages, 1)} ·{' '}
            {visibleCount} pelanggan
            {filteredTotal !== visibleCount
              ? ` (dari ${filteredTotal} akun di halaman ini)`
              : ''}
          </p>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => onPageChange(Math.max(page - 1, 1))}
              disabled={page <= 1 || isLoading}
              className="flex h-8 items-center gap-1 rounded-lg px-2 text-[12px] font-medium text-[#6B6B6B] transition-colors hover:bg-[#F3F1EC] disabled:cursor-not-allowed disabled:opacity-40"
              aria-label="Halaman sebelumnya"
            >
              <ChevronLeft size={14} />
              Sebelumnya
            </button>

            {Array.from({ length: Math.min(meta.totalPages, 5) }, (_, i) => {
              const start =
                meta.totalPages <= 5
                  ? 1
                  : Math.min(
                      Math.max(page - 2, 1),
                      Math.max(meta.totalPages - 4, 1),
                    );
              const pageNum = start + i;
              if (pageNum > meta.totalPages) return null;
              return (
                <button
                  key={pageNum}
                  type="button"
                  onClick={() => onPageChange(pageNum)}
                  disabled={isLoading}
                  className={`h-8 min-w-8 rounded-lg px-2 text-[12px] font-medium transition-colors ${
                    page === pageNum
                      ? 'bg-[#EEF4F9] text-[#2F5D86]'
                      : 'text-[#6B6B6B] hover:bg-[#F3F1EC]'
                  }`}
                >
                  {pageNum}
                </button>
              );
            })}

            <button
              type="button"
              onClick={() =>
                onPageChange(Math.min(page + 1, meta.totalPages || 1))
              }
              disabled={page >= (meta.totalPages || 1) || isLoading}
              className="flex h-8 items-center gap-1 rounded-lg px-2 text-[12px] font-medium text-[#6B6B6B] transition-colors hover:bg-[#F3F1EC] disabled:cursor-not-allowed disabled:opacity-40"
              aria-label="Halaman berikutnya"
            >
              Berikutnya
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
