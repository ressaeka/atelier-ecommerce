import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import type { AdminSalesPoint } from '../data/adminDashboardMockData';

interface SalesChartProps {
  data: AdminSalesPoint[];
}

const SALES_CHART_DAYS = 7;

function formatCompactRp(value: number): string {
  if (value >= 1_000_000) {
    return `${(value / 1_000_000).toFixed(
      value % 1_000_000 === 0 ? 0 : 1,
    )} jt`;
  }

  if (value >= 1_000) {
    return `${Math.round(value / 1_000)} rb`;
  }

  return String(value);
}

function formatFullRp(value: number): string {
  return `Rp ${new Intl.NumberFormat('id-ID').format(value)}`;
}

export default function SalesChart({ data }: SalesChartProps) {
  const chartData = data.slice(-SALES_CHART_DAYS);

  return (
    <section className="flex h-full flex-col rounded-2xl border border-[#E8E4DC] bg-white p-5 shadow-[0_1px_2px_rgba(26,26,26,0.03)] sm:p-6">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-editorial text-[18px] font-medium tracking-tight text-[#1A1A1A]">
          Grafik Penjualan
        </h2>

        <span
          aria-label="Rentang grafik penjualan"
          className="inline-flex h-9 items-center rounded-xl border border-[#E8E4DC] bg-[#FAFAF8] px-3.5 text-[12px] font-medium text-[#4A4A4A]"
        >
          7 Hari Terakhir
        </span>
      </div>

      <div className="h-[280px] w-full sm:h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={chartData}
            margin={{
              top: 8,
              right: 8,
              left: 0,
              bottom: 0,
            }}
          >
            <defs>
              <linearGradient
                id="salesGradient"
                x1="0"
                y1="0"
                x2="0"
                y2="1"
              >
                <stop
                  offset="0%"
                  stopColor="#6B8FAD"
                  stopOpacity={0.28}
                />

                <stop
                  offset="100%"
                  stopColor="#6B8FAD"
                  stopOpacity={0.02}
                />
              </linearGradient>
            </defs>

            <CartesianGrid
              stroke="#EDEAE3"
              strokeDasharray="0"
              vertical={false}
            />

            <XAxis
              dataKey="label"
              axisLine={false}
              tickLine={false}
              tick={{
                fill: '#8A847B',
                fontSize: 11,
              }}
              dy={8}
            />

            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{
                fill: '#8A847B',
                fontSize: 11,
              }}
              tickFormatter={formatCompactRp}
              width={64}
            />

            <Tooltip
              cursor={{
                stroke: '#C5D5E2',
                strokeWidth: 1,
              }}
              contentStyle={{
                borderRadius: 12,
                border: '1px solid #E8E4DC',
                boxShadow: '0 8px 24px rgba(26,26,26,0.06)',
                fontSize: 12,
                fontFamily: 'Poppins, system-ui, -apple-system, sans-serif',
              }}
              formatter={(value: number | string) => [
                formatFullRp(Number(value)),
                'Pendapatan',
              ]}
              labelStyle={{
                color: '#1A1A1A',
                fontWeight: 600,
              }}
            />

            <Area
              type="monotone"
              dataKey="revenue"
              stroke="#5B87A8"
              strokeWidth={2}
              fill="url(#salesGradient)"
              dot={false}
              activeDot={{
                r: 4,
                fill: '#5B87A8',
                strokeWidth: 2,
                stroke: '#fff',
              }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}