import { useMemo, useState } from 'react';
import { Calendar, RefreshCw } from 'lucide-react';
import AnalyticsCategoryChart from '../components/analytics/AnalyticsCategoryChart';
import AnalyticsInsightsCard from '../components/analytics/AnalyticsInsightsCard';
import AnalyticsKpiGrid from '../components/analytics/AnalyticsKpiGrid';
import AnalyticsRegionalSalesCard from '../components/analytics/AnalyticsRegionalSalesCard';
import AnalyticsSalesTrendChart from '../components/analytics/AnalyticsSalesTrendChart';
import AnalyticsTopProductsCard from '../components/analytics/AnalyticsTopProductsCard';
import { useAdminAnalyticsOverview } from '../hooks/useAdminAnalyticsOverview';
import type { AnalyticsFilterParams, AnalyticsPreset } from '../types/analytics';

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

function formatYmdId(ymd: string): string {
  const parts = ymd.split('-');
  if (parts.length !== 3) return ymd;
  const year = parts[0];
  const monthIdx = parseInt(parts[1], 10) - 1;
  const day = parseInt(parts[2], 10);
  const monthName = MONTH_NAMES_ID[monthIdx] ?? parts[1];
  return `${day} ${monthName} ${year}`;
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

export default function AdminBusinessAnalytics() {
  const todayWib = useMemo(() => getTodayWibYmd(), []);
  const [filter, setFilter] = useState<AnalyticsFilterParams>({ preset: '30d' });
  const [customOpen, setCustomOpen] = useState(false);
  const [draftStart, setDraftStart] = useState('');
  const [draftEnd, setDraftEnd] = useState(todayWib);
  const [customError, setCustomError] = useState<string | null>(null);

  const { data, isLoading, error, refetch } = useAdminAnalyticsOverview(filter);

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
      setCustomError('Tanggal mulai tidak boleh lebih besar dari tanggal akhir.');
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
    ? `vs ${formatYmdId(data.comparisonPeriod.startDate)} – ${formatYmdId(data.comparisonPeriod.endDate)}`
    : 'vs periode sebelumnya';

  const presetLabelMap: Record<Exclude<AnalyticsPreset, 'custom'>, string> = {
    '7d': '7 Hari',
    '30d': '30 Hari',
    '1y': '1 Tahun',
  };

  return (
    <div className="space-y-6">
      {/* Header & Date Filter Bar */}
      <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="font-editorial text-[26px] font-medium tracking-tight text-[#1A1A1A] sm:text-[30px]">
            Business Analytics
          </h1>
          <p className="mt-1.5 text-[13px] text-[#6B6B6B]">
            Analisis mendalam performa pendapatan, pesanan, produk, kategori, dan
            wilayah Atelier ({data?.period.timezone ?? 'Asia/Jakarta'}).
          </p>
        </div>

        <div className="relative flex flex-wrap items-center gap-2">
          {(['7d', '30d', '1y'] as const).map((p) => {
            const active = filter.preset === p;
            return (
              <button
                key={p}
                type="button"
                onClick={() => handleSelectPreset(p)}
                className={[
                  'rounded-xl border px-3.5 py-2 text-[12px] font-medium transition-colors',
                  active
                    ? 'border-[#3D2920] bg-[#3D2920] text-white'
                    : 'border-[#E8E4DC] bg-white text-[#4A4A4A] hover:border-[#D4CEC2] hover:text-[#1A1A1A]',
                ].join(' ')}
              >
                {presetLabelMap[p]}
              </button>
            );
          })}

          <button
            type="button"
            onClick={handleToggleCustom}
            aria-expanded={customOpen}
            className={[
              'inline-flex items-center gap-2 rounded-xl border px-3.5 py-2 text-[12px] font-medium transition-colors',
              filter.preset === 'custom' || customOpen
                ? 'border-[#3D2920] bg-[#F4EFE8] text-[#3D2920]'
                : 'border-[#E8E4DC] bg-white text-[#4A4A4A] hover:border-[#D4CEC2] hover:text-[#1A1A1A]',
            ].join(' ')}
          >
            <Calendar className="h-3.5 w-3.5" />
            <span>{activePeriodLabel}</span>
          </button>

          <button
            type="button"
            onClick={refetch}
            disabled={isLoading}
            aria-label="Muat ulang Business Analytics"
            className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-[#E8E4DC] bg-white text-[#4A4A4A] transition-colors hover:border-[#D4CEC2] hover:text-[#1A1A1A] disabled:opacity-50"
          >
            <RefreshCw
              className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`}
            />
          </button>

          {customOpen && (
            <form
              onSubmit={handleApplyCustom}
              className="absolute right-0 top-full z-20 mt-2 w-full min-w-[290px] max-w-[340px] rounded-2xl border border-[#E8E4DC] bg-white p-4 shadow-[0_12px_32px_rgba(26,26,26,0.1)]"
            >
              <p className="text-[12px] font-semibold text-[#1A1A1A]">
                Rentang Tanggal Custom (WIB)
              </p>
              <div className="mt-3 grid grid-cols-2 gap-2.5">
                <label className="block text-[11px] text-[#6B6B6B]">
                  Dari Tanggal
                  <input
                    type="date"
                    value={draftStart}
                    max={draftEnd || todayWib}
                    onChange={(e) => setDraftStart(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-[#E8E4DC] bg-[#FAF9F5] px-2.5 py-1.5 text-[12px] text-[#1A1A1A] focus:border-[#5C4033] focus:outline-none"
                  />
                </label>
                <label className="block text-[11px] text-[#6B6B6B]">
                  Sampai Tanggal
                  <input
                    type="date"
                    value={draftEnd}
                    min={draftStart || undefined}
                    max={todayWib}
                    onChange={(e) => setDraftEnd(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-[#E8E4DC] bg-[#FAF9F5] px-2.5 py-1.5 text-[12px] text-[#1A1A1A] focus:border-[#5C4033] focus:outline-none"
                  />
                </label>
              </div>

              {customError && (
                <p className="mt-2.5 text-[11.5px] font-medium text-[#A63D2B]">
                  {customError}
                </p>
              )}

              <div className="mt-3.5 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setCustomOpen(false)}
                  className="rounded-lg px-3 py-1.5 text-[11.5px] font-medium text-[#6B6B6B] hover:bg-[#F7F6F2]"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-[#3D2920] px-3.5 py-1.5 text-[11.5px] font-medium text-white transition-colors hover:bg-[#5C4033]"
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
        <div
          aria-busy="true"
          className="space-y-5"
        >
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {[0, 1, 2, 3].map((idx) => (
              <div
                key={idx}
                className="h-[124px] animate-pulse rounded-2xl border border-[#E8E4DC] bg-white/80"
              />
            ))}
          </div>
          <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">
            <div className="h-[370px] animate-pulse rounded-2xl border border-[#E8E4DC] bg-white/80 xl:col-span-2" />
            <div className="h-[370px] animate-pulse rounded-2xl border border-[#E8E4DC] bg-white/80" />
          </div>
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
            {[0, 1, 2].map((idx) => (
              <div
                key={idx}
                className="h-[290px] animate-pulse rounded-2xl border border-[#E8E4DC] bg-white/80"
              />
            ))}
          </div>
        </div>
      )}

      {/* Error State */}
      {!isLoading && error && (
        <div
          role="alert"
          className="rounded-2xl border border-[#F3B0A3] bg-[#FBD9D3] px-5 py-6"
        >
          <p className="text-[13px] font-semibold text-[#8C3A1E]">
            Gagal memuat Business Analytics
          </p>
          <p className="mt-1.5 text-[12px] text-[#8C3A1E]/90">{error}</p>
          <button
            type="button"
            onClick={refetch}
            className="mt-4 rounded-xl bg-[#1A1A1A] px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-white transition-colors hover:bg-[#333]"
          >
            Coba Lagi
          </button>
        </div>
      )}

      {/* Loaded Analytics Content */}
      {!isLoading && !error && data && (
        <>
          <AnalyticsKpiGrid
            kpis={data.kpis}
            comparisonLabel={comparisonLabel}
          />

          <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">
            <div className="xl:col-span-2">
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

          <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
            <AnalyticsTopProductsCard products={data.topProducts} />
            <AnalyticsCategoryChart categories={data.categoryPerformance} />
            <AnalyticsRegionalSalesCard regions={data.regionalSales} />
          </div>
        </>
      )}
    </div>
  );
}
