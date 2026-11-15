
import { ArrowRight, ShoppingCart } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { AdminRecentOrder } from '../data/adminDashboardMockData';
import {
  CardFooter,
  CardHeader,
  StatusBadge,
  formatPrice,
} from './ui/AdminPrimitives';

interface RecentOrdersProps {
  orders: AdminRecentOrder[];
  totalOrdersCount?: number;
  toShipCount?: number;
}

export default function RecentOrders({
  orders,
  totalOrdersCount,
  toShipCount,
}: RecentOrdersProps) {
  const totalCount =
    typeof totalOrdersCount === 'number' && totalOrdersCount >= orders.length
      ? totalOrdersCount
      : orders.length;

  const computedToShip =
    typeof toShipCount === 'number'
      ? toShipCount
      : orders.filter(
          (o) => o.status === 'Dibayar' || o.status === 'Diproses',
        ).length;

  return (
    <section
      aria-labelledby="recent-orders-title"
      className="flex h-full min-w-0 flex-col rounded-2xl border border-[#ECE7DE] bg-white p-5 shadow-[0_1px_3px_rgba(26,22,18,0.04)]"
    >
      <CardHeader
        id="recent-orders-title"
        icon={ShoppingCart}
        title="Pesanan Terbaru"
        subtitle={`${orders.length} pesanan terakhir`}
        scope="Semua status · 5 terakhir"
        rightSlot={
          <Link
            to="/admin/orders"
            className="group inline-flex min-h-[36px] items-center gap-1 rounded-md px-1 text-[13px] font-semibold text-[#5C4033] transition-colors hover:text-[#3D2920] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5C4033]"
          >
            Lihat semua
            <ArrowRight
              className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5"
              aria-hidden="true"
            />
          </Link>
        }
      />

      {/* Order list - aligned to the top */}
      <div className="flex min-h-0 flex-1 flex-col justify-start">
        {orders.length === 0 ? (
          <div className="flex flex-1 items-center justify-center rounded-xl border border-dashed border-[#ECE7DE] bg-[#FAF8F4] px-4 py-10 text-center text-[13px] text-[#6F6A62]">
            Belum ada pesanan terbaru.
          </div>
        ) : (
          <ul className="divide-y divide-[#ECE7DE]">
            {orders.map((order) => (
              <li key={order.id}>
                <Link
                  to="/admin/orders"
                  className="-mx-2 flex items-center justify-between gap-3 rounded-xl px-2 py-2.5 transition-colors hover:bg-[#FAF8F4] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5C4033]"
                >
                  <span className="w-[70px] shrink-0 font-sans text-[13.5px] font-bold tabular-nums text-[#5C4033] underline-offset-2 hover:underline">
                    {order.orderNumber}
                  </span>

                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13.5px] font-semibold text-[#1A1A1A]">
                      {order.customerName}
                    </p>
                    <p className="mt-0.5 truncate font-sans text-[12px] tabular-nums text-[#6F6A62]">
                      {order.dateLabel}
                    </p>
                  </div>

                  <div className="shrink-0">
                    <StatusBadge status={order.status} />
                  </div>

                  <span className="w-[96px] shrink-0 text-right font-sans text-[13.5px] font-bold tabular-nums text-[#1A1A1A]">
                    {formatPrice(order.total)}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>

      <CardFooter
        left={`Menampilkan ${orders.length} dari ${totalCount} pesanan`}
        right={
          <strong className="font-sans font-bold tabular-nums text-[#1A1A1A]">
            {computedToShip} perlu dikirim
          </strong>
        }
      />
    </section>
  );
}
