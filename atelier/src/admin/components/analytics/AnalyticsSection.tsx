import { useMemo, useState } from 'react';
import { Calendar, RefreshCw } from 'lucide-react';
import { useAdminAnalyticsOverview } from '../../hooks/useAdminAnalyticsOverview';
import type {
  AnalyticsFilterParams,
  AnalyticsPreset,
} from '../../types/analytics';
import AnalyticsCategoryChart from './AnalyticsCategoryChart';
import AnalyticsInsightsCard from './AnalyticsInsightsCard';
import AnalyticsKpiGrid from './AnalyticsKpiGrid';
import AnalyticsRegionalSalesCard from './AnalyticsRegionalSalesCard';
import AnalyticsSalesTrendChart from './AnalyticsSalesTrendChart';
import AnalyticsTopProductsCard from './AnalyticsTopProductsCard';

const MONTH_NAMES_ID = [
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

const WIB_OFFSET_MS = 7 * 60 * 60 * 1000;

function getTodayWibYmd(): string {
  const shifted = new Date(Date.now() + WIB_OFFSET_MS);
  const y = shifted.getUTCFullYear();
  const m = String(shifted.getUTCMonth() + 1).padStart(2, '0');
  const d = String(shifted.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function formatYmdId(ymd: string, includeYear = true): string {
  const parts = ymd.split('-');
  if (parts.length !== 3) return ymd;
  const year = parts[0];
  const monthIdx = parseInt(parts[1], 10) - 1;
  const day = parseInt(parts[2], 10);
  const monthName = MONTH_NAMES_ID[monthIdx] ?? parts[1];
  return includeYear ? `${day} ${monthName} ${year}` : `${day} ${monthName}`;
}

function formatComparisonRange(startYmd: string, endYmd: string): string {
  const startParts = startYmd.split('-');
  const endParts = endYmd.split('-');
  const sameYear =
    startParts.length === 3 &&
    endParts.length === 3 &&
    startParts[0] === endParts[0];
  return `vs ${formatYmdId(startYmd, !sameYear)} – ${formatYmdId(endYmd, true)}`;
}

function diffCalendarDays(startYmd: string, endYmd: string): number {
  const [sy, sm, sd] = startYmd.split('-').map(Number);
  const [ey, em, ed] = endYmd.split('-').map(Number);
  return (
    Math.round(
      (Date.UTC(ey, em - 1, ed) - Date.UTC(sy, sm - 1, sd)) /
        (24 * 60 * 60 * 1000),
    ) + 1
  );
}

const PRESET_LABEL_MAP: Record<Exclude<AnalyticsPreset, 'custom'>, string> = {
  '7d': '7 Hari',
  '30d': '30 Hari',
  '1y': '1 Tahun',
};

interface AnalyticsSectionProps {
  todayLabel?: string;
}

export default function AnalyticsSection({
  todayLabel,
}: AnalyticsSectionProps) {
  const todayWib = useMemo(() => getTodayWibYmd(), []);
  const [filter, setFilter] = useState<AnalyticsFilterParams>({
    preset: '30d',
  });
  const [customOpen, setCustomOpen] = useState(false);
  const [draftStart, setDraftStart] = useState('');
  const [draftEnd, setDraftEnd] = useState(todayWib);
  const [customError, setCustomError] = useState<string | null>(null);

  const { data, isLoading, error, refetch } =
    useAdminAnalyticsOverview(filter);

  const handleSelectPreset = (preset: '7d' | '30d' | '1y') => {
    setCustomOpen(false);
    setCustomError(null);
    setFilter({ preset });
  };

  const handleToggleCustom = () => {
    if (!customOpen && data) {
      setDraftStart(data.period.startDate);
      setDraftEnd(data.period.endDate);
    }
    setCustomError(null);
    setCustomOpen((prev) => !prev);
  };

  const handleApplyCustom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!draftStart || !draftEnd) {
      setCustomError('Tanggal mulai dan tanggal akhir wajib diisi.');
      return;
    }
    if (draftStart > draftEnd) {
      setCustomError(
        'Tanggal mulai tidak boleh lebih besar dari tanggal akhir.',
      );
      return;
    }
    const latestWib = getTodayWibYmd();
    if (draftEnd > latestWib) {
      setCustomError('Tanggal akhir tidak boleh melewati hari ini (WIB).');
      return;
    }
    if (diffCalendarDays(draftStart, draftEnd) > 400) {
      setCustomError('Rentang tanggal custom maksimal 400 hari.');
      return;
    }

    setCustomError(null);
    setCustomOpen(false);
    setFilter({
      preset: 'custom',
      startDate: draftStart,
      endDate: draftEnd,
    });
  };

  const activePeriodLabel = data
    ? `${formatYmdId(data.period.startDate)} – ${formatYmdId(data.period.endDate)}`
    : filter.preset === 'custom' && filter.startDate && filter.endDate
      ? `${formatYmdId(filter.startDate)} – ${formatYmdId(filter.endDate)}`
      : filter.preset === '7d'
        ? '7 Hari Terakhir'
        : filter.preset === '1y'
          ? '12 Bulan Terakhir'
          : '30 Hari Terakhir';

  const comparisonLabel = data
    ? formatComparisonRange(
        data.comparisonPeriod.startDate,
        data.comparisonPeriod.endDate,
      )
    : 'vs periode sebelumnya';

  const scopeBadgeText =
    filter.preset === '7d'
      ? '7 hari terakhir'
      : filter.preset === '1y'
        ? '1 tahun terakhir'
        : filter.preset === 'custom'
          ? 'Rentang custom'
          : '30 hari terakhir';

  return (
    <div className="space-y-5">
      {/* BARIS 0: Unified Dashboard Header + Shared Period Filter */}
      <header className="admin-dashboard-header flex flex-col gap-3.5">
        <div>
          <h1 className="mt-0.5 font-editorial text-[32px] font-semibold leading-tight tracking-tight text-[#1A1A1A]">
            Dashboard
          </h1>
          <p className="mt-0.5 text-[13px] text-[#6F6A62]">
            Pusat informasi performa bisnis dan operasional toko Atelier
            {todayLabel ? ` · ${todayLabel}` : ''}
          </p>
        </div>

        <div className="relative flex flex-wrap items-center gap-2.5">
          {/* Active Date Range Chip */}
          <div className="inline-flex min-h-[40px] items-center gap-2 rounded-xl border border-[#ECE7DE] bg-white px-3.5 text-[13px] text-[#1A1A1A] shadow-[0_1px_2px_rgba(26,22,18,0.03)]">
            <Calendar
              className="h-4 w-4 shrink-0 text-[#6F6A62]"
              aria-hidden="true"
            />
            <span className="font-sans font-semibold tabular-nums text-[#1A1A1A]">
              {activePeriodLabel}
            </span>
            <span className="text-[12px] text-[#6F6A62]">
              ({data?.period.timezone ?? 'Asia/Jakarta'})
            </span>
          </div>

          {/* Segmented Control (Shared Period Filter) */}
          <div
            role="group"
            aria-label="Filter periode Business Analytics"
            className="inline-flex min-h-[40px] items-center rounded-xl border border-[#ECE7DE] bg-white p-1 shadow-[0_1px_2px_rgba(26,22,18,0.03)]"
          >
            {(['7d', '30d', '1y'] as const).map((p) => {
              const active = filter.preset === p && !customOpen;
              return (
                <button
                  key={p}
                  type="button"
                  aria-pressed={active}
                  onClick={() => handleSelectPreset(p)}
                  className={[
                    'min-h-[32px] rounded-lg px-3.5 text-[13px] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#5C4033]/40',
                    active
                      ? 'bg-[#5C4033] font-semibold text-white shadow-sm'
                      : 'font-medium text-[#3F3B36] hover:bg-[#FAF8F4] hover:text-[#1A1A1A]',
                  ].join(' ')}
                >
                  {PRESET_LABEL_MAP[p]}
                </button>
              );
            })}

            <button
              type="button"
              onClick={handleToggleCustom}
              aria-expanded={customOpen}
              className={[
                'inline-flex min-h-[32px] items-center gap-1.5 rounded-lg px-3.5 text-[13px] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#5C4033]/40',
                filter.preset === 'custom' || customOpen
                  ? 'bg-[#5C4033] font-semibold text-white shadow-sm'
                  : 'font-medium text-[#3F3B36] hover:bg-[#FAF8F4] hover:text-[#1A1A1A]',
              ].join(' ')}
            >
              <Calendar className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Custom</span>
            </button>
          </div>

          {/* Refresh Button */}
          <button
            type="button"
            onClick={refetch}
            disabled={isLoading}
            aria-label="Muat ulang Business Analytics"
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-[#ECE7DE] bg-white text-[#3F3B36] shadow-[0_1px_2px_rgba(26,22,18,0.03)] transition-colors hover:bg-[#FAF8F4] hover:text-[#1A1A1A] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#5C4033]/40 disabled:opacity-50"
          >
            <RefreshCw
              className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`}
              aria-hidden="true"
            />
          </button>

          {customOpen && (
            <form
              noValidate
              onSubmit={handleApplyCustom}
              className="absolute right-0 top-full z-20 mt-2 w-full min-w-[300px] max-w-[340px] rounded-2xl border border-[#ECE7DE] bg-white p-4 shadow-[0_12px_32px_rgba(26,22,18,0.1)]"
            >
              <p className="text-[13px] font-semibold text-[#1A1A1A]">
                Rentang Tanggal Custom (WIB)
              </p>
              <div className="mt-3 grid grid-cols-2 gap-2.5">
                <label className="block text-[11.5px] font-medium text-[#6F6A62]">
                  Dari Tanggal
                  <input
                    type="date"
                    value={draftStart}
                    max={draftEnd || todayWib}
                    onChange={(e) => setDraftStart(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-[#ECE7DE] bg-[#FAF8F4] px-2.5 py-1.5 font-sans text-[12.5px] tabular-nums text-[#1A1A1A] focus:border-[#5C4033] focus:outline-none"
                  />
                </label>
                <label className="block text-[11.5px] font-medium text-[#6F6A62]">
                  Sampai Tanggal
                  <input
                    type="date"
                    value={draftEnd}
                    min={draftStart || undefined}
                    max={todayWib}
                    onChange={(e) => setDraftEnd(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-[#ECE7DE] bg-[#FAF8F4] px-2.5 py-1.5 font-sans text-[12.5px] tabular-nums text-[#1A1A1A] focus:border-[#5C4033] focus:outline-none"
                  />
                </label>
              </div>

              {customError && (
                <p
                  role="alert"
                  className="mt-2.5 text-[12px] font-medium text-[#B4382E]"
                >
                  {customError}
                </p>
              )}

              <div className="mt-3.5 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setCustomOpen(false)}
                  className="rounded-lg px-3 py-1.5 text-[12px] font-medium text-[#6F6A62] hover:bg-[#FAF8F4]"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-[#5C4033] px-3.5 py-1.5 text-[12px] font-semibold text-white transition-colors hover:bg-[#3D2920]"
                >
                  Terapkan
                </button>
              </div>
            </form>
          )}
        </div>
      </header>

      {/* Loading State */}
      {isLoading && (
        <div aria-busy="true" className="space-y-5">
          <div className="admin-dashboard-kpi-grid">
            {[0, 1, 2, 3].map((idx) => (
              <div
                key={idx}
                className="h-[128px] animate-pulse rounded-2xl border border-[#ECE7DE] bg-white/80"
              />
            ))}
          </div>
          <div className="admin-dashboard-chart-grid">
            <div className="h-[348px] animate-pulse rounded-2xl border border-[#ECE7DE] bg-white/80" />
            <div className="h-[348px] animate-pulse rounded-2xl border border-[#ECE7DE] bg-white/80" />
          </div>
          <div className="admin-dashboard-panel-grid">
            <div className="h-[300px] animate-pulse rounded-2xl border border-[#ECE7DE] bg-white/80" />
            <div className="h-[300px] animate-pulse rounded-2xl border border-[#ECE7DE] bg-white/80" />
            <div className="admin-dashboard-panel-summary h-[300px] animate-pulse rounded-2xl border border-[#ECE7DE] bg-white/80" />
          </div>
        </div>
      )}

      {/* Error State */}
      {!isLoading && error && (
        <div
          role="alert"
          className="rounded-2xl border border-[#F5D6D2] bg-[#FBECEA] px-5 py-6"
        >
          <p className="text-[13.5px] font-semibold text-[#B4382E]">
            Gagal memuat Business Analytics
          </p>
          <p className="mt-1.5 text-[12.5px] text-[#B4382E]/90">{error}</p>
          <button
            type="button"
            onClick={refetch}
            className="mt-4 rounded-xl bg-[#5C4033] px-4 py-2 text-[11.5px] font-semibold uppercase tracking-[0.12em] text-white transition-colors hover:bg-[#3D2920]"
          >
            Coba Lagi
          </button>
        </div>
      )}

      {/* Loaded Sections (Baris 1, 2, 3) */}
      {!isLoading && !error && data && (
        <>
          {/* BARIS 1 — KPI mengikuti lebar konten dashboard */}
          <AnalyticsKpiGrid
            kpis={data.kpis}
            comparisonLabel={comparisonLabel}
            scopeLabel={scopeBadgeText}
          />

          {/* BARIS 2 — SALES PERFORMANCE (2fr) + BUSINESS INSIGHTS (1fr) */}
          <div className="admin-dashboard-chart-grid items-stretch">
            <div>
              <AnalyticsSalesTrendChart
                data={data.salesTrend}
                preset={filter.preset}
                onSelectPreset={handleSelectPreset}
              />
            </div>
            <div>
              <AnalyticsInsightsCard insights={data.businessInsights} />
            </div>
          </div>

          {/* BARIS 3 — panel menyesuaikan ruang konten yang tersedia */}
          <div className="admin-dashboard-panel-grid items-stretch">
            <AnalyticsTopProductsCard products={data.topProducts} />
            <AnalyticsCategoryChart categories={data.categoryPerformance} />
            <div className="admin-dashboard-panel-summary">
              <AnalyticsRegionalSalesCard regions={data.regionalSales} />
            </div>
          </div>
        </>
      )}
    </div>
  );
}
