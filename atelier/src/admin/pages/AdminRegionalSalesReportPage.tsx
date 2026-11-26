import { useMemo, useState } from 'react';
import {
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  Search,
} from 'lucide-react';

import { useAdminAnalyticsOverview } from '../hooks/useAdminAnalyticsOverview';
import type {
  AnalyticsPreset,
  AnalyticsRegionalSales,
} from '../types/analytics';
import {
  formatPrice,
  ProgressBar,
} from '../components/ui/AdminPrimitives';
import { exportRegionalReportPdf } from '../utils/pdfReportGenerator';
import { PeriodFilter, ReportPageHeader } from '../components/ReportControls';

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
      });
    } catch (err) {
      console.error('Export PDF regional failed:', err);
    } finally {
      setIsExportingPdf(false);
    }
  };

  const tableTotalOrders = filteredRegions.reduce(
    (sum, region) => sum + region.orders,
    0,
  );
  const tableTotalUnits = filteredRegions.reduce(
    (sum, region) => sum + region.unitsSold,
    0,
  );
  const tableTotalRevenue = filteredRegions.reduce(
    (sum, region) => sum + region.revenue,
    0,
  );
  const tableTotalContribution = filteredRegions.reduce(
    (sum, region) => sum + region.percentageContribution,
    0,
  );

  return (
    <div className="space-y-6">
      <ReportPageHeader
        title="Penjualan per Wilayah"
        subtitle="Lihat provinsi yang paling banyak menyumbang pesanan dan pendapatan."
        onRefresh={refetch}
        isRefreshing={isLoading}
        exportActions={[
          {
            format: 'csv',
            label: 'Ekspor CSV',
            onClick: handleExport,
            disabled: regions.length === 0 || isLoading,
          },
          {
            format: 'pdf',
            label: 'Ekspor PDF',
            onClick: () => void handleExportPdf(),
            disabled: regions.length === 0 || isLoading || isExportingPdf,
            busy: isExportingPdf,
          },
        ]}
      />

      {error && (
        <div className="rounded-2xl border border-[#F3B0A3] bg-[#FBD9D3] p-4 text-[#8C3A1E]">
          <p className="text-[13px] font-semibold">Gagal memuat data wilayah</p>
          <p className="mt-1 text-[12px]">{error}</p>
        </div>
      )}

      <PeriodFilter
        activePreset={preset}
        startDate={startDate}
        endDate={endDate}
        rangeStartDate={data?.period?.startDate ?? startDate}
        rangeEndDate={data?.period?.endDate ?? endDate}
        onPresetChange={handlePresetChange}
        onApplyCustom={(customStart, customEnd) => {
          setPreset('custom');
          setStartDate(customStart);
          setEndDate(customEnd);
          setPage(1);
        }}
      />

      <section
        aria-label="Ringkasan penjualan wilayah"
        className="grid grid-cols-2 divide-x divide-y divide-[#ECE6E0] overflow-hidden rounded-2xl border border-[#ECE6E0] bg-white xl:grid-cols-4 xl:divide-y-0"
      >
        <article className="min-w-0 p-4 sm:p-5">
          <p className="text-[12px] text-[#8B7F79]">Total pendapatan</p>
          <p className="mt-2 text-[24px] font-semibold leading-tight tabular-nums text-[#2A201D]">
            {formatPrice(totalRevenue)}
          </p>
          <p className="mt-1 text-[12px] text-[#8B7F79]">
            Dari pesanan selesai
          </p>
        </article>
        <article className="min-w-0 p-4 sm:p-5">
          <p className="text-[12px] text-[#8B7F79]">Total pesanan</p>
          <p className="mt-2 text-[24px] font-semibold leading-tight tabular-nums text-[#2A201D]">
            {numberFormatter.format(totalOrders)}
          </p>
          <p className="mt-1 text-[12px] text-[#8B7F79]">
            <span className="tabular-nums">{numberFormatter.format(totalUnits)}</span>{' '}
            unit terjual
          </p>
        </article>
        <article className="min-w-0 p-4 sm:p-5">
          <p className="text-[12px] text-[#8B7F79]">Provinsi teratas</p>
          <p
            className="mt-2 truncate text-[24px] font-semibold leading-tight text-[#2A201D]"
            title={topRegion?.province ?? '-'}
          >
            {topRegion?.province ?? '-'}
          </p>
          <p className="mt-1 text-[12px] text-[#8B7F79]">
            <span className="tabular-nums">
              {formatPercent(topRegion?.percentageContribution ?? 0)}
            </span>{' '}
            dari omzet
          </p>
        </article>
        <article className="min-w-0 p-4 sm:p-5">
          <p className="text-[12px] text-[#8B7F79]">Rata-rata per pesanan</p>
          <p className="mt-2 text-[24px] font-semibold leading-tight tabular-nums text-[#2A201D]">
            {formatPrice(averageOrderValue)}
          </p>
          <p className="mt-1 text-[12px] text-[#8B7F79]">
            Dari semua wilayah
          </p>
        </article>
      </section>

      <section
        aria-labelledby="regions-table-heading"
        className="overflow-hidden rounded-2xl border border-[#ECE6E0] bg-white"
      >
        <div className="flex flex-col gap-3 border-b border-[#ECE6E0] px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div>
            <h2
              id="regions-table-heading"
              className="text-[16px] font-semibold text-[#2A201D]"
            >
              Rincian per provinsi
            </h2>
            <p className="mt-0.5 text-[12px] text-[#8B7F79]">
              <span className="tabular-nums">
                {numberFormatter.format(filteredRegions.length)}
              </span>{' '}
              provinsi pada periode ini
            </p>
          </div>
          <div className="relative w-full sm:w-64">
            <Search
              size={15}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#8B7F79]"
              aria-hidden="true"
            />
            <input
              type="search"
              aria-label="Cari provinsi"
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                setPage(1);
              }}
              placeholder="Cari provinsi"
              className="h-10 w-full rounded-[10px] border border-[#ECE6E0] bg-[#FAF8F5] pl-9 pr-3 text-[13px] text-[#2A201D] placeholder:text-[#8B7F79] focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[#5B3F36]"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] border-collapse text-left">
            <thead>
              <tr className="border-b border-[#ECE6E0] bg-[#FAF8F5]">
                <th scope="col" className="px-6 py-3 text-[12px] font-medium text-[#8B7F79]">
                  <button
                    type="button"
                    onClick={() => handleSort('province')}
                    className="inline-flex items-center gap-1.5 rounded-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#5B3F36]"
                  >
                    Provinsi <ArrowUpDown size={12} aria-hidden="true" />
                  </button>
                </th>
                <th scope="col" className="px-4 py-3 text-right text-[12px] font-medium text-[#8B7F79]">
                  <button
                    type="button"
                    onClick={() => handleSort('orders')}
                    className="inline-flex items-center gap-1.5 rounded-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#5B3F36]"
                  >
                    Pesanan <ArrowUpDown size={12} aria-hidden="true" />
                  </button>
                </th>
                <th scope="col" className="px-4 py-3 text-right text-[12px] font-medium text-[#8B7F79]">
                  <button
                    type="button"
                    onClick={() => handleSort('unitsSold')}
                    className="inline-flex items-center gap-1.5 rounded-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#5B3F36]"
                  >
                    Unit terjual <ArrowUpDown size={12} aria-hidden="true" />
                  </button>
                </th>
                <th scope="col" className="px-4 py-3 text-right text-[12px] font-medium text-[#8B7F79]">
                  <button
                    type="button"
                    onClick={() => handleSort('revenue')}
                    className="inline-flex items-center gap-1.5 rounded-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#5B3F36]"
                  >
                    Pendapatan <ArrowUpDown size={12} aria-hidden="true" />
                  </button>
                </th>
                <th scope="col" className="px-6 py-3 text-[12px] font-medium text-[#8B7F79]">
                  <button
                    type="button"
                    onClick={() => handleSort('percentageContribution')}
                    className="inline-flex items-center gap-1.5 rounded-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#5B3F36]"
                  >
                    Kontribusi omzet <ArrowUpDown size={12} aria-hidden="true" />
                  </button>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#ECE6E0]">
              {paginatedRegions.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-6 py-12 text-center text-[13px] text-[#8B7F79]"
                  >
                    {isLoading
                      ? 'Memuat data wilayah…'
                      : 'Tidak ada data wilayah yang cocok dengan pencarian.'}
                  </td>
                </tr>
              ) : (
                paginatedRegions.map((region) => (
                  <tr
                    key={region.province}
                    className="transition-colors hover:bg-[#FAF8F5]"
                  >
                    <td className="px-6 py-3.5 text-[14px] font-normal text-[#2A201D]">
                      <div className="flex items-center gap-3">
                        <span
                          aria-label={`Peringkat ${region.rank}`}
                          className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#5B3F36] text-[12px] font-medium tabular-nums text-white"
                        >
                          {region.rank}
                        </span>
                        <span>{region.province}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 text-right text-[14px] font-normal tabular-nums text-[#2A201D]">
                      {numberFormatter.format(region.orders)}
                    </td>
                    <td className="px-4 py-3.5 text-right text-[14px] font-normal tabular-nums text-[#2A201D]">
                      {numberFormatter.format(region.unitsSold)}
                    </td>
                    <td className="px-4 py-3.5 text-right text-[14px] font-normal tabular-nums text-[#2A201D]">
                      {formatPrice(region.revenue)}
                    </td>
                    <td className="px-6 py-3.5">
                      <div className="flex items-center gap-3">
                        <ProgressBar
                          value={region.percentageContribution}
                          colorClass="bg-[#5B3F36]"
                          className="w-full max-w-[160px]"
                        />
                        <span className="w-12 shrink-0 text-right text-[13px] font-medium tabular-nums text-[#2A201D]">
                          {formatPercent(region.percentageContribution)}
                        </span>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
            {filteredRegions.length > 0 && (
              <tfoot>
                <tr className="border-t border-[#ECE6E0] bg-[#FAF8F5] text-[14px] font-medium text-[#2A201D]">
                  <th scope="row" className="px-6 py-3.5 text-left">
                    Total
                  </th>
                  <td className="px-4 py-3.5 text-right tabular-nums">
                    {numberFormatter.format(tableTotalOrders)}
                  </td>
                  <td className="px-4 py-3.5 text-right tabular-nums">
                    {numberFormatter.format(tableTotalUnits)}
                  </td>
                  <td className="px-4 py-3.5 text-right tabular-nums">
                    {formatPrice(tableTotalRevenue)}
                  </td>
                  <td className="px-6 py-3.5 text-right tabular-nums">
                    {formatPercent(tableTotalContribution)}
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-[#ECE6E0] px-5 py-3 sm:px-6">
            <span className="text-[12px] text-[#8B7F79]">
              Halaman <span className="tabular-nums">{page}</span> dari{' '}
              <span className="tabular-nums">{totalPages}</span>
            </span>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setPage((current) => Math.max(1, current - 1))}
                disabled={page <= 1}
                aria-label="Halaman sebelumnya"
                className="inline-flex h-9 w-9 items-center justify-center rounded-[10px] border border-[#ECE6E0] bg-white text-[#5B3F36] transition-colors hover:bg-[#F4EFEA] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#5B3F36] disabled:opacity-40"
              >
                <ChevronLeft size={15} />
              </button>
              <button
                type="button"
                onClick={() =>
                  setPage((current) => Math.min(totalPages, current + 1))
                }
                disabled={page >= totalPages}
                aria-label="Halaman berikutnya"
                className="inline-flex h-9 w-9 items-center justify-center rounded-[10px] border border-[#ECE6E0] bg-white text-[#5B3F36] transition-colors hover:bg-[#F4EFEA] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#5B3F36] disabled:opacity-40"
              >
                <ChevronRight size={15} />
              </button>
            </div>
          </div>
        )}

        <p className="flex items-start gap-2 border-t border-[#ECE6E0] px-5 py-4 text-[12px] leading-relaxed text-[#8B7F79] sm:px-6">
          <span
            className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#8B7F79]"
            aria-hidden="true"
          />
          Provinsi lain akan muncul di sini setelah ada pesanan dari wilayah berbeda.
        </p>
      </section>
    </div>
  );
}
