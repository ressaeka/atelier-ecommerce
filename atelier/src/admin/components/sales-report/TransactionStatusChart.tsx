import { memo } from 'react';
import type { OrderStatus } from '../../../types/api';
import { ADMIN_ORDER_STATUS_META } from '../AdminOrdersTable';
import { numberFormatter } from './salesReportUtils';

export interface StatusTotals {
  succeeded: number;
  pending: number;
  cancelledOrExpired: number;
  total: number;
  succeededPct: number;
  pendingPct: number;
  cancelledPct: number;
}

interface TransactionStatusChartProps {
  statusDistribution: Record<OrderStatus, number>;
  statusTotals: StatusTotals;
}

const ORDERED_STATUSES: OrderStatus[] = [
  'PAID',
  'PROCESSING',
  'SHIPPED',
  'DELIVERED',
  'PENDING',
  'CANCELLED',
  'EXPIRED',
];

const RECOGNIZED_STATUS_SET = new Set<OrderStatus>([
  'DELIVERED',
]);

export const TransactionStatusChart = memo(function TransactionStatusChart({
  statusDistribution,
  statusTotals,
}: TransactionStatusChartProps) {
  return (
    <div className="flex h-full flex-col justify-between rounded-2xl border border-[#ECE7DE] bg-white p-5 shadow-[0_1px_3px_rgba(26,22,18,0.04)] sm:p-6">
      <div>
        <h2 className="text-[17px] font-semibold tracking-tight text-[#1A1A1A]">
          Status Transaksi
        </h2>
        <p className="mt-0.5 text-[12.5px] text-[#6F6A62]">
          {numberFormatter.format(statusTotals.total)} transaksi tercatat pada
          periode ini
        </p>

        {/* Stacked Proportion Bar */}
        <div className="mt-4 flex h-2.5 w-full overflow-hidden rounded-full bg-[#F1ECE4]">
          {statusTotals.succeededPct > 0 && (
            <div
              style={{ width: `${statusTotals.succeededPct}%` }}
              className="bg-[#2F7A4F]"
              title={`Berhasil: ${statusTotals.succeeded}`}
            />
          )}
          {statusTotals.pendingPct > 0 && (
            <div
              style={{ width: `${statusTotals.pendingPct}%` }}
              className="bg-[#9A5B14]"
              title={`Menunggu Pembayaran: ${statusTotals.pending}`}
            />
          )}
          {statusTotals.cancelledPct > 0 && (
            <div
              style={{ width: `${statusTotals.cancelledPct}%` }}
              className="bg-[#B4382E]"
              title={`Dibatalkan / Kedaluwarsa: ${statusTotals.cancelledOrExpired}`}
            />
          )}
        </div>

        {/* 3 High-Level Group Summary */}
        <div className="mt-3.5 grid grid-cols-3 gap-2">
          <div className="rounded-xl border border-[#ECE7DE] bg-[#FAF8F4] px-2.5 py-2">
            <div className="flex items-center gap-1.5 text-[11px] font-medium text-[#2F7A4F]">
              <span className="h-2 w-2 rounded-full bg-[#2F7A4F]" />
              <span>Berhasil</span>
            </div>
            <p className="mt-1 text-[16px] font-bold tabular-nums text-[#1A1A1A]">
              {numberFormatter.format(statusTotals.succeeded)}
            </p>
          </div>

          <div className="rounded-xl border border-[#ECE7DE] bg-[#FAF8F4] px-2.5 py-2">
            <div className="flex items-center gap-1.5 text-[11px] font-medium text-[#9A5B14]">
              <span className="h-2 w-2 rounded-full bg-[#9A5B14]" />
              <span>Pending</span>
            </div>
            <p className="mt-1 text-[16px] font-bold tabular-nums text-[#1A1A1A]">
              {numberFormatter.format(statusTotals.pending)}
            </p>
          </div>

          <div className="rounded-xl border border-[#ECE7DE] bg-[#FAF8F4] px-2.5 py-2">
            <div className="flex items-center gap-1.5 text-[11px] font-medium text-[#B4382E]">
              <span className="h-2 w-2 rounded-full bg-[#B4382E]" />
              <span>Batal</span>
            </div>
            <p className="mt-1 text-[16px] font-bold tabular-nums text-[#1A1A1A]">
              {numberFormatter.format(statusTotals.cancelledOrExpired)}
            </p>
          </div>
        </div>

        {/* Detailed Per-Status List */}
        <ul className="mt-3.5 space-y-1.5">
          {ORDERED_STATUSES.map((st) => {
            const count = statusDistribution[st] ?? 0;
            const metaItem = ADMIN_ORDER_STATUS_META[st];
            const isRecognized = RECOGNIZED_STATUS_SET.has(st);
            return (
              <li
                key={st}
                className="flex items-center justify-between rounded-lg px-2.5 py-1.5 text-[12px] hover:bg-[#FAF8F4]"
              >
                <span className="flex items-center gap-2 font-medium text-[#3F3B36]">
                  <span
                    className={`h-2 w-2 rounded-full ${metaItem?.dotClassName ?? 'bg-gray-400'}`}
                  />
                  <span>{metaItem?.label ?? st}</span>
                  {isRecognized && (
                    <span className="rounded bg-[#E7F3EC] px-1.5 py-0.5 text-[10px] font-semibold text-[#2F7A4F]">
                      Diakui
                    </span>
                  )}
                </span>
                <span className="font-semibold tabular-nums text-[#1A1A1A]">
                  {numberFormatter.format(count)}
                </span>
              </li>
            );
          })}
        </ul>
      </div>

      <div className="mt-3 rounded-xl border border-[#ECE7DE] bg-[#FAF8F4] p-3 text-[11.5px] leading-relaxed text-[#6F6A62]">
        Transaksi berhasil mencakup status <strong>Dibayar</strong>,{' '}
        <strong>Diproses</strong>, <strong>Dikirim</strong>, dan{' '}
        <strong>Selesai</strong>.
      </div>
    </div>
  );
});
