import { memo } from 'react';
import {
  Minus,
  PackageCheck,
  ShoppingBag,
  TrendingDown,
  TrendingUp,
  Wallet,
} from 'lucide-react';
import { formatPrice } from '../../../lib/utils';
import type {
  SalesReportKpiComparison,
  SalesReportResponse,
  SalesReportSummary,
} from '../../../types/api';
import { numberFormatter, pctFormatter } from './salesReportUtils';

interface KpiComparisonBadgeProps {
  metric?: SalesReportKpiComparison;
  comparisonLabel: string;
}

const KpiComparisonBadge = memo(function KpiComparisonBadge({
  metric,
  comparisonLabel,
}: KpiComparisonBadgeProps) {
  if (
    !metric ||
    !metric.comparisonAvailable ||
    metric.percentageChange === null
  ) {
    return (
      <div className="mt-2.5 flex flex-wrap items-center gap-1.5 text-[11.5px] text-[#6F6A62]">
        <span className="inline-flex shrink-0 items-center gap-1 rounded-md bg-[#F4EFE8] px-1.5 py-0.5 font-medium text-[#6F6A62]">
          <Minus className="h-3 w-3 shrink-0" aria-hidden="true" />
          <span>Baseline kosong</span>
        </span>
        <span className="text-[11px] text-[#6F6A62]">
          {comparisonLabel || 'Belum ada data pembanding'}
        </span>
      </div>
    );
  }

  const absPct = pctFormatter.format(Math.abs(metric.percentageChange));

  if (metric.trend === 'UP') {
    return (
      <div className="mt-2.5 flex items-center gap-1.5 text-[11.5px]">
        <span className="inline-flex shrink-0 items-center gap-1 rounded-md bg-[#E7F3EC] px-1.5 py-0.5 font-semibold tabular-nums text-[#2F7A4F]">
          <TrendingUp className="h-3 w-3" aria-hidden="true" />+{absPct}%
        </span>
        <span className="truncate text-[#6F6A62]">{comparisonLabel}</span>
      </div>
    );
  }

  if (metric.trend === 'DOWN') {
    return (
      <div className="mt-2.5 flex items-center gap-1.5 text-[11.5px]">
        <span className="inline-flex shrink-0 items-center gap-1 rounded-md bg-[#FBECEA] px-1.5 py-0.5 font-semibold tabular-nums text-[#B4382E]">
          <TrendingDown className="h-3 w-3" aria-hidden="true" />-{absPct}%
        </span>
        <span className="truncate text-[#6F6A62]">{comparisonLabel}</span>
      </div>
    );
  }

  return (
    <div className="mt-2.5 flex items-center gap-1.5 text-[11.5px]">
      <span className="inline-flex shrink-0 items-center gap-1 rounded-md bg-[#F4EFE8] px-1.5 py-0.5 font-semibold tabular-nums text-[#6F6A62]">
        <Minus className="h-3 w-3" aria-hidden="true" />
        Stabil (0%)
      </span>
      <span className="truncate text-[#6F6A62]">{comparisonLabel}</span>
    </div>
  );
});

interface SalesReportKpiProps {
  summary: SalesReportSummary;
  kpis?: SalesReportResponse['kpis'];
  comparisonLabel: string;
}

export const SalesReportKpi = memo(function SalesReportKpi({
  summary,
  kpis,
  comparisonLabel,
}: SalesReportKpiProps) {
  return (
    <section
      aria-label="Ringkasan KPI Pendapatan"
      className="grid grid-cols-2 gap-3 lg:grid-cols-4"
    >
      {/* KPI 1: Total Pendapatan */}
      <article className="flex min-h-[146px] flex-col justify-between rounded-2xl border border-[#ECE7DE] bg-white p-4 shadow-[0_1px_3px_rgba(26,22,18,0.04)] sm:p-5">
        <div>
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#F4EFE8] text-[#5C4033]">
                <Wallet size={16} strokeWidth={1.8} aria-hidden="true" />
              </span>
              <h2 className="text-[13px] font-medium text-[#3F3B36]">
                Total Pendapatan
              </h2>
            </div>
          </div>

          <p className="mt-3 text-[24px] font-semibold leading-tight tracking-tight tabular-nums text-[#1A1A1A] min-[1440px]:text-[30px]">
            {formatPrice(summary.totalRevenue)}
          </p>
          <p className="mt-1 text-[11.5px] text-[#6F6A62]">
            Pendapatan bersih penjualan setelah pengurangan
          </p>
        </div>

        <KpiComparisonBadge
          metric={kpis?.totalRevenue}
          comparisonLabel={comparisonLabel}
        />
      </article>

      {/* KPI 2: Total Transaksi Berhasil */}
      <article className="flex min-h-[146px] flex-col justify-between rounded-2xl border border-[#ECE7DE] bg-white p-4 shadow-[0_1px_3px_rgba(26,22,18,0.04)] sm:p-5">
        <div>
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#E7F3EC] text-[#2F7A4F]">
                <PackageCheck size={16} strokeWidth={1.8} aria-hidden="true" />
              </span>
              <h2 className="text-[13px] font-medium text-[#3F3B36]">
                Total Transaksi Berhasil
              </h2>
            </div>
          </div>

          <p className="mt-3 text-[24px] font-semibold leading-tight tracking-tight tabular-nums text-[#1A1A1A] min-[1440px]:text-[30px]">
            {numberFormatter.format(summary.completedOrders)}{' '}
            <span className="text-[13.5px] font-medium text-[#6F6A62]">
              pesanan
            </span>
          </p>
          <p className="mt-1 text-[11.5px] text-[#6F6A62]">
            Dari {numberFormatter.format(summary.totalOrders)} total transaksi
            pada periode ini
          </p>
        </div>

        <KpiComparisonBadge
          metric={kpis?.completedOrders}
          comparisonLabel={comparisonLabel}
        />
      </article>

      {/* KPI 3: Rata-rata Nilai Transaksi (AOV) */}
      <article className="flex min-h-[146px] flex-col justify-between rounded-2xl border border-[#ECE7DE] bg-white p-4 shadow-[0_1px_3px_rgba(26,22,18,0.04)] sm:p-5">
        <div>
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#FBF1E1] text-[#9A5B14]">
                <TrendingUp size={16} strokeWidth={1.8} aria-hidden="true" />
              </span>
              <h2 className="text-[13px] font-medium text-[#3F3B36]">
                Rata-rata Nilai Transaksi
              </h2>
            </div>
          </div>

          <p className="mt-3 text-[24px] font-semibold leading-tight tracking-tight tabular-nums text-[#1A1A1A] min-[1440px]:text-[30px]">
            {formatPrice(summary.averageOrderValue)}
          </p>
          <p className="mt-1 text-[11.5px] text-[#6F6A62]">
            Rata-rata nilai pendapatan per pesanan berhasil
          </p>
        </div>

        <KpiComparisonBadge
          metric={kpis?.averageOrderValue}
          comparisonLabel={comparisonLabel}
        />
      </article>

      {/* KPI 4: Total Produk Terjual */}
      <article className="flex min-h-[146px] flex-col justify-between rounded-2xl border border-[#ECE7DE] bg-white p-4 shadow-[0_1px_3px_rgba(26,22,18,0.04)] sm:p-5">
        <div>
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#F4EFE8] text-[#5C4033]">
                <ShoppingBag size={16} strokeWidth={1.8} aria-hidden="true" />
              </span>
              <h2 className="text-[13px] font-medium text-[#3F3B36]">
                Total Produk Terjual
              </h2>
            </div>
          </div>

          <p className="mt-3 text-[24px] font-semibold leading-tight tracking-tight tabular-nums text-[#1A1A1A] min-[1440px]:text-[30px]">
            {numberFormatter.format(summary.totalItemsSold)}{' '}
            <span className="text-[13.5px] font-medium text-[#6F6A62]">
              unit
            </span>
          </p>
          <p className="mt-1 text-[11.5px] text-[#6F6A62]">
            Dari {numberFormatter.format(summary.uniqueProductsSold ?? 0)} jenis
            produk terjual
          </p>
        </div>

        <KpiComparisonBadge
          metric={kpis?.totalItemsSold}
          comparisonLabel={comparisonLabel}
        />
      </article>
    </section>
  );
});
