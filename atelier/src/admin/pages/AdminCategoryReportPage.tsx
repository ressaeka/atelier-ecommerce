import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  Download,
  FileText,
  PieChart as PieChartIcon,
  RefreshCw,
  Search,
  ShoppingBag,
  TrendingUp,
  Trophy,
  Wallet,
} from 'lucide-react';

import { useAdminAnalyticsOverview } from '../hooks/useAdminAnalyticsOverview';
import type {
  AnalyticsCategoryPerformance,
  AnalyticsPreset,
} from '../types/analytics';
import AnalyticsCategoryChart from '../components/analytics/AnalyticsCategoryChart';
import {
  formatPrice,
  ProgressBar,
  RankBadge,
} from '../components/ui/AdminPrimitives';
import { exportCategoryReportPdf } from '../utils/pdfReportGenerator';

const PRESET_BUTTONS: Array<{ id: AnalyticsPreset; label: string }> = [
  { id: '7d', label: '7 Hari Terakhir' },
  { id: '30d', label: '30 Hari Terakhir' },
  { id: '1y', label: '1 Tahun' },
  { id: 'custom', label: 'Kustom' },
];

const numberFormatter = new Intl.NumberFormat('id-ID');
const percentFormatter = new Intl.NumberFormat('id-ID', {
  maximumFractionDigits: 1,
});

function formatPercent(value: number): string {
  return `${percentFormatter.format(value)}%`;
}

function csvEscape(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return '""';
  const str = String(value).replace(/"/g, '""');
  return `"${str}"`;
}

function exportCategoryCsv(
  items: AnalyticsCategoryPerformance[],
  startDate: string,
  endDate: string,
) {
  const headers = [
    'Peringkat',
    'ID Kategori',
    'Nama Kategori',
    'Unit Terjual',
    'Total Pendapatan (IDR)',
    'Kontribusi (%)',
  ];

  const rows = items.map((c) => [
    c.rank,
    c.categoryId ?? '',
    c.name,
    c.unitsSold,
    c.revenue,
    c.percentageContribution,
  ]);

  const csv = [
    headers.map(csvEscape).join(','),
    ...rows.map((row) => row.map(csvEscape).join(',')),
  ].join('\r\n');

  const blob = new Blob(['\uFEFF', csv], {
    type: 'text/csv;charset=utf-8;',
  });

  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `laporan-performa-kategori-${startDate}-sampai-${endDate}.csv`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

type SortField = 'rank' | 'name' | 'unitsSold' | 'revenue' | 'percentageContribution';

export default function AdminCategoryReportPage() {
  const [preset, setPreset] = useState<AnalyticsPreset>('30d');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<SortField>('revenue');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const { data, isLoading, error, refetch } = useAdminAnalyticsOverview({
    preset,
    startDate: preset === 'custom' ? startDate : undefined,
    endDate: preset === 'custom' ? endDate : undefined,
  });

  const categories = useMemo(() => {
    return data?.categoryPerformance ?? [];
  }, [data]);

  const totalRevenue = useMemo(() => {
    return categories.reduce((sum, c) => sum + c.revenue, 0);
  }, [categories]);

  const totalUnits = useMemo(() => {
    return categories.reduce((sum, c) => sum + c.unitsSold, 0);
  }, [categories]);

  const topCategory = useMemo(() => {
    if (categories.length === 0) return null;
    return [...categories].sort((a, b) => b.revenue - a.revenue)[0];
  }, [categories]);

  const avgRevenuePerCategory = useMemo(() => {
    if (categories.length === 0) return 0;
    return Math.round(totalRevenue / categories.length);
  }, [totalRevenue, categories]);

  // Client-side search and sorting for table
  const filteredCategories = useMemo(() => {
    const q = search.trim().toLowerCase();
    let result = categories;
    if (q) {
      result = result.filter((c) => c.name.toLowerCase().includes(q));
    }

    return [...result].sort((a, b) => {
      let cmp = 0;
      if (sortBy === 'name') {
        cmp = a.name.localeCompare(b.name, 'id');
      } else {
        cmp = (a[sortBy] ?? 0) - (b[sortBy] ?? 0);
      }
      return sortOrder === 'asc' ? cmp : -cmp;
    });
  }, [categories, search, sortBy, sortOrder]);

  const totalPages = Math.max(1, Math.ceil(filteredCategories.length / pageSize));
  const paginatedCategories = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredCategories.slice(start, start + pageSize);
  }, [filteredCategories, page]);

  const handleSort = (field: SortField) => {
    if (sortBy === field) {
      setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
    setPage(1);
  };

  const handlePresetChange = (newPreset: AnalyticsPreset) => {
    setPreset(newPreset);
    setPage(1);
  };

  const [isExportingPdf, setIsExportingPdf] = useState(false);

  const handleExport = () => {
    if (categories.length === 0) return;
    const start = data?.period?.startDate ?? 'start';
    const end = data?.period?.endDate ?? 'end';
    exportCategoryCsv(filteredCategories, start, end);
  };

  const handleExportPdf = async () => {
    if (categories.length === 0 || isExportingPdf) return;
    setIsExportingPdf(true);
    try {
      const periodLabel =
        data?.period?.startDate && data?.period?.endDate
          ? `${data.period.startDate} s/d ${data.period.endDate}`
          : preset === '7d'
            ? '7 Hari Terakhir'
            : preset === '30d'
              ? '30 Hari Terakhir'
              : preset === '1y'
                ? '1 Tahun Terakhir'
                : 'Periode Kustom';

      await exportCategoryReportPdf({
        periodLabel,
        summary: {
          totalRevenue,
          totalUnits,
          topCategory: topCategory?.name ?? '-',
          avgPerCategory: avgRevenuePerCategory,
        },
        categories: filteredCategories.map((c, idx) => ({
          rank: idx + 1,
          name: c.name,
          unitsSold: c.unitsSold,
          revenue: c.revenue,
          contribution: c.percentageContribution,
        })),
        chartElementId: 'category-analytics-chart-container',
      });
    } catch (err) {
      console.error('Export PDF category failed:', err);
    } finally {
      setIsExportingPdf(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* ── 1. Page Header ── */}
      <header className="flex flex-col gap-3.5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <nav
            aria-label="Breadcrumb"
            className="flex items-center gap-1.5 text-[12px] font-medium text-[#6F6A62]"
          >
            <Link to="/admin" className="transition-colors hover:text-[#5C4033]">
              Admin
            </Link>
            <span aria-hidden="true">/</span>
            <span>Laporan</span>
            <span aria-hidden="true">/</span>
            <span className="font-semibold text-[#5C4033]">
              Performa Kategori
            </span>
          </nav>

          <h1 className="mt-1 text-[26px] font-bold tracking-tight text-[#1A1A1A] sm:text-[28px]">
            Performa Kategori
          </h1>
          <p className="mt-0.5 text-[13px] text-[#6F6A62]">
            Peringkat, kontribusi omzet sah, dan distribusi volume penjualan per kategori produk.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {data?.period ? (
            <span className="mr-1 text-[12px] font-medium text-[#6F6A62]">
              Periode: {data.period.startDate} s/d {data.period.endDate}
            </span>
          ) : null}

          <button
            type="button"
            onClick={refetch}
            disabled={isLoading}
            className="inline-flex min-h-[40px] items-center justify-center gap-2 rounded-xl border border-[#ECE7DE] bg-white px-3.5 py-2 text-[12.5px] font-semibold text-[#3F3B36] shadow-[0_1px_2px_rgba(26,22,18,0.03)] transition-colors hover:bg-[#FAF8F4] hover:text-[#1A1A1A] disabled:opacity-50"
          >
            <RefreshCw
              size={14}
              className={isLoading ? 'animate-spin' : undefined}
              aria-hidden="true"
            />
            <span>Muat Ulang</span>
          </button>

          <button
            type="button"
            onClick={handleExport}
            disabled={categories.length === 0 || isLoading}
            className="inline-flex min-h-[40px] items-center gap-2 rounded-xl border border-[#ECE7DE] bg-white px-3.5 py-2 text-[12.5px] font-semibold text-[#3F3B36] shadow-[0_1px_2px_rgba(26,22,18,0.03)] transition-colors hover:bg-[#FAF8F4] hover:text-[#1A1A1A] disabled:cursor-not-allowed disabled:opacity-40"
            title="Unduh data kategori format CSV"
          >
            <Download size={14} strokeWidth={1.8} aria-hidden="true" />
            <span>Ekspor CSV</span>
          </button>

          <button
            type="button"
            onClick={handleExportPdf}
            disabled={categories.length === 0 || isLoading || isExportingPdf}
            className="inline-flex min-h-[40px] items-center gap-2 rounded-xl border border-[#D5C2B4] bg-[#F7F4EE] px-3.5 py-2 text-[12.5px] font-semibold text-[#5C4033] shadow-[0_1px_2px_rgba(92,64,51,0.06)] transition-colors hover:bg-[#EFE9E0] hover:text-[#3D2920] disabled:cursor-not-allowed disabled:opacity-40"
            title="Unduh laporan performa kategori format PDF"
          >
            {isExportingPdf ? (
              <RefreshCw size={14} className="animate-spin text-[#5C4033]" aria-hidden="true" />
            ) : (
              <FileText size={14} strokeWidth={1.8} aria-hidden="true" />
            )}
            <span>{isExportingPdf ? 'Mengekspor PDF…' : 'Ekspor PDF'}</span>
          </button>
        </div>
      </header>

      {error && (
        <div className="rounded-2xl border border-[#F3B0A3] bg-[#FBD9D3] p-4 text-[#8C3A1E]">
          <p className="text-[13px] font-semibold">Gagal memuat data kategori</p>
          <p className="mt-1 text-[12px]">{error}</p>
        </div>
      )}

      {/* ── 2. Filters Bar ── */}
      <section
        aria-label="Filter Periode dan Pencarian"
        className="rounded-2xl border border-[#ECE7DE] bg-white p-4 shadow-[0_1px_3px_rgba(26,22,18,0.04)]"
      >
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          {/* Preset Buttons */}
          <div className="flex flex-wrap items-center gap-1.5">
            {PRESET_BUTTONS.map((btn) => {
              const active = preset === btn.id;
              return (
                <button
                  key={btn.id}
                  type="button"
                  onClick={() => handlePresetChange(btn.id)}
                  className={`rounded-xl px-3.5 py-2 text-[12px] font-semibold transition-colors ${
                    active
                      ? 'bg-[#1A1A1A] text-white shadow-sm'
                      : 'border border-[#ECE7DE] bg-[#FAF8F4] text-[#6F6A62] hover:bg-[#F3EFE8] hover:text-[#1A1A1A]'
                  }`}
                >
                  {btn.label}
                </button>
              );
            })}
          </div>

          {/* Search Box */}
          <div className="relative w-full sm:w-[260px]">
            <Search
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-[#A39D93]"
              aria-hidden="true"
            />
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Cari nama kategori..."
              className="h-10 w-full rounded-xl border border-[#ECE7DE] bg-[#FAF8F4] pl-9 pr-3 text-[12.5px] text-[#1A1A1A] placeholder:text-[#A39D93] focus:border-[#5C4033] focus:bg-white focus:outline-none"
            />
          </div>
        </div>

        {/* Custom Date Pickers (if preset === 'custom') */}
        {preset === 'custom' && (
          <div className="mt-3.5 flex flex-wrap items-center gap-3 border-t border-[#ECE7DE] pt-3 text-[12px]">
            <span className="font-medium text-[#6F6A62]">Rentang Kustom:</span>
            <div className="flex items-center gap-2">
              <div className="relative">
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="h-9 rounded-lg border border-[#ECE7DE] bg-[#FAF8F4] px-2.5 text-[12px] text-[#1A1A1A] focus:border-[#5C4033] focus:outline-none"
                />
              </div>
              <span className="text-[#A39D93]">s/d</span>
              <div className="relative">
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="h-9 rounded-lg border border-[#ECE7DE] bg-[#FAF8F4] px-2.5 text-[12px] text-[#1A1A1A] focus:border-[#5C4033] focus:outline-none"
                />
              </div>
            </div>
          </div>
        )}
      </section>

      {/* ── 3. KPI Cards Grid ── */}
      <section
        aria-label="Ringkasan KPI Kategori"
        className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4"
      >
        {/* KPI 1: Total Pendapatan */}
        <article className="flex min-h-[140px] flex-col justify-between rounded-2xl border border-[#ECE7DE] bg-white p-5 shadow-[0_1px_3px_rgba(26,22,18,0.04)]">
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
              <span className="rounded-md border border-[#ECE7DE] bg-[#FAF8F4] px-2 py-0.5 text-[10.5px] font-medium text-[#6F6A62]">
                Omzet Sah
              </span>
            </div>
            <p className="mt-3 text-[24px] font-bold leading-tight tracking-tight tabular-nums text-[#1A1A1A]">
              {formatPrice(totalRevenue)}
            </p>
            <p className="mt-1 text-[11.5px] text-[#6F6A62]">
              Dari pesanan berstatus selesai (DELIVERED)
            </p>
          </div>
        </article>

        {/* KPI 2: Total Unit Terjual */}
        <article className="flex min-h-[140px] flex-col justify-between rounded-2xl border border-[#ECE7DE] bg-white p-5 shadow-[0_1px_3px_rgba(26,22,18,0.04)]">
          <div>
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#E7F3EC] text-[#2F7A4F]">
                  <ShoppingBag size={16} strokeWidth={1.8} aria-hidden="true" />
                </span>
                <h2 className="text-[13px] font-medium text-[#3F3B36]">
                  Total Unit Terjual
                </h2>
              </div>
            </div>
            <p className="mt-3 text-[24px] font-bold leading-tight tracking-tight tabular-nums text-[#1A1A1A]">
              {numberFormatter.format(totalUnits)}{' '}
              <span className="text-[13.5px] font-medium text-[#6F6A62]">unit</span>
            </p>
            <p className="mt-1 text-[11.5px] text-[#6F6A62]">
              Volume akumulasi produk dari {categories.length} kategori aktif
            </p>
          </div>
        </article>

        {/* KPI 3: Kategori Teratas */}
        <article className="flex min-h-[140px] flex-col justify-between rounded-2xl border border-[#ECE7DE] bg-white p-5 shadow-[0_1px_3px_rgba(26,22,18,0.04)]">
          <div>
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#FBF1E1] text-[#9A5B14]">
                  <Trophy size={16} strokeWidth={1.8} aria-hidden="true" />
                </span>
                <h2 className="text-[13px] font-medium text-[#3F3B36]">
                  Kategori Teratas
                </h2>
              </div>
            </div>
            <p className="mt-3 truncate text-[22px] font-bold leading-tight tracking-tight text-[#1A1A1A]" title={topCategory?.name ?? '-'}>
              {topCategory?.name ?? '-'}
            </p>
            <p className="mt-1 text-[11.5px] text-[#6F6A62]">
              Kontribusi {formatPercent(topCategory?.percentageContribution ?? 0)} dari total omzet
            </p>
          </div>
        </article>

        {/* KPI 4: Rata-rata per Kategori */}
        <article className="flex min-h-[140px] flex-col justify-between rounded-2xl border border-[#ECE7DE] bg-white p-5 shadow-[0_1px_3px_rgba(26,22,18,0.04)]">
          <div>
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#F4EFE8] text-[#5C4033]">
                  <TrendingUp size={16} strokeWidth={1.8} aria-hidden="true" />
                </span>
                <h2 className="text-[13px] font-medium text-[#3F3B36]">
                  Rata-rata per Kategori
                </h2>
              </div>
            </div>
            <p className="mt-3 text-[24px] font-bold leading-tight tracking-tight tabular-nums text-[#1A1A1A]">
              {formatPrice(avgRevenuePerCategory)}
            </p>
            <p className="mt-1 text-[11.5px] text-[#6F6A62]">
              Rata-rata nilai pendapatan per kategori aktif
            </p>
          </div>
        </article>
      </section>

      {/* ── 4. Visual Chart Section ── */}
      <section className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Visual Donut Chart using Shared AnalyticsCategoryChart */}
        <div id="category-analytics-chart-container" className="lg:col-span-7">
          <AnalyticsCategoryChart categories={categories} />
        </div>

        {/* Top Categories Ranking Highlight */}
        <div className="flex flex-col justify-between rounded-2xl border border-[#ECE7DE] bg-white p-6 shadow-[0_1px_3px_rgba(26,22,18,0.04)] lg:col-span-5">
          <div>
            <div className="flex items-center gap-2.5 border-b border-[#ECE7DE] pb-4">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#F4EFE8] text-[#5C4033]">
                <PieChartIcon size={18} strokeWidth={1.8} />
              </span>
              <div>
                <h2 className="font-editorial text-[18px] font-semibold text-[#1A1A1A]">
                  Pangsa Penjualan
                </h2>
                <p className="text-[12px] text-[#6F6A62]">
                  Peringkat pangsa omzet antar kategori produk
                </p>
              </div>
            </div>

            <ol className="mt-4 space-y-3">
              {categories.slice(0, 5).map((cat) => (
                <li key={cat.name} className="rounded-xl border border-[#ECE7DE] bg-[#FAF8F4] p-3">
                  <div className="flex items-center justify-between text-[12.5px]">
                    <div className="flex items-center gap-2 font-semibold text-[#1A1A1A]">
                      <RankBadge rank={cat.rank} />
                      <span>{cat.name}</span>
                    </div>
                    <span className="font-bold tabular-nums text-[#5C4033]">
                      {formatPercent(cat.percentageContribution)}
                    </span>
                  </div>
                  <div className="mt-2">
                    <ProgressBar value={cat.percentageContribution} />
                  </div>
                  <div className="mt-2 flex items-center justify-between text-[11px] text-[#6F6A62]">
                    <span>{numberFormatter.format(cat.unitsSold)} unit terjual</span>
                    <span>{formatPrice(cat.revenue)}</span>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>

      {/* ── 5. Detailed Categories Table ── */}
      <section
        aria-labelledby="categories-table-heading"
        className="overflow-hidden rounded-2xl border border-[#ECE7DE] bg-white shadow-[0_1px_3px_rgba(26,22,18,0.04)]"
      >
        <div className="flex flex-col gap-2 border-b border-[#ECE7DE] px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div>
            <h2
              id="categories-table-heading"
              className="text-[16px] font-semibold text-[#1A1A1A]"
            >
              Tabel Rincian Performa Kategori
            </h2>
            <p className="text-[12px] text-[#6F6A62]">
              Menampilkan {filteredCategories.length} kategori produk pada periode terpilih
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[700px] border-collapse text-left">
            <thead>
              <tr className="border-b border-[#ECE7DE] bg-[#FAF8F4]">
                <th
                  scope="col"
                  className="px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.1em] text-[#6F6A62]"
                >
                  <button
                    type="button"
                    onClick={() => handleSort('rank')}
                    className="inline-flex items-center gap-1 hover:text-[#1A1A1A]"
                  >
                    <span>#</span>
                    <ArrowUpDown size={12} />
                  </button>
                </th>
                <th
                  scope="col"
                  className="px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.1em] text-[#6F6A62]"
                >
                  <button
                    type="button"
                    onClick={() => handleSort('name')}
                    className="inline-flex items-center gap-1 hover:text-[#1A1A1A]"
                  >
                    <span>Kategori</span>
                    <ArrowUpDown size={12} />
                  </button>
                </th>
                <th
                  scope="col"
                  className="px-4 py-3 text-right text-[11px] font-semibold uppercase tracking-[0.1em] text-[#6F6A62]"
                >
                  <button
                    type="button"
                    onClick={() => handleSort('unitsSold')}
                    className="inline-flex items-center gap-1 hover:text-[#1A1A1A]"
                  >
                    <span>Unit Terjual</span>
                    <ArrowUpDown size={12} />
                  </button>
                </th>
                <th
                  scope="col"
                  className="px-4 py-3 text-right text-[11px] font-semibold uppercase tracking-[0.1em] text-[#6F6A62]"
                >
                  <button
                    type="button"
                    onClick={() => handleSort('revenue')}
                    className="inline-flex items-center gap-1 hover:text-[#1A1A1A]"
                  >
                    <span>Total Pendapatan</span>
                    <ArrowUpDown size={12} />
                  </button>
                </th>
                <th
                  scope="col"
                  className="px-4 py-3 text-right text-[11px] font-semibold uppercase tracking-[0.1em] text-[#6F6A62]"
                >
                  <button
                    type="button"
                    onClick={() => handleSort('percentageContribution')}
                    className="inline-flex items-center gap-1 hover:text-[#1A1A1A]"
                  >
                    <span>Kontribusi Omzet</span>
                    <ArrowUpDown size={12} />
                  </button>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#ECE7DE]">
              {paginatedCategories.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-6 py-12 text-center text-[13px] text-[#6F6A62]"
                  >
                    {isLoading
                      ? 'Memuat data kategori…'
                      : 'Tidak ada data kategori yang cocok dengan filter.'}
                  </td>
                </tr>
              ) : (
                paginatedCategories.map((cat) => (
                  <tr
                    key={cat.name}
                    className="transition-colors hover:bg-[#FAF8F4]"
                  >
                    <td className="px-4 py-3.5 text-[12.5px]">
                      <RankBadge rank={cat.rank} />
                    </td>
                    <td className="px-4 py-3.5 text-[13px] font-semibold text-[#1A1A1A]">
                      {cat.name}
                    </td>
                    <td className="px-4 py-3.5 text-right text-[12.5px] tabular-nums text-[#3F3B36]">
                      {numberFormatter.format(cat.unitsSold)}{' '}
                      <span className="text-[11px] text-[#6F6A62]">unit</span>
                    </td>
                    <td className="px-4 py-3.5 text-right text-[13px] font-bold tabular-nums text-[#1A1A1A]">
                      {formatPrice(cat.revenue)}
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-2.5">
                        <div className="w-20">
                          <ProgressBar value={cat.percentageContribution} />
                        </div>
                        <span className="w-12 text-right text-[12px] font-semibold tabular-nums text-[#5C4033]">
                          {formatPercent(cat.percentageContribution)}
                        </span>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-[#ECE7DE] px-5 py-3 sm:px-6">
            <span className="text-[12px] text-[#6F6A62]">
              Halaman {page} dari {totalPages}
            </span>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-[#ECE7DE] bg-white text-[#3F3B36] transition-colors hover:bg-[#FAF8F4] disabled:opacity-40"
                aria-label="Halaman sebelumnya"
              >
                <ChevronLeft size={14} />
              </button>
              <button
                type="button"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-[#ECE7DE] bg-white text-[#3F3B36] transition-colors hover:bg-[#FAF8F4] disabled:opacity-40"
                aria-label="Halaman berikutnya"
              >
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
