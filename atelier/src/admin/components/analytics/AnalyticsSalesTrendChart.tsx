import { useMemo } from 'react';
import {
  Area,
  Bar,
  CartesianGrid,
  ComposedChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { TrendingUp } from 'lucide-react';
import type {
  AnalyticsPreset,
  AnalyticsSalesTrendPoint,
} from '../../types/analytics';
import { CardHeader } from '../ui/AdminPrimitives';

interface AnalyticsSalesTrendChartProps {
  data: AnalyticsSalesTrendPoint[] | null | undefined;
  preset: AnalyticsPreset;
  onSelectPreset?: (preset: '7d' | '30d' | '1y') => void;
}

const numberFormatter = new Intl.NumberFormat('id-ID');
const millionFormatter = new Intl.NumberFormat('id-ID', {
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});

function formatCompactRp(value: number): string {
  if (value === 0) return 'Rp 0';
  if (value >= 1_000_000_000) {
    return `Rp ${millionFormatter.format(value / 1_000_000_000)} M`;
  }
  if (value >= 1_000_000) {
    return `Rp ${millionFormatter.format(value / 1_000_000)} jt`;
  }
  if (value >= 1_000) {
    return `Rp ${Math.round(value / 1_000)} rb`;
  }
  return `Rp ${value}`;
}

function formatFullRp(value: number): string {
  return `Rp ${numberFormatter.format(value)}`;
}

const MONTH_ID_SHORT = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'Mei',
  'Jun',
  'Jul',
  'Agu',
  'Sep',
  'Okt',
  'Nov',
  'Des',
];

function formatBucketFullDate(
  dateStr: string | undefined,
  fallbackLabel: string,
): string {
  if (!dateStr || typeof dateStr !== 'string') return fallbackLabel;
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    const year = parts[0];
    const mIdx = parseInt(parts[1], 10) - 1;
    const day = parseInt(parts[2], 10);
    return `${day} ${MONTH_ID_SHORT[mIdx] ?? parts[1]} ${year}`;
  }
  return fallbackLabel;
}

function getSubtitleByPreset(preset: AnalyticsPreset): string {
  switch (preset) {
    case '7d':
      return 'Pendapatan dan jumlah pesanan per hari · 7 hari terakhir';
    case '1y':
      return 'Pendapatan dan jumlah pesanan per bulan · 1 tahun terakhir';
    case 'custom':
      return 'Pendapatan dan jumlah pesanan pada periode terpilih';
    case '30d':
    default:
      return 'Pendapatan dan jumlah pesanan per hari · 30 hari terakhir';
  }
}

interface CustomDotProps {
  cx?: number;
  cy?: number;
  payload?: AnalyticsSalesTrendPoint;
  index?: number;
}

function RevenuePeakDot({ cx, cy, payload, index }: CustomDotProps) {
  if (
    typeof cx !== 'number' ||
    typeof cy !== 'number' ||
    !payload ||
    payload.revenue <= 0
  ) {
    return <g key={`empty-dot-${index ?? 0}`} />;
  }
  return (
    <circle
      key={`dot-${payload.date ?? index ?? 0}`}
      cx={cx}
      cy={cy}
      r={4.5}
      fill="#FAF8F4"
      stroke="#5C4033"
      strokeWidth={2.5}
    />
  );
}

export default function AnalyticsSalesTrendChart({
  data,
  preset,
}: AnalyticsSalesTrendChartProps) {
  const isDataMissing = !Array.isArray(data) || data.length === 0;
  const safeData = Array.isArray(data) ? data : [];
  const hasAnyTransactions = safeData.some(
    (d) => d.revenue > 0 || d.orders > 0,
  );

  const peakInfo = useMemo(() => {
    if (!hasAnyTransactions || safeData.length === 0) return null;
    let maxIdx = 0;
    for (let i = 1; i < safeData.length; i += 1) {
      if (safeData[i].revenue > safeData[maxIdx].revenue) {
        maxIdx = i;
      }
    }
    const point = safeData[maxIdx];
    if (!point || point.revenue <= 0) return null;
    const ratio = safeData.length > 1 ? maxIdx / (safeData.length - 1) : 0.5;
    return {
      point,
      ratio,
      dateLabel: formatBucketFullDate(point.date, point.label),
    };
  }, [safeData, hasAnyTransactions]);

  const maxRevenue = useMemo(
    () => safeData.reduce((max, d) => Math.max(max, d.revenue), 0),
    [safeData],
  );

  const revenueAxisMax = useMemo(() => {
    if (maxRevenue <= 0) return 1_400_000;
    if (maxRevenue <= 1_400_000) return 1_400_000;
    const step = Math.pow(10, Math.floor(Math.log10(maxRevenue)) - 1);
    return Math.ceil((maxRevenue * 1.15) / step) * step;
  }, [maxRevenue]);

  const revenueTicks = useMemo(
    () => [
      0,
      Math.round(revenueAxisMax * 0.25),
      Math.round(revenueAxisMax * 0.5),
      Math.round(revenueAxisMax * 0.75),
      revenueAxisMax,
    ],
    [revenueAxisMax],
  );

  return (
    <section
      aria-labelledby="sales-trend-title"
      className="flex h-full min-h-[348px] flex-col rounded-2xl border border-[#ECE7DE] bg-white p-6 shadow-[0_1px_3px_rgba(26,22,18,0.04)]"
    >
      <CardHeader
        id="sales-trend-title"
        icon={TrendingUp}
        title="Tren Penjualan"
        scope="Periode aktif · pesanan valid"
        subtitle={getSubtitleByPreset(preset)}
        rightSlot={
          <div className="flex items-center gap-4 text-[12.5px] font-medium text-[#6F6A62]">
            <span className="inline-flex items-center gap-2">
              <span
                className="h-2.5 w-2.5 rounded-[3px] bg-[#5C4033]"
                aria-hidden="true"
              />
              Pendapatan
            </span>
            <span className="inline-flex items-center gap-2">
              <span
                className="h-2.5 w-2.5 rounded-[3px] bg-[#E3D5C4]"
                aria-hidden="true"
              />
              Pesanan
            </span>
          </div>
        }
      />

      {isDataMissing ? (
        <div className="flex flex-1 flex-col items-center justify-center rounded-xl border border-dashed border-[#ECE7DE] bg-[#FAF8F4] px-4 py-10 text-center">
          <p className="text-[13.5px] font-semibold text-[#3F3B36]">
            Data tren penjualan tidak tersedia
          </p>
          <p className="mt-1.5 max-w-[300px] text-[12.5px] text-[#6F6A62]">
            Rentang waktu ini belum memiliki seri data yang dapat ditampilkan.
          </p>
        </div>
      ) : !hasAnyTransactions ? (
        <div className="flex flex-1 flex-col items-center justify-center rounded-xl border border-dashed border-[#ECE7DE] bg-[#FAF8F4] px-4 py-10 text-center">
          <p className="text-[13.5px] font-semibold text-[#3F3B36]">
            Tidak ada transaksi pada periode ini (Rp 0 · 0 pesanan)
          </p>
          <p className="mt-1.5 max-w-[320px] text-[12.5px] text-[#6F6A62]">
            Seluruh hari pada periode terpilih mencatat nilai Rp 0. Grafik akan
            terisi otomatis saat ada pesanan berbayar.
          </p>
        </div>
      ) : (
        <div
          className="relative min-h-[256px] w-full flex-1"
          role="img"
          aria-label={`Grafik tren penjualan dan pesanan. Puncak pendapatan ${peakInfo ? `${formatFullRp(peakInfo.point.revenue)} pada ${peakInfo.dateLabel}` : 'Rp 0'}`}
        >
          {peakInfo && (
            <div
              className="pointer-events-none absolute top-3 z-10 hidden rounded-xl border border-[#ECE7DE] bg-white/95 px-3.5 py-2.5 shadow-[0_6px_20px_rgba(26,22,18,0.07)] sm:block"
              style={{
                left: `${Math.min(Math.max(peakInfo.ratio * 100 + 3, 18), 62)}%`,
              }}
            >
              <p className="font-sans text-[11.5px] font-semibold text-[#6F6A62]">
                {peakInfo.dateLabel}
              </p>
              <div className="mt-1.5 space-y-1 text-[12px]">
                <div className="flex items-center justify-between gap-4">
                  <span className="inline-flex items-center gap-1.5 text-[#3F3B36]">
                    <span className="h-2 w-2 rounded-full bg-[#5C4033]" />
                    Pendapatan
                  </span>
                  <span className="font-sans font-bold tabular-nums text-[#1A1A1A]">
                    {formatFullRp(peakInfo.point.revenue)}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <span className="inline-flex items-center gap-1.5 text-[#6F6A62]">
                    <span className="h-2 w-2 rounded-[2px] bg-[#E3D5C4]" />
                    Pesanan
                  </span>
                  <span className="font-sans font-bold tabular-nums text-[#1A1A1A]">
                    {numberFormatter.format(peakInfo.point.orders)}
                  </span>
                </div>
              </div>
            </div>
          )}

          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart
              data={safeData}
              margin={{ top: 10, right: 8, left: 4, bottom: 2 }}
            >
              <defs>
                <linearGradient
                  id="atelierRevenueGradient"
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >
                  <stop offset="0%" stopColor="#9A7458" stopOpacity={0.22} />
                  <stop offset="100%" stopColor="#9A7458" stopOpacity={0.0} />
                </linearGradient>
              </defs>

              <CartesianGrid
                stroke="#F1ECE4"
                strokeDasharray="3 3"
                vertical={false}
              />
              <XAxis
                dataKey="label"
                axisLine={{ stroke: '#ECE7DE' }}
                tickLine={false}
                interval={preset === '30d' ? 2 : 'preserveStartEnd'}
                tickMargin={8}
                tick={{ fill: '#6F6A62', fontSize: 11.5 }}
              />
              <YAxis
                yAxisId="revenue"
                axisLine={false}
                tickLine={false}
                width={78}
                domain={[0, revenueAxisMax]}
                ticks={revenueTicks}
                tickFormatter={formatCompactRp}
                tick={{ fill: '#6F6A62', fontSize: 11.5 }}
              />
              <YAxis
                yAxisId="orders"
                orientation="right"
                axisLine={false}
                tickLine={false}
                allowDecimals={false}
                domain={[0, (dataMax: number) => Math.max(dataMax + 2, 4)]}
                tickCount={5}
                width={28}
                tick={{ fill: '#A39D93', fontSize: 11.5 }}
              />
              <Tooltip
                contentStyle={{
                  borderRadius: 12,
                  border: '1px solid #ECE7DE',
                  backgroundColor: '#FFFFFF',
                  boxShadow: '0 8px 24px rgba(26,22,18,0.08)',
                  fontSize: 12,
                  fontFamily: 'var(--font-sans)',
                }}
                formatter={(value: number, name: string) => {
                  if (name === 'Pendapatan') {
                    return [formatFullRp(Number(value)), name];
                  }
                  return [
                    `${numberFormatter.format(Number(value))} pesanan`,
                    name,
                  ];
                }}
              />
              <Bar
                yAxisId="orders"
                dataKey="orders"
                name="Pesanan"
                fill="#E3D5C4"
                radius={[4, 4, 0, 0]}
                maxBarSize={20}
              />
              <Area
                yAxisId="revenue"
                type="linear"
                dataKey="revenue"
                name="Pendapatan"
                stroke="#5C4033"
                strokeWidth={2.25}
                fill="url(#atelierRevenueGradient)"
                dot={<RevenuePeakDot />}
                activeDot={{
                  r: 5,
                  fill: '#5C4033',
                  stroke: '#FFFFFF',
                  strokeWidth: 2,
                }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      )}
    </section>
  );
}
