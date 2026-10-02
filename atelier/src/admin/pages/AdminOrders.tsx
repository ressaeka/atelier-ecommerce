import { RefreshCw, Search } from 'lucide-react';
import { useAdminOrders, type AdminOrderStatusFilter } from '../hooks/useAdminOrders';
import AdminOrdersTable from '../components/AdminOrdersTable';
import AdminOrderDetailPanel from '../components/AdminOrderDetailPanel';

const STATUS_FILTER_OPTIONS: Array<{
  value: AdminOrderStatusFilter;
  label: string;
}> = [
  { value: 'ALL', label: 'Semua status' },
  { value: 'PENDING', label: 'Menunggu Pembayaran' },
  { value: 'PAID', label: 'Dibayar' },
  { value: 'PROCESSING', label: 'Diproses' },
  { value: 'SHIPPED', label: 'Dikirim' },
  { value: 'DELIVERED', label: 'Selesai' },
  { value: 'CANCELLED', label: 'Dibatalkan' },
  { value: 'EXPIRED', label: 'Kedaluwarsa' },
];

/**
 * Admin Orders (/admin/orders)
 * List: GET /api/v1/order (ADMIN + order:read)
 * Detail: fields from selected order on admin list response
 * Status: PATCH /api/v1/order/:id/status (ADMIN + order:update_status)
 * Does NOT use GET /order/my (customer-only).
 */
export default function AdminOrders() {
  const {
    orders,
    meta,
    isLoading,
    error,
    page,
    search,
    statusFilter,
    selectedOrder,
    isDetailLoading,
    detailError,
    isUpdatingStatus,
    updateError,
    updateSuccess,
    refetch,
    setPage,
    setSearch,
    setStatusFilter,
    selectOrder,
    refreshSelectedOrder,
    updateStatus,
  } = useAdminOrders();

  const handleSelectOrder = (order: import('../../types/api').Order) => {
    selectOrder(order);
    void refreshSelectedOrder(order.id);
  };

  return (
    <div className="space-y-5">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#8A847B]">
            Admin · Pesanan
          </p>
          <h1 className="mt-1.5 font-editorial text-[26px] font-medium tracking-tight text-[#1A1A1A] sm:text-[28px]">
            Pesanan
          </h1>
          <p className="mt-1.5 text-[13px] text-[#6B6B6B]">
            Daftar seluruh pesanan Atelier.
          </p>
        </div>

        <button
          type="button"
          onClick={refetch}
          disabled={isLoading}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#D9E3EC] bg-[#F4F8FB] px-4 py-2 text-[12px] font-semibold text-[#2F5D86] transition-colors hover:bg-[#E8F1F8] disabled:opacity-50"
        >
          <RefreshCw
            size={14}
            className={isLoading ? 'animate-spin' : undefined}
          />
          Refresh
        </button>
      </header>

      {/* Search + status filter — existing GET /order query params */}
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search
            size={16}
            className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[#A39E95]"
          />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari nama penerima atau nomor pesanan..."
            className="h-11 w-full rounded-xl border border-[#E8E4DC] bg-white pl-10 pr-4 text-[13px] text-[#1A1A1A] placeholder:text-[#A39E95] focus:border-[#B7C9D9] focus:outline-none"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) =>
            setStatusFilter(e.target.value as AdminOrderStatusFilter)
          }
          aria-label="Filter status pesanan"
          className="h-11 rounded-xl border border-[#E8E4DC] bg-white px-3 text-[13px] text-[#1A1A1A] focus:border-[#B7C9D9] focus:outline-none"
        >
          {STATUS_FILTER_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      <AdminOrdersTable
        orders={orders}
        meta={meta}
        page={page}
        isLoading={isLoading}
        error={error}
        selectedOrderId={selectedOrder?.id ?? null}
        onRetry={refetch}
        onPageChange={setPage}
        onSelectOrder={handleSelectOrder}
      />

      {selectedOrder && (
        <AdminOrderDetailPanel
          order={selectedOrder}
          isUpdating={isUpdatingStatus}
          updateError={detailError ?? updateError}
          updateSuccess={updateSuccess}
          isDetailLoading={isDetailLoading}
          onClose={() => selectOrder(null)}
          onUpdateStatus={updateStatus}
        />
      )}

      {isDetailLoading && (
        <p className="text-[11px] uppercase tracking-[0.2em] text-[#8A847B]">
          Memuat detail pesanan…
        </p>
      )}
    </div>
  );
}
