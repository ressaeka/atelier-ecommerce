import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  Download,
  FileText,
  MapPin,
  PackageCheck,
  RefreshCw,
  Search,
  TrendingUp,
  Wallet,
} from 'lucide-react';

import { useAdminAnalyticsOverview } from '../hooks/useAdminAnalyticsOverview';
import type {
  AnalyticsPreset,
  AnalyticsRegionalSales,
} from '../types/analytics';
import AnalyticsRegionalSalesCard from '../components/analytics/AnalyticsRegionalSalesCard';
import {
  formatPrice,
  ProgressBar,
  RankBadge,
} from '../components/ui/AdminPrimitives';
import { exportRegionalReportPdf } from '../utils/pdfReportGenerator';

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

function exportRegionalCsv(
  items: AnalyticsRegionalSales[],
  startDate: string,
  endDate: string,
) {
  const headers = [
    'Peringkat',
    'Provinsi / Wilayah',
    'Jumlah Pesanan',
    'Unit Terjual',
    'Total Pendapatan (IDR)',
    'Kontribusi Omzet (%)',
  ];

  const rows = items.map((r) => [
    r.rank,
    r.province,
    r.orders,
    r.unitsSold,
    r.revenue,
    r.percentageContribution,
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
  link.download = `laporan-penjualan-wilayah-${startDate}-sampai-${endDate}.csv`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

type SortField = 'rank' | 'province' | 'orders' | 'unitsSold' | 'revenue' | 'percentageContribution';

export default function AdminRegionalSalesReportPage() {
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

  const regions = useMemo(() => {
    return data?.regionalSales ?? [];
  }, [data]);

  const totalRevenue = useMemo(() => {
    return regions.reduce((sum, r) => sum + r.revenue, 0);
  }, [regions]);

  const totalOrders = useMemo(() => {
    return regions.reduce((sum, r) => sum + r.orders, 0);
  }, [regions]);

  const totalUnits = useMemo(() => {
    return regions.reduce((sum, r) => sum + r.unitsSold, 0);
  }, [regions]);

  const topRegion = useMemo(() => {
    if (regions.length === 0) return null;
    return [...regions].sort((a, b) => b.revenue - a.revenue)[0];
  }, [regions]);

  const averageOrderValue = useMemo(() => {
    if (totalOrders === 0) return 0;
    return Math.round(totalRevenue / totalOrders);
  }, [totalRevenue, totalOrders]);

  // Client-side filter and sorting for table
  const filteredRegions = useMemo(() => {
    const q = search.trim().toLowerCase();
    let result = regions;
    if (q) {
      result = result.filter((r) => r.province.toLowerCase().includes(q));
    }

    return [...result].sort((a, b) => {
      let cmp = 0;
      if (sortBy === 'province') {
        cmp = a.province.localeCompare(b.province, 'id');
      } else {
        cmp = (a[sortBy] ?? 0) - (b[sortBy] ?? 0);
      }
      return sortOrder === 'asc' ? cmp : -cmp;
    });
  }, [regions, search, sortBy, sortOrder]);

  const totalPages = Math.max(1, Math.ceil(filteredRegions.length / pageSize));
  const paginatedRegions = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredRegions.slice(start, start + pageSize);
  }, [filteredRegions, page]);

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
    if (regions.length === 0) return;
    const start = data?.period?.startDate ?? 'start';
    const end = data?.period?.endDate ?? 'end';
    exportRegionalCsv(filteredRegions, start, end);
  };

  const handleExportPdf = async () => {
    if (regions.length === 0 || isExportingPdf) return;
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

      await exportRegionalReportPdf({
        periodLabel,
        summary: {
          totalRevenue,
          totalOrders,
          topRegion: topRegion?.province ?? '-',
          averageOrderValue,
        },
        regions: filteredRegions.map((r, idx) => ({
          rank: idx + 1,
          province: r.province,
          orders: r.orders,
          unitsSold: r.unitsSold,
          revenue: r.revenue,
          contribution: r.percentageContribution,
        })),
        chartElementId: 'regional-analytics-card-container',
      });
    } catch (err) {
      console.error('Export PDF regional failed:', err);
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
              Penjualan per Wilayah
            </span>
          </nav>

          <h1 className="mt-1 text-[26px] font-bold tracking-tight text-[#1A1A1A] sm:text-[28px]">
            Penjualan per Wilayah
          </h1>
          <p className="mt-0.5 text-[13px] text-[#6F6A62]">
            Distribusi spasial pesanan, volume unit terkirim, dan konsentrasi omzet per provinsi.
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
            disabled={regions.length === 0 || isLoading}
            className="inline-flex min-h-[40px] items-center gap-2 rounded-xl border border-[#ECE7DE] bg-white px-3.5 py-2 text-[12.5px] font-semibold text-[#3F3B36] shadow-[0_1px_2px_rgba(26,22,18,0.03)] transition-colors hover:bg-[#FAF8F4] hover:text-[#1A1A1A] disabled:cursor-not-allowed disabled:opacity-40"
            title="Unduh data wilayah format CSV"
          >
            <Download size={14} strokeWidth={1.8} aria-hidden="true" />
            <span>Ekspor CSV</span>
          </button>

          <button
            type="button"
            onClick={handleExportPdf}
            disabled={regions.length === 0 || isLoading || isExportingPdf}
            className="inline-flex min-h-[40px] items-center gap-2 rounded-xl border border-[#D5C2B4] bg-[#F7F4EE] px-3.5 py-2 text-[12.5px] font-semibold text-[#5C4033] shadow-[0_1px_2px_rgba(92,64,51,0.06)] transition-colors hover:bg-[#EFE9E0] hover:text-[#3D2920] disabled:cursor-not-allowed disabled:opacity-40"
            title="Unduh laporan penjualan per wilayah format PDF"
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
          <p className="text-[13px] font-semibold">Gagal memuat data wilayah</p>
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
              placeholder="Cari provinsi / wilayah..."
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
        aria-label="Ringkasan KPI Wilayah"
        className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4"
      >
        {/* KPI 1: Total Pendapatan Wilayah */}
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

        {/* KPI 2: Total Pesanan Terkirim */}
        <article className="flex min-h-[140px] flex-col justify-between rounded-2xl border border-[#ECE7DE] bg-white p-5 shadow-[0_1px_3px_rgba(26,22,18,0.04)]">
          <div>
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#E7F3EC] text-[#2F7A4F]">
                  <PackageCheck size={16} strokeWidth={1.8} aria-hidden="true" />
                </span>
                <h2 className="text-[13px] font-medium text-[#3F3B36]">
                  Total Pesanan Wilayah
                </h2>
              </div>
            </div>
            <p className="mt-3 text-[24px] font-bold leading-tight tracking-tight tabular-nums text-[#1A1A1A]">
              {numberFormatter.format(totalOrders)}{' '}
              <span className="text-[13.5px] font-medium text-[#6F6A62]">pesanan</span>
            </p>
            <p className="mt-1 text-[11.5px] text-[#6F6A62]">
              Volume {numberFormatter.format(totalUnits)} unit terkirim ke {regions.length} provinsi
            </p>
          </div>
        </article>

        {/* KPI 3: Wilayah Teratas */}
        <article className="flex min-h-[140px] flex-col justify-between rounded-2xl border border-[#ECE7DE] bg-white p-5 shadow-[0_1px_3px_rgba(26,22,18,0.04)]">
          <div>
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#FBF1E1] text-[#9A5B14]">
                  <MapPin size={16} strokeWidth={1.8} aria-hidden="true" />
                </span>
                <h2 className="text-[13px] font-medium text-[#3F3B36]">
                  Provinsi Teratas
                </h2>
              </div>
            </div>
            <p className="mt-3 truncate text-[22px] font-bold leading-tight tracking-tight text-[#1A1A1A]" title={topRegion?.province ?? '-'}>
              {topRegion?.province ?? '-'}
            </p>
            <p className="mt-1 text-[11.5px] text-[#6F6A62]">
              Kontribusi {formatPercent(topRegion?.percentageContribution ?? 0)} dari total omzet wilayah
            </p>
          </div>
        </article>

        {/* KPI 4: Rata-rata per Pesanan (AOV) */}
        <article className="flex min-h-[140px] flex-col justify-between rounded-2xl border border-[#ECE7DE] bg-white p-5 shadow-[0_1px_3px_rgba(26,22,18,0.04)]">
          <div>
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#F4EFE8] text-[#5C4033]">
                  <TrendingUp size={16} strokeWidth={1.8} aria-hidden="true" />
                </span>
                <h2 className="text-[13px] font-medium text-[#3F3B36]">
                  Rata-rata Nilai Pesanan
                </h2>
              </div>
            </div>
            <p className="mt-3 text-[24px] font-bold leading-tight tracking-tight tabular-nums text-[#1A1A1A]">
              {formatPrice(averageOrderValue)}
            </p>
            <p className="mt-1 text-[11.5px] text-[#6F6A62]">
              Rata-rata belanja per pesanan antar wilayah
            </p>
          </div>
        </article>
      </section>

      {/* ── 4. Visual Section ── */}
      <section className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Visual Map/Card using Shared AnalyticsRegionalSalesCard */}
        <div id="regional-analytics-card-container" className="lg:col-span-7">
          <AnalyticsRegionalSalesCard regions={regions} />
        </div>

        {/* Regional Order Density Highlight */}
        <div className="flex flex-col justify-between rounded-2xl border border-[#ECE7DE] bg-white p-6 shadow-[0_1px_3px_rgba(26,22,18,0.04)] lg:col-span-5">
          <div>
            <div className="flex items-center gap-2.5 border-b border-[#ECE7DE] pb-4">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#F4EFE8] text-[#5C4033]">
                <MapPin size={18} strokeWidth={1.8} />
              </span>
              <div>
                <h2 className="font-editorial text-[18px] font-semibold text-[#1A1A1A]">
                  Kerapatan Pengiriman
                </h2>
                <p className="text-[12px] text-[#6F6A62]">
                  Peringkat konsentrasi pesanan per provinsi
                </p>
              </div>
            </div>

            <ol className="mt-4 space-y-3">
              {regions.slice(0, 5).map((r) => (
                <li key={r.province} className="rounded-xl border border-[#ECE7DE] bg-[#FAF8F4] p-3">
                  <div className="flex items-center justify-between text-[12.5px]">
                    <div className="flex items-center gap-2 font-semibold text-[#1A1A1A]">
                      <RankBadge rank={r.rank} />
                      <span>{r.province}</span>
                    </div>
                    <span className="font-bold tabular-nums text-[#5C4033]">
                      {formatPercent(r.percentageContribution)}
                    </span>
                  </div>
                  <div className="mt-2">
                    <ProgressBar value={r.percentageContribution} />
                  </div>
                  <div className="mt-2 flex items-center justify-between text-[11px] text-[#6F6A62]">
                    <span>{numberFormatter.format(r.orders)} pesanan · {numberFormatter.format(r.unitsSold)} unit</span>
                    <span>{formatPrice(r.revenue)}</span>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>

      {/* ── 5. Detailed Regional Table ── */}
      <section
        aria-labelledby="regions-table-heading"
        className="overflow-hidden rounded-2xl border border-[#ECE7DE] bg-white shadow-[0_1px_3px_rgba(26,22,18,0.04)]"
      >
        <div className="flex flex-col gap-2 border-b border-[#ECE7DE] px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div>
            <h2
              id="regions-table-heading"
              className="text-[16px] font-semibold text-[#1A1A1A]"
            >
              Tabel Rincian Penjualan per Provinsi
            </h2>
            <p className="text-[12px] text-[#6F6A62]">
              Menampilkan {filteredRegions.length} wilayah pengiriman pada periode terpilih
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
                    onClick={() => handleSort('province')}
                    className="inline-flex items-center gap-1 hover:text-[#1A1A1A]"
                  >
                    <span>Provinsi / Wilayah</span>
                    <ArrowUpDown size={12} />
                  </button>
                </th>
                <th
                  scope="col"
                  className="px-4 py-3 text-right text-[11px] font-semibold uppercase tracking-[0.1em] text-[#6F6A62]"
                >
                  <button
                    type="button"
                    onClick={() => handleSort('orders')}
                    className="inline-flex items-center gap-1 hover:text-[#1A1A1A]"
                  >
                    <span>Pesanan</span>
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
              {paginatedRegions.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-6 py-12 text-center text-[13px] text-[#6F6A62]"
                  >
                    {isLoading
                      ? 'Memuat data wilayah…'
                      : 'Tidak ada data wilayah yang cocok dengan filter.'}
                  </td>
                </tr>
              ) : (
                paginatedRegions.map((region) => (
                  <tr
                    key={region.province}
                    className="transition-colors hover:bg-[#FAF8F4]"
                  >
                    <td className="px-4 py-3.5 text-[12.5px]">
                      <RankBadge rank={region.rank} />
                    </td>
                    <td className="px-4 py-3.5 text-[13px] font-semibold text-[#1A1A1A]">
                      {region.province}
                    </td>
                    <td className="px-4 py-3.5 text-right text-[12.5px] tabular-nums text-[#3F3B36]">
                      {numberFormatter.format(region.orders)}{' '}
                      <span className="text-[11px] text-[#6F6A62]">pesanan</span>
                    </td>
                    <td className="px-4 py-3.5 text-right text-[12.5px] tabular-nums text-[#3F3B36]">
                      {numberFormatter.format(region.unitsSold)}{' '}
                      <span className="text-[11px] text-[#6F6A62]">unit</span>
                    </td>
                    <td className="px-4 py-3.5 text-right text-[13px] font-bold tabular-nums text-[#1A1A1A]">
                      {formatPrice(region.revenue)}
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-2.5">
                        <div className="w-20">
                          <ProgressBar value={region.percentageContribution} />
                        </div>
                        <span className="w-12 text-right text-[12px] font-semibold tabular-nums text-[#5C4033]">
                          {formatPercent(region.percentageContribution)}
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
