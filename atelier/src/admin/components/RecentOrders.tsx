import { Link } from 'react-router-dom';
import {
  ADMIN_ORDER_STATUS_META,
  type AdminRecentOrder,
} from '../data/adminDashboardMockData';
import { formatPrice } from '../../lib/utils';

interface RecentOrdersProps {
  orders: AdminRecentOrder[];
}

function StatusBadge({ status }: { status: AdminRecentOrder['status'] }) {
  const meta = ADMIN_ORDER_STATUS_META[status];

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium ${meta.className}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${meta.dotClassName}`} />
      {status}
    </span>
  );
}

export default function RecentOrders({ orders }: RecentOrdersProps) {
  return (
    <section className="flex h-full flex-col rounded-2xl border border-[#E8E4DC] bg-white p-5 shadow-[0_1px_2px_rgba(26,26,26,0.03)] sm:p-6">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-editorial text-[18px] font-medium tracking-tight text-[#1A1A1A]">
          Pesanan Terbaru
        </h2>
        <Link
          to="/admin/orders"
          className="text-[11px] font-semibold uppercase tracking-[0.1em] text-[#4A7BA8] transition-colors hover:text-[#2F5D86]"
        >
          Lihat Semua
        </Link>
      </div>

      <ul className="flex-1 space-y-3">
        {orders.length === 0 && (
          <li className="rounded-xl border border-dashed border-[#E8E4DC] bg-[#FCFBF9] px-4 py-8 text-center text-[12px] text-[#8A847B]">
            Belum ada pesanan terbaru.
          </li>
        )}
        {orders.map((order) => (
          <li
            key={order.id}
            className="flex items-start gap-3 rounded-xl border border-[#F0EDE7] bg-[#FCFBF9] p-3.5 transition-colors hover:border-[#D9E3EC] hover:bg-white"
          >
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                <span className="font-editorial text-[14px] font-semibold text-[#1A1A1A]">
                  {order.orderNumber}
                </span>
                <StatusBadge status={order.status} />
              </div>
              <p className="mt-1 text-[12.5px] text-[#4A4A4A]">
                {order.customerName}
              </p>
              <p className="mt-0.5 text-[11px] text-[#8A847B]">
                {order.dateLabel}
              </p>
            </div>
            <p className="shrink-0 text-right text-[13px] font-semibold text-[#1A1A1A]">
              {formatPrice(order.total)}
            </p>
          </li>
        ))}
      </ul>
    </section>
  );
}
