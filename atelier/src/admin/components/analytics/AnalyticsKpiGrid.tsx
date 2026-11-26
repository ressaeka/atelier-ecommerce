import { Link } from 'react-router-dom';
import {
  CalendarCheck,
  Minus,
  Package,
  TrendingDown,
  TrendingUp,
  Users,
  Wallet,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type {
  AnalyticsKpiMetric,
  AnalyticsOverviewResponse,
} from '../../types/analytics';
import { ScopeLabel } from '../ui/AdminPrimitives';

interface AnalyticsKpiGridProps {
  kpis: AnalyticsOverviewResponse['kpis'];
  comparisonLabel: string;
  scopeLabel?: string;
}

interface KpiCardConfig {
  key: keyof AnalyticsOverviewResponse['kpis'];
  label: string;
  to: string;
  icon: LucideIcon;
  formatValue: (val: number) => string;
}

const numberFormatter = new Intl.NumberFormat('id-ID');
const pctFormatter = new Intl.NumberFormat('id-ID', {
  maximumFractionDigits: 1,
});

function formatRupiah(value: number): string {
  return `Rp ${numberFormatter.format(value)}`;
}

function formatCount(value: number): string {
  return numberFormatter.format(value);
}

const KPI_CARDS: KpiCardConfig[] = [
  {
    key: 'revenue',
    label: 'Total Pendapatan',
    to: '/admin/reports',
    icon: Wallet,
    formatValue: formatRupiah,
  },
  {
    key: 'orders',
    label: 'Total Pesanan',
    to: '/admin/orders',
    icon: CalendarCheck,
    formatValue: formatCount,
  },
  {
    key: 'productsSold',
    label: 'Produk Terjual',
    to: '/admin/reports/products',
    icon: Package,
    formatValue: formatCount,
  },
  {
    key: 'customers',
    label: 'Total Pelanggan',
    to: '/admin/reports/customers',
    icon: Users,
    formatValue: formatCount,
  },
];

function renderComparisonFooter(
  metric: AnalyticsKpiMetric,
  comparisonLabel: string,
) {
  if (!metric.comparisonAvailable || metric.percentageChange === null) {
    return (
      <div className="flex items-center gap-2">
        <span className="inline-flex shrink-0 items-center gap-1 rounded-md bg-[#F4EFE8] px-1.5 py-0.5 font-sans text-[11.5px] font-semibold text-[#6F6A62]">
          <Minus className="h-3 w-3" aria-hidden="true" />
          <span>Baseline kosong</span>
        </span>
        <span
          className="truncate text-[12px] text-[#6F6A62]"
          title="Belum ada data pembanding pada periode sebelumnya"
        >
          Belum ada data pembanding
        </span>
      </div>
    );
  }

  const absPct = pctFormatter.format(Math.abs(metric.percentageChange));

  if (metric.trend === 'UP') {
    return (
      <div className="flex items-center gap-2">
        <span className="inline-flex shrink-0 items-center gap-1 rounded-md bg-[#E7F3EC] px-1.5 py-0.5 font-sans text-[11.5px] font-semibold tabular-nums text-[#2F7A4F]">
          <TrendingUp className="h-3 w-3" aria-hidden="true" />
          <span className="sr-only">Naik</span>+{absPct}%
        </span>
        <span
          className="truncate text-[12px] text-[#6F6A62]"
          title={comparisonLabel}
        >
          {comparisonLabel}
        </span>
      </div>
    );
  }

  if (metric.trend === 'DOWN') {
    return (
      <div className="flex items-center gap-2">
        <span className="inline-flex shrink-0 items-center gap-1 rounded-md bg-[#FBECEA] px-1.5 py-0.5 font-sans text-[11.5px] font-semibold tabular-nums text-[#B4382E]">
          <TrendingDown className="h-3 w-3" aria-hidden="true" />
          <span className="sr-only">Turun</span>-{absPct}%
        </span>
        <span
          className="truncate text-[12px] text-[#6F6A62]"
          title={comparisonLabel}
        >
          {comparisonLabel}
        </span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <span className="inline-flex shrink-0 items-center gap-1 rounded-md bg-[#F4EFE8] px-1.5 py-0.5 font-sans text-[11.5px] font-semibold tabular-nums text-[#6F6A62]">
        <Minus className="h-3 w-3" aria-hidden="true" />
        <span className="sr-only">Stabil</span>0%
      </span>
      <span
        className="truncate text-[12px] text-[#6F6A62]"
        title={comparisonLabel}
      >
        {comparisonLabel}
      </span>
    </div>
  );
}

export default function AnalyticsKpiGrid({
  kpis,
  comparisonLabel,
  scopeLabel = 'Periode aktif',
}: AnalyticsKpiGridProps) {
  return (
    <section
      aria-label="Ringkasan KPI Business Analytics"
      className="admin-dashboard-kpi-grid xl:gap-6"
    >
      {KPI_CARDS.map((cfg) => {
        const metric = kpis[cfg.key];
        const Icon = cfg.icon;

        return (
          <Link
            key={cfg.key}
            to={cfg.to}
            className="admin-dashboard-kpi-card group flex min-h-[126px] flex-col justify-between rounded-2xl border border-[#ECE7DE] bg-white p-4 min-[1440px]:p-5 shadow-[0_1px_3px_rgba(26,22,18,0.04)] transition-colors hover:border-[#DED6C8] hover:bg-[#FAF8F4]/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5C4033]/40"
          >
            <div className="flex items-center justify-between gap-2">
              <div className="flex min-w-0 items-center gap-2.5">
                <div
                  className="flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-lg bg-[#F4EFE8] text-[#5C4033]"
                  aria-hidden="true"
                >
                  <Icon className="h-4 w-4" strokeWidth={1.75} />
                </div>
                <h3
                  className="truncate text-[13px] font-medium text-[#3F3B36] transition-colors group-hover:text-[#1A1A1A]"
                  title={cfg.label}
                >
                  {cfg.label}
                </h3>
              </div>
              <ScopeLabel className="hidden shrink-0 min-[1680px]:inline-flex">
                {scopeLabel}
              </ScopeLabel>
            </div>

            <div className="mt-2 flex items-baseline justify-between gap-3">
              <p
                className="admin-dashboard-kpi-value font-sans text-[24px] min-[1440px]:text-[28px] min-[1680px]:text-[30px] font-bold leading-none tracking-tight tabular-nums text-[#1A1A1A]"
                title={cfg.formatValue(metric.currentValue)}
              >
                {cfg.formatValue(metric.currentValue)}
              </p>
            </div>

            <div className="mt-2.5">
              {renderComparisonFooter(metric, comparisonLabel)}
            </div>
          </Link>
        );
      })}
    </section>
  );
}
