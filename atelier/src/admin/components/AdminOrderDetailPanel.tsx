import { useState } from 'react';
import { X } from 'lucide-react';
import type { Order, OrderStatus, PaymentMethodCode } from '../../types/api';
import { formatPrice } from '../../lib/utils';
import { OrderStatusBadge, formatDate } from './AdminOrdersTable';

interface AdminOrderDetailPanelProps {
  order: Order;
  isUpdating: boolean;
  isDetailLoading?: boolean;
  updateError: string | null;
  updateSuccess: string | null;
  onClose: () => void;
  onUpdateStatus: (orderId: number, status: OrderStatus) => Promise<void>;
}

const STATUS_OPTIONS: Array<{ value: OrderStatus; label: string }> = [
  { value: 'PENDING', label: 'Menunggu Pembayaran' },
  { value: 'PAID', label: 'Dibayar' },
  { value: 'PROCESSING', label: 'Diproses' },
  { value: 'SHIPPED', label: 'Dikirim' },
  { value: 'DELIVERED', label: 'Selesai' },
  { value: 'CANCELLED', label: 'Dibatalkan' },
  { value: 'EXPIRED', label: 'Kedaluwarsa' },
];

const PAYMENT_STATUS_LABEL: Record<string, string> = {
  PENDING: 'Menunggu Pembayaran',
  PAID: 'Dibayar',
  CANCELLED: 'Dibatalkan',
  EXPIRED: 'Kedaluwarsa',
};

const PAYMENT_METHOD_LABEL: Record<PaymentMethodCode, string> = {
  GOPAY: 'GoPay',
  VIRTUAL_ACCOUNT: 'Virtual Account',
  SHOPEEPAY: 'ShopeePay',
  OVO: 'OVO',
  DANA: 'Dana',
  QRIS: 'QRIS',
};

function formatOrderNumber(id: number): string {
  return `#ORD-${id}`;
}

function paymentStatusLabel(status: string): string {
  return PAYMENT_STATUS_LABEL[status] ?? status;
}

function paymentMethodLabel(
  method: PaymentMethodCode | null | undefined,
): string | null {
  if (!method) return null;
  return PAYMENT_METHOD_LABEL[method] ?? method;
}

function variantLabel(orderItem: Order['items'][number]): string {
  const parts: string[] = [];
  if (orderItem.variant) {
    if (orderItem.variant.color) parts.push(orderItem.variant.color);
    if (orderItem.variant.size) parts.push(orderItem.variant.size);
  }
  return parts.length ? parts.join(' / ') : '-';
}

/**
 * Admin order detail panel.
 * Payment section uses real Payment rows from GET /order/:id when ADMIN.
 * Empty state only when API returns no payments for this order.
 */
export default function AdminOrderDetailPanel({
  order,
  isUpdating,
  isDetailLoading = false,
  updateError,
  updateSuccess,
  onClose,
  onUpdateStatus,
}: AdminOrderDetailPanelProps) {
  const [statusValue, setStatusValue] = useState<OrderStatus>(order.status);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (statusValue === order.status || isUpdating) return;
    await onUpdateStatus(order.id, statusValue);
  };

  const payments = order.payments ?? [];

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <button
        type="button"
        className="absolute inset-0 bg-black/35 backdrop-blur-[2px]"
        onClick={onClose}
        aria-label="Tutup detail pesanan"
      />

      <aside className="relative h-full w-full max-w-[480px] overflow-y-auto bg-[#FAF9F5] shadow-2xl">
        <header className="sticky top-0 z-10 flex items-start justify-between gap-3 border-b border-[#EDEAE3] bg-white px-5 py-4 sm:px-6">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#8A847B]">
              Detail Pesanan
            </p>
            <h2 className="mt-1 font-editorial text-[22px] font-medium text-[#1A1A1A]">
              {formatOrderNumber(order.id)}
            </h2>
            <p className="mt-1 text-[12px] text-[#6B6B6B]">
              {formatDate(order.createdAt)}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-[#EDEAE3] p-2 text-[#6B6B6B] transition-colors hover:bg-[#F3F1EC] hover:text-[#1A1A1A]"
            aria-label="Tutup"
          >
            <X size={16} />
          </button>
        </header>

        <div className="space-y-4 px-5 py-5 sm:px-6">
          {/* Status */}
          <section className="rounded-2xl border border-[#E8E4DC] bg-white p-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#8A847B]">
              Status
            </p>
            <div className="mt-2">
              <OrderStatusBadge status={order.status} />
            </div>

            <form onSubmit={handleUpdate} className="mt-4 space-y-3">
              <label className="block">
                <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.1em] text-[#6B6B6B]">
                  Update Status
                </span>
                <select
                  value={statusValue}
                  onChange={(e) => setStatusValue(e.target.value as OrderStatus)}
                  disabled={isUpdating}
                  className="h-10 w-full rounded-xl border border-[#EDEAE3] bg-[#FAFAF8] px-3 text-[13px] text-[#1A1A1A] focus:border-[#B7C9D9] focus:bg-white focus:outline-none"
                >
                  {STATUS_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </label>

              {updateError && (
                <p className="text-[12px] font-medium text-[#A05050]">
                  {updateError}
                </p>
              )}
              {updateSuccess && (
                <p className="text-[12px] font-medium text-[#3D8B5C]">
                  {updateSuccess}
                </p>
              )}

              <button
                type="submit"
                disabled={isUpdating || statusValue === order.status}
                className="w-full rounded-xl bg-[#1A1A1A] px-4 py-2.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-white transition-colors hover:bg-[#333] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isUpdating ? 'Memperbarui...' : 'Update Status'}
              </button>
            </form>
          </section>

          {/* Customer / Shipping */}
          <section className="rounded-2xl border border-[#E8E4DC] bg-white p-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#8A847B]">
              Pelanggan &amp; Pengiriman
            </p>
            <dl className="mt-3 space-y-2 text-[13px]">
              <div className="flex justify-between gap-3">
                <dt className="text-[#6B6B6B]">Nama penerima</dt>
                <dd className="text-right font-medium text-[#1A1A1A]">
                  {order.recipientName || '-'}
                </dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-[#6B6B6B]">Telepon</dt>
                <dd className="text-right font-medium text-[#1A1A1A]">
                  {order.phone || '-'}
                </dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-[#6B6B6B]">Alamat</dt>
                <dd className="max-w-[60%] text-right font-medium text-[#1A1A1A]">
                  {order.addressLine || '-'}
                </dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-[#6B6B6B]">Kota / Provinsi</dt>
                <dd className="text-right font-medium text-[#1A1A1A]">
                  {[order.city, order.province].filter(Boolean).join(' / ') ||
                    '-'}
                </dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-[#6B6B6B]">Kode pos</dt>
                <dd className="text-right font-medium text-[#1A1A1A]">
                  {order.postalCode || '-'}
                </dd>
              </div>
            </dl>
          </section>

          {/* Items */}
          <section className="rounded-2xl border border-[#E8E4DC] bg-white p-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#8A847B]">
              Item Pesanan ({order.items?.length ?? 0})
            </p>
            <ul className="mt-3 space-y-3">
              {(order.items ?? []).map((item) => (
                <li
                  key={item.id}
                  className="flex items-start justify-between gap-3 rounded-xl border border-[#F0EDE7] bg-[#FCFBF9] p-3"
                >
                  <div className="min-w-0">
                    <p className="truncate text-[13px] font-medium text-[#1A1A1A]">
                      {item.product?.name || 'Produk'}
                    </p>
                    <p className="mt-0.5 text-[11px] text-[#8A847B]">
                      Varian: {variantLabel(item)} · Jumlah: {item.quantity} ·{' '}
                      {formatPrice(item.price)}
                    </p>
                  </div>
                  <p className="shrink-0 text-[13px] font-semibold text-[#1A1A1A]">
                    {formatPrice(item.subtotal)}
                  </p>
                </li>
              ))}
            </ul>
          </section>

          {/* Summary */}
          <section className="rounded-2xl border border-[#E8E4DC] bg-white p-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#8A847B]">
              Ringkasan
            </p>
            <dl className="mt-3 space-y-2 text-[13px]">
              <div className="flex justify-between">
                <dt className="text-[#6B6B6B]">Subtotal</dt>
                <dd className="font-medium text-[#1A1A1A]">
                  {formatPrice(order.subtotal)}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-[#6B6B6B]">Ongkos kirim</dt>
                <dd className="font-medium text-[#1A1A1A]">
                  {formatPrice(order.shippingFee)}
                </dd>
              </div>
              <div className="flex justify-between border-t border-[#F0EDE7] pt-2">
                <dt className="font-semibold text-[#1A1A1A]">Total</dt>
                <dd className="font-editorial text-[16px] font-semibold text-[#1A1A1A]">
                  {formatPrice(order.total)}
                </dd>
              </div>
            </dl>
          </section>

          {/* Payments — real Payment rows from GET /order/:id */}
          <section className="rounded-2xl border border-[#E8E4DC] bg-white p-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#8A847B]">
              Pembayaran
            </p>

            {isDetailLoading && payments.length === 0 && (
              <p className="mt-2 text-[12px] text-[#8A847B]">
                Memuat informasi pembayaran…
              </p>
            )}

            {!isDetailLoading && payments.length === 0 && (
              <p className="mt-2 text-[12px] text-[#8A847B]">
                Informasi pembayaran belum tersedia untuk pesanan ini.
              </p>
            )}

            {!isDetailLoading && payments.length > 0 && (
              <ul className="mt-3 space-y-3">
                {payments.map((payment) => {
                  const methodLabel = paymentMethodLabel(payment.paymentMethod);
                  return (
                    <li
                      key={payment.id}
                      className="rounded-xl border border-[#F0EDE7] bg-[#FCFBF9] p-3"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[12px] text-[#6B6B6B]">
                          Status
                        </span>
                        <span className="text-[12px] font-semibold text-[#1A1A1A]">
                          {paymentStatusLabel(payment.status)}
                        </span>
                      </div>

                      <div className="mt-2 flex items-center justify-between gap-2">
                        <span className="text-[12px] text-[#6B6B6B]">
                          Metode Pembayaran
                        </span>
                        <span className="text-[12px] font-medium text-[#1A1A1A]">
                          {methodLabel ?? '-'}
                        </span>
                      </div>

                      <div className="mt-2 flex items-center justify-between gap-2">
                        <span className="text-[12px] text-[#6B6B6B]">
                          Nominal
                        </span>
                        <span className="text-[12px] font-semibold text-[#1A1A1A]">
                          {formatPrice(payment.grossAmount)}
                        </span>
                      </div>

                      <div className="mt-2 flex items-center justify-between gap-2">
                        <span className="text-[12px] text-[#6B6B6B]">
                          Dibuat
                        </span>
                        <span className="text-[12px] text-[#4A4A4A]">
                          {formatDate(payment.createdAt)}
                        </span>
                      </div>

                      {payment.provider && (
                        <p className="mt-2 text-[11px] text-[#8A847B]">
                          {payment.provider} · Percobaan pembayaran{' '}
                          {payment.attempt}
                        </p>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        </div>
      </aside>
    </div>
  );
}
