import { useMemo, useState } from 'react';
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

const FILTER_OPTIONS = [
  {
    value: '7d',
    label: '7 Hari Terakhir',
    days: 7,
  },
  {
    value: '30d',
    label: '30 Hari Terakhir',
    days: 30,
  },
  {
    value: '3m',
    label: '3 Bulan',
    days: 90,
  },
] as const;

type FilterValue = (typeof FILTER_OPTIONS)[number]['value'];

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
  const [filter, setFilter] = useState<FilterValue>('7d');

  const selectedFilter = FILTER_OPTIONS.find(
    (option) => option.value === filter,
  );

  const chartData = useMemo(() => {
    if (!selectedFilter) {
      return data;
    }

    return data.slice(-selectedFilter.days);
  }, [data, selectedFilter]);

  return (
    <section className="flex h-full flex-col rounded-2xl border border-[#E8E4DC] bg-white p-5 shadow-[0_1px_2px_rgba(26,26,26,0.03)] sm:p-6">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-editorial text-[18px] font-medium tracking-tight text-[#1A1A1A]">
          Grafik Penjualan
        </h2>

        <div className="relative">
          <select
            value={filter}
            onChange={(event) =>
              setFilter(event.target.value as FilterValue)
            }
            aria-label="Filter rentang grafik penjualan"
            className="h-9 appearance-none rounded-xl border border-[#E8E4DC] bg-[#FAFAF8] pl-3.5 pr-8 text-[12px] font-medium text-[#4A4A4A] focus:border-[#B7C9D9] focus:outline-none"
          >
            {FILTER_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>

          <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-[#8A847B]">
            ▼
          </span>
        </div>
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
                fontFamily: 'Inter, sans-serif',
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