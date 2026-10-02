import { ChevronLeft, ChevronRight, Eye, Package } from 'lucide-react';
import type { Order } from '../../types/api';
import type { PaginationMeta } from '../../types/api';
import type { AdminOrderStatusFilter } from '../hooks/useAdminOrders';
import { formatPrice } from '../../lib/utils';

interface AdminOrdersTableProps {
  orders: Order[];
  meta: PaginationMeta | null;
  page: number;
  isLoading: boolean;
  error: string | null;
  selectedOrderId: number | null;
  onRetry: () => void;
  onPageChange: (page: number) => void;
  onSelectOrder: (order: Order) => void;
}

/** Status labels + badges consistent with Admin Portal Atelier */
export const ADMIN_ORDER_STATUS_META: Record<
  string,
  { className: string; dotClassName: string; label: string }
> = {
  PENDING: {
    className: 'bg-[#FDF3D9] text-[#A67C3D]',
    dotClassName: 'bg-[#C9944A]',
    label: 'Menunggu Pembayaran',
  },
  PAID: {
    className: 'bg-[#E3EEF8] text-[#4A7BA8]',
    dotClassName: 'bg-[#5E96C8]',
    label: 'Dibayar',
  },
  PROCESSING: {
    className: 'bg-[#E3EEF8] text-[#4A7BA8]',
    dotClassName: 'bg-[#5E96C8]',
    label: 'Diproses',
  },
  SHIPPED: {
    className: 'bg-[#FDF0E0] text-[#A67C3D]',
    dotClassName: 'bg-[#C9944A]',
    label: 'Dikirim',
  },
  DELIVERED: {
    className: 'bg-[#E4F4EA] text-[#3D8B5C]',
    dotClassName: 'bg-[#4DA66D]',
    label: 'Selesai',
  },
  CANCELLED: {
    className: 'bg-[#F6E0E0] text-[#A05050]',
    dotClassName: 'bg-[#C06060]',
    label: 'Dibatalkan',
  },
  EXPIRED: {
    className: 'bg-[#EEEEEE] text-[#6A6A6A]',
    dotClassName: 'bg-[#9A9A9A]',
    label: 'Kedaluwarsa',
  },
};

export function OrderStatusBadge({ status }: { status: Order['status'] }) {
  const meta = ADMIN_ORDER_STATUS_META[status] ?? ADMIN_ORDER_STATUS_META.PENDING;
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium ${meta.className}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${meta.dotClassName}`} />
      {meta.label}
    </span>
  );
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return iso;
  }
}

function formatOrderNumber(id: number): string {
  return `#ORD-${id}`;
}

export default function AdminOrdersTable({
  orders,
  meta,
  page,
  isLoading,
  error,
  selectedOrderId,
  onRetry,
  onPageChange,
  onSelectOrder,
}: AdminOrdersTableProps) {
  if (error) {
    return (
      <div className="rounded-2xl border border-[#F3B0A3] bg-[#FBD9D3] px-5 py-6">
        <p className="text-[13px] font-semibold text-[#8C3A1E]">
          Gagal memuat pesanan
        </p>
        <p className="mt-1.5 text-[12px] text-[#8C3A1E]/90">
          Gagal memuat pesanan. Silakan coba lagi.
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

  if (isLoading && orders.length === 0) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center rounded-2xl border border-[#E8E4DC] bg-white">
        <p className="text-[11px] uppercase tracking-[0.22em] text-[#8A847B]">
          Memuat pesanan…
        </p>
      </div>
    );
  }

  if (!isLoading && orders.length === 0) {
    return (
      <div className="flex min-h-[40vh] flex-col items-center justify-center rounded-2xl border border-[#E8E4DC] bg-white px-6 text-center">
        <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-[#EEF4F9] text-[#4A7BA8]">
          <Package size={20} strokeWidth={1.6} />
        </div>
        <p className="font-editorial text-[17px] text-[#1A1A1A]">
          Belum ada pesanan
        </p>
        <p className="mt-2 max-w-sm text-[12px] text-[#8A847B]">
          Pesanan pelanggan akan muncul di sini setelah tersedia.
        </p>
      </div>
    );
  }

  return (
    <section className="overflow-hidden rounded-2xl border border-[#E8E4DC] bg-white shadow-[0_1px_2px_rgba(26,26,26,0.03)]">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#F0EDE7] px-5 py-4 sm:px-6">
        <h2 className="font-editorial text-[18px] font-medium tracking-tight text-[#1A1A1A]">
          Daftar Pesanan
        </h2>
        <span className="text-[11px] uppercase tracking-[0.1em] text-[#8A847B]">
          {meta?.total != null ? `${meta.total} pesanan` : `${orders.length} pesanan`}
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[780px] border-collapse text-left">
          <thead>
            <tr className="border-b border-[#F0EDE7] bg-[#FAFAF8]">
              {['No. Pesanan', 'Pelanggan', 'Total', 'Status', 'Tanggal', 'Aksi'].map(
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
            {orders.map((order) => (
              <tr
                key={order.id}
                className={`border-b border-[#F5F2EC] transition-colors last:border-0 hover:bg-[#FCFBF9] ${
                  selectedOrderId === order.id ? 'bg-[#EEF4F9]/40' : ''
                }`}
              >
                <td className="whitespace-nowrap px-4 py-3.5 font-editorial text-[12.5px] font-semibold text-[#1A1A1A]">
                  {formatOrderNumber(order.id)}
                </td>
                <td className="px-4 py-3.5 text-[12.5px] text-[#4A4A4A]">
                  <p className="font-medium text-[#1A1A1A]">
                    {order.recipientName || '-'}
                  </p>
                  <p className="mt-0.5 text-[11px] text-[#8A847B]">
                    {order.phone || '-'}
                  </p>
                </td>
                <td className="whitespace-nowrap px-4 py-3.5 text-[12.5px] font-semibold text-[#1A1A1A]">
                  {formatPrice(order.total)}
                </td>
                <td className="px-4 py-3.5">
                  <OrderStatusBadge status={order.status} />
                </td>
                <td className="whitespace-nowrap px-4 py-3.5 text-[12px] text-[#4A4A4A]">
                  {formatDate(order.createdAt)}
                </td>
                <td className="px-4 py-3.5">
                  <button
                    type="button"
                    onClick={() => onSelectOrder(order)}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-[#D9E3EC] bg-[#F4F8FB] px-2.5 py-1.5 text-[11px] font-semibold text-[#2F5D86] transition-colors hover:bg-[#E8F1F8]"
                  >
                    <Eye size={13} />
                    Detail
                  </button>
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
            {orders.length} pesanan
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

export { formatDate, formatOrderNumber };
export type { AdminOrderStatusFilter };
