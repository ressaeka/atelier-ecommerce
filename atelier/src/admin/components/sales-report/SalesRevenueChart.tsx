import { memo } from 'react';
import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { formatPrice } from '../../../lib/utils';
import { formatCompactRp, numberFormatter } from './salesReportUtils';

export interface SalesChartPoint {
  bucket: string;
  label: string;
  fullLabel: string;
  revenue: number;
  orderCount: number;
  completedOrderCount: number;
  itemsSold: number;
}

export interface GranularityMeta {
  title: string;
  subtitle: string;
  badge: string;
}

interface SalesRevenueChartProps {
  chartSeries: SalesChartPoint[];
  hasChartRevenue: boolean;
  granularityMeta: GranularityMeta;
  periodDisplayLabel: string;
}

const CHART_MARGIN = { top: 10, right: 8, left: 0, bottom: 0 };
const X_AXIS_TICK = {
  fill: '#6F6A62',
  fontSize: 11,
  fontFamily: 'Poppins, system-ui, sans-serif',
};
const Y_AXIS_REVENUE_TICK = {
  fill: '#6F6A62',
  fontSize: 11,
  fontFamily: 'Poppins, system-ui, sans-serif',
};
const Y_AXIS_ORDERS_TICK = {
  fill: '#A39D93',
  fontSize: 11,
  fontFamily: 'Poppins, system-ui, sans-serif',
};
const TOOLTIP_STYLE = {
  borderRadius: 12,
  border: '1px solid #ECE7DE',
  backgroundColor: '#FFFFFF',
  boxShadow: '0 8px 24px rgba(26,22,18,0.08)',
  fontSize: 12,
  fontFamily: 'Poppins, system-ui, sans-serif',
};
const BAR_RADIUS: [number, number, number, number] = [5, 5, 0, 0];
const LINE_DOT = { r: 3, fill: '#5C4033', strokeWidth: 0 };
const LINE_ACTIVE_DOT = {
  r: 5,
  fill: '#5C4033',
  stroke: '#FFFFFF',
  strokeWidth: 2,
};

function formatTooltipLabel(
  _: unknown,
  payload?: ReadonlyArray<{ payload?: { fullLabel?: string } }>,
): string {
  return payload?.[0]?.payload?.fullLabel ?? '';
}

function formatTooltipValue(
  value: number | string,
  name: string,
): [string, string] {
  if (name === 'Pendapatan') {
    return [formatPrice(Number(value)), 'Pendapatan Diakui'];
  }
  return [
    `${numberFormatter.format(Number(value))} pesanan`,
    'Transaksi Berhasil',
  ];
}

export const SalesRevenueChart = memo(function SalesRevenueChart({
  chartSeries,
  hasChartRevenue,
  granularityMeta,
  periodDisplayLabel,
}: SalesRevenueChartProps) {
  return (
    <div className="flex flex-col justify-between rounded-2xl border border-[#ECE7DE] bg-white p-5 shadow-[0_1px_3px_rgba(26,22,18,0.04)] sm:p-6 xl:col-span-2">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-2.5">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-[17px] font-semibold tracking-tight text-[#1A1A1A]">
              {granularityMeta.title}
            </h2>
            <span className="rounded-md border border-[#ECE7DE] bg-[#FAF8F4] px-2 py-0.5 text-[11px] font-medium text-[#5C4033]">
              {granularityMeta.badge}
            </span>
          </div>
          <p className="mt-0.5 text-[12.5px] text-[#6F6A62]">
            {granularityMeta.subtitle}
          </p>
        </div>

        <div className="flex items-center gap-4 text-[12px] font-medium text-[#6F6A62]">
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-sm bg-[#5C4033]" />
            Pendapatan (Rp)
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-sm bg-[#D8CFC2]" />
            Transaksi Berhasil
          </span>
        </div>
      </div>

      <div className="h-[290px] w-full">
        {chartSeries.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center rounded-xl border border-dashed border-[#ECE7DE] bg-[#FAF8F4] p-6 text-center">
            <p className="text-[13.5px] font-semibold text-[#3F3B36]">
              Data grafik tren tidak tersedia
            </p>
            <p className="mt-1 text-[12px] text-[#6F6A62]">
              Silakan sesuaikan filter periode atau muat ulang halaman.
            </p>
          </div>
        ) : !hasChartRevenue ? (
          <div className="flex h-full flex-col items-center justify-center rounded-xl border border-dashed border-[#ECE7DE] bg-[#FAF8F4] p-6 text-center">
            <p className="text-[14px] font-semibold text-[#1A1A1A]">
              Tidak ada transaksi pada periode ini (Rp 0 · 0 pesanan)
            </p>
            <p className="mt-1 max-w-md text-[12px] leading-relaxed text-[#6F6A62]">
              Belum ada pendapatan yang diakui pada rentang{' '}
              <strong>{periodDisplayLabel}</strong>. Grafik menampilkan kondisi
              aktual tanpa data sintetis.
            </p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={chartSeries} margin={CHART_MARGIN}>
              <CartesianGrid stroke="#F1ECE4" vertical={false} />
              <XAxis
                dataKey="label"
                axisLine={false}
                tickLine={false}
                tick={X_AXIS_TICK}
                dy={6}
              />
              <YAxis
                yAxisId="revenue"
                axisLine={false}
                tickLine={false}
                tick={Y_AXIS_REVENUE_TICK}
                tickFormatter={formatCompactRp}
                width={72}
              />
              <YAxis
                yAxisId="orders"
                orientation="right"
                axisLine={false}
                tickLine={false}
                allowDecimals={false}
                tick={Y_AXIS_ORDERS_TICK}
                width={28}
              />
              <Tooltip
                contentStyle={TOOLTIP_STYLE}
                labelFormatter={formatTooltipLabel}
                formatter={formatTooltipValue}
              />
              <Bar
                yAxisId="orders"
                dataKey="completedOrderCount"
                name="Transaksi Berhasil"
                fill="#E6DEC8"
                radius={BAR_RADIUS}
                maxBarSize={24}
                isAnimationActive={false}
              />
              <Line
                yAxisId="revenue"
                type="monotone"
                dataKey="revenue"
                name="Pendapatan"
                stroke="#5C4033"
                strokeWidth={2.5}
                dot={LINE_DOT}
                activeDot={LINE_ACTIVE_DOT}
                isAnimationActive={false}
              />
            </ComposedChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
});
