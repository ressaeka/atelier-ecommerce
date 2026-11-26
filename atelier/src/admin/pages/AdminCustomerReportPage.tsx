
import { useState } from 'react';
import {
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  Mail,
  Phone,
  RefreshCw,
  Search,
  ShoppingBag,
  TrendingUp,
  UserCheck,
  Users,
} from 'lucide-react';

import {
  useAdminCustomerReport,
  type CustomerSortBy,
  type CustomerTypeFilter,
} from '../hooks/useAdminCustomerReport';
import { formatPrice } from '../../lib/utils';
import type { CustomerReportItem } from '../../types/api';
import { PeriodFilter, ReportPageHeader } from '../components/ReportControls';
import { exportSimpleTablePdf } from '../utils/pdfReportGenerator';

const CUSTOMER_TABS: Array<{
  id: CustomerTypeFilter;
  label: string;
}> = [
  { id: 'all', label: 'Semua Pelanggan' },
  { id: 'active', label: 'Hanya Bertransaksi' },
  { id: 'inactive', label: 'Belum Bertransaksi' },
];

const SORT_LABELS: Record<CustomerSortBy, string> = {
  totalSpent: 'Total Belanja',
  totalOrders: 'Jumlah Pesanan',
  name: 'Nama',
  registeredAt: 'Tanggal Bergabung',
};

function formatIndonesianDate(dateStr: string | null): string {
  if (!dateStr) return '—';

  const date = new Date(dateStr);

  if (Number.isNaN(date.getTime())) return '—';

  return date.toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function csvEscape(value: unknown): string {
  const text = String(value ?? '');
  return `"${text.replace(/"/g, '""')}"`;
}

function exportToCsv(
  items: CustomerReportItem[],
  startDate: string,
  endDate: string,
): void {
  if (items.length === 0) return;

  const headers = [
    'ID Pelanggan',
    'Nama',
    'Email',
    'Telepon',
    'Tanggal Registrasi',
    'Status di Periode',
    'Jumlah Pesanan',
    'Total Belanja (IDR)',
    'Rata-rata Nilai Pesanan (IDR)',
    'Transaksi Terakhir',
  ];

  const rows = items.map((item) => [
    item.id,
    item.name,
    item.email,
    item.phone ?? '',
    item.registeredAt?.slice(0, 10) ?? '',
    item.hasPurchasedInPeriod ? 'Aktif Belanja' : 'Belum Belanja',
    item.totalOrders,
    item.totalSpent,
    item.averageOrderValue,
    item.lastOrderDate?.slice(0, 10) ?? '-',
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
  link.download = `laporan-pelanggan-${startDate}-sampai-${endDate}.csv`;

  document.body.appendChild(link);
  link.click();
  link.remove();

  URL.revokeObjectURL(url);
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);

  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }

  return (parts[0]?.[0] ?? 'U').toUpperCase();
}

export default function AdminCustomerReportPage() {
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);
  const {
    data,
    isLoading,
    error,
    preset,
    startDate,
    endDate,
    customerType,
    search,
    sortBy,
    sortOrder,
    page,
    applyPreset,
    setStartDate,
    setEndDate,
    setCustomerType,
    setSearch,
    handleSortChange,
    setPage,
    refetch,
  } = useAdminCustomerReport();

  const summary = data?.summary ?? {
    totalRegisteredCustomers: 0,
    newRegisteredCustomers: 0,
    activePurchasingCustomers: 0,
    inactiveCustomersInPeriod: 0,
    totalOrders: 0,
    totalRevenue: 0,
    averageSpentPerCustomer: 0,
    purchasingCustomerRatio: 0,
  };

  const customers = data?.customers?.data ?? [];

  const meta = data?.customers?.meta ?? {
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1,
  };

  const hasInvalidDateRange =
    Boolean(startDate && endDate) && startDate > endDate;

  const handleExport = () => {
    if (hasInvalidDateRange || customers.length === 0) return;

    exportToCsv(customers, startDate, endDate);
  };

  const handleExportPdf = async () => {
    if (hasInvalidDateRange || customers.length === 0 || isExportingPdf) return;

    setIsExportingPdf(true);
    setExportError(null);
    try {
      await exportSimpleTablePdf({
        title: 'Laporan Pelanggan',
        periodLabel: data?.period
          ? `${data.period.startDate} sampai ${data.period.endDate}`
          : `${startDate} sampai ${endDate}`,
        fileName: `laporan-pelanggan-${startDate}-sampai-${endDate}.pdf`,
        headers: [
          'ID',
          'Nama',
          'Email',
          'Telepon',
          'Pesanan',
          'Total Belanja (IDR)',
          'Rata-rata Pesanan (IDR)',
        ],
        rows: customers.map((customer) => [
          customer.id,
          customer.name,
          customer.email,
          customer.phone ?? '-',
          customer.totalOrders,
          customer.totalSpent,
          customer.averageOrderValue,
        ]),
      });
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Terjadi kendala saat mengekspor laporan PDF.';
      setExportError(message);
      console.error('Export PDF customer report failed:', error);
    } finally {
      setIsExportingPdf(false);
    }
  };

  const handleSort = (column: CustomerSortBy) => {
    handleSortChange(column);
  };

  return (
    <div className="space-y-6">
      <ReportPageHeader
        title="Laporan Pelanggan"
        subtitle="Analisis aktivitas belanja, omzet transaksi, dan pertumbuhan pelanggan terdaftar."
        onRefresh={() => void refetch()}
        isRefreshing={isLoading}
        exportActions={[
          {
            format: 'csv',
            label: 'Ekspor CSV',
            onClick: handleExport,
            disabled: customers.length === 0 || hasInvalidDateRange,
          },
          {
            format: 'pdf',
            label: isExportingPdf ? 'Menyiapkan PDF…' : 'Ekspor PDF',
            onClick: () => void handleExportPdf(),
            disabled:
              customers.length === 0 ||
              hasInvalidDateRange ||
              isExportingPdf,
            busy: isExportingPdf,
          },
        ]}
      />

      <PeriodFilter
        activePreset={preset}
        startDate={startDate}
        endDate={endDate}
        rangeStartDate={data?.period.startDate ?? startDate}
        rangeEndDate={data?.period.endDate ?? endDate}
        onPresetChange={applyPreset}
        onApplyCustom={(customStart, customEnd) => {
          setStartDate(customStart);
          setEndDate(customEnd);
        }}
      />

      {exportError && (
        <div
          role="alert"
          className="rounded-2xl border border-[#F3B0A3] bg-[#FBD9D3] p-4 text-[#8C3A1E]"
        >
          <p className="text-[13px] font-semibold">Gagal mengekspor PDF</p>
          <p className="mt-1 text-[12px]">{exportError}</p>
        </div>
      )}

      {/* KPI Cards */}
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl border border-[#E8E4DC] bg-white p-5 shadow-[0_1px_2px_rgba(26,26,26,0.03)] sm:p-6">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#8A847B]">
              Total Terdaftar
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#F3F1EC] text-[#6B665F]">
              <Users size={17} strokeWidth={1.8} />
            </div>
          </div>

          <div className="mt-3 flex items-baseline gap-2">
            <span className="font-editorial text-[28px] font-semibold tracking-tight text-[#1A1A1A]">
              {summary.totalRegisteredCustomers}
            </span>
            <span className="text-[12px] text-[#8A847B]">akun</span>
          </div>

          <p className="mt-2 text-[11.5px] text-[#6B6B6B]">
            +{summary.newRegisteredCustomers} baru pada periode ini
          </p>
        </div>

        <div className="rounded-2xl border border-[#E8E4DC] bg-white p-5 shadow-[0_1px_2px_rgba(26,26,26,0.03)] sm:p-6">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#8A847B]">
              Pembeli Aktif
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#EAF5EF] text-[#226744]">
              <UserCheck size={17} strokeWidth={1.8} />
            </div>
          </div>

          <div className="mt-3 flex items-baseline gap-2">
            <span className="font-editorial text-[28px] font-semibold tracking-tight text-[#1A1A1A]">
              {summary.activePurchasingCustomers}
            </span>
            <span className="text-[12px] text-[#8A847B]">pelanggan</span>
          </div>

          <p className="mt-2 text-[11.5px] text-[#226744]">
            {summary.purchasingCustomerRatio}% dari total pelanggan
          </p>
        </div>

        <div className="rounded-2xl border border-[#E8E4DC] bg-white p-5 shadow-[0_1px_2px_rgba(26,26,26,0.03)] sm:p-6">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#8A847B]">
              Omzet Belanja
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#EEF4F9] text-[#2F5D86]">
              <ShoppingBag size={17} strokeWidth={1.8} />
            </div>
          </div>

          <div className="mt-3 flex items-baseline gap-2">
            <span className="font-editorial text-[28px] font-semibold tracking-tight text-[#1A1A1A]">
              {formatPrice(summary.totalRevenue)}
            </span>
          </div>

          <p className="mt-2 text-[11.5px] text-[#6B6B6B]">
            Dari {summary.totalOrders} pesanan sah (WIB)
          </p>
        </div>

        <div className="rounded-2xl border border-[#E8E4DC] bg-white p-5 shadow-[0_1px_2px_rgba(26,26,26,0.03)] sm:p-6">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#8A847B]">
              Rata-rata Belanja
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#F8F3EA] text-[#916B27]">
              <TrendingUp size={17} strokeWidth={1.8} />
            </div>
          </div>

          <div className="mt-3 flex items-baseline gap-2">
            <span className="font-editorial text-[28px] font-semibold tracking-tight text-[#1A1A1A]">
              {formatPrice(summary.averageSpentPerCustomer)}
            </span>
          </div>

          <p className="mt-2 text-[11.5px] text-[#8A847B]">
            Per pembeli bertransaksi di periode ini
          </p>
        </div>
      </section>

      {/* Error */}
      {error && (
        <div
          role="alert"
          className="rounded-2xl border border-[#F3B0A3] bg-[#FBD9D3] p-4 text-[#8C3A1E]"
        >
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-[13px] font-semibold">
                Gagal memuat laporan
              </p>
              <p className="mt-0.5 text-[12px] text-[#8C3A1E]/90">
                {error}
              </p>
            </div>

            <button
              type="button"
              onClick={() => void refetch()}
              disabled={isLoading}
              className="self-start rounded-xl bg-[#8C3A1E] px-3.5 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-white transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              Coba Lagi
            </button>
          </div>
        </div>
      )}

      {/* Customer Table */}
      <section className="overflow-hidden rounded-2xl border border-[#E8E4DC] bg-white shadow-[0_1px_2px_rgba(26,26,26,0.03)]">
        <div className="flex flex-col gap-3 border-b border-[#EDEAE3] px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div className="min-w-0">
            <h2 className="font-editorial text-[18px] font-medium tracking-tight text-[#1A1A1A]">
              Daftar Aktivitas Pelanggan
            </h2>

            <p className="mt-0.5 text-[12px] text-[#8A847B]">
              Urutan berdasarkan: {SORT_LABELS[sortBy]} (
              {sortOrder === 'desc'
                ? 'Terbesar ke terkecil'
                : 'Terkecil ke terbesar'}
              )
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-1 rounded-xl bg-[#F7F5F0] p-1 text-[12px]">
              {CUSTOMER_TABS.map((tab) => {
                const active = customerType === tab.id;

                return (
                  <button
                    key={tab.id}
                    type="button"
                    aria-pressed={active}
                    onClick={() => setCustomerType(tab.id)}
                    className={`rounded-lg px-3 py-1.5 font-medium transition-colors ${
                      active
                        ? 'bg-white text-[#1A1A1A] shadow-sm'
                        : 'text-[#6B6B6B] hover:text-[#1A1A1A]'
                    }`}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex flex-col gap-2 sm:items-end">
            <div className="relative w-full sm:w-[240px]">
              <Search
                size={15}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#A39E95]"
                aria-hidden="true"
              />
              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Cari pelanggan"
                aria-label="Cari pelanggan"
                className="h-10 w-full rounded-[10px] border border-[#EDEAE3] bg-[#FCFBF9] pl-9 pr-3 text-[13px] text-[#1A1A1A] placeholder:text-[#A39E95] focus:border-[#5B3F36] focus:bg-white focus:outline-none"
              />
            </div>
            <span className="text-[12px] text-[#8A847B]">
              Total {meta.total} pelanggan
            </span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-[#EDEAE3] bg-[#FAF8F5] text-[11px] font-semibold uppercase tracking-[0.12em] text-[#8A847B]">
                {(
                  [
                    { key: 'name', label: 'Pelanggan', align: 'left' },
                    {
                      key: 'registeredAt',
                      label: 'Bergabung',
                      align: 'left',
                    },
                    { key: null, label: 'Status Aktivitas', align: 'center' },
                    {
                      key: 'totalOrders',
                      label: 'Pesanan',
                      align: 'right',
                    },
                    {
                      key: 'totalSpent',
                      label: 'Total Belanja',
                      align: 'right',
                    },
                    {
                      key: null,
                      label: 'Rata-rata Pesanan',
                      align: 'right',
                    },
                    {
                      key: null,
                      label: 'Transaksi Terakhir',
                      align: 'right',
                    },
                  ] as const
                ).map((column) => (
                  <th
                    key={column.label}
                    scope="col"
                    className={`whitespace-nowrap px-4 py-3.5 ${
                      column.align === 'right'
                        ? 'text-right'
                        : column.align === 'center'
                          ? 'text-center'
                          : 'text-left'
                    }`}
                  >
                    {column.key ? (
                      <button
                        type="button"
                        onClick={() => handleSort(column.key)}
                        className="inline-flex items-center gap-1.5 hover:text-[#1A1A1A]"
                        aria-label={`Urutkan berdasarkan ${column.label}`}
                      >
                        {column.label}
                        <ArrowUpDown size={12} />
                      </button>
                    ) : (
                      column.label
                    )}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody className="divide-y divide-[#F0EDE7] text-[13px]">
              {isLoading ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-6 py-12 text-center text-[#8A847B]"
                  >
                    <span className="inline-flex items-center gap-2 text-[12px] uppercase tracking-wider">
                      <RefreshCw size={14} className="animate-spin" />
                      Memuat data pelanggan…
                    </span>
                  </td>
                </tr>
              ) : customers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-14 text-center">
                    <div className="flex flex-col items-center justify-center">
                      <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#F7F5F0] text-[#A39E95]">
                        <Users size={22} strokeWidth={1.75} />
                      </div>

                      <p className="font-editorial text-[17px] text-[#1A1A1A]">
                        Tidak ada data pelanggan
                      </p>

                      <p className="mt-1 max-w-sm text-[12px] text-[#8A847B]">
                        {search
                          ? `Tidak ditemukan pelanggan yang cocok dengan pencarian "${search}".`
                          : 'Tidak ada data pelanggan yang sesuai dengan filter atau periode yang dipilih.'}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                customers.map((customer) => (
                  <tr
                    key={customer.id}
                    className="transition-colors hover:bg-[#FCFBF9]"
                  >
                    <td className="px-5 py-4 sm:px-6">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[#D9E3EC] bg-[#EEF4F9] text-[13px] font-semibold text-[#2F5D86]">
                          {getInitials(customer.name)}
                        </div>

                        <div className="min-w-0">
                          <p className="truncate font-medium text-[#1A1A1A]">
                            {customer.name}
                          </p>

                          <div className="mt-0.5 flex min-w-0 items-center gap-3 text-[11px] text-[#8A847B]">
                            <span className="flex min-w-0 items-center gap-1">
                              <Mail size={12} className="shrink-0" />
                              <span className="truncate">
                                {customer.email}
                              </span>
                            </span>

                            {customer.phone && (
                              <span className="hidden shrink-0 items-center gap-1 sm:flex">
                                <Phone size={11} />
                                {customer.phone}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="whitespace-nowrap px-4 py-4 text-[12.5px] text-[#6B6B6B]">
                      {formatIndonesianDate(customer.registeredAt)}
                    </td>

                    <td className="whitespace-nowrap px-4 py-4 text-center">
                      {customer.hasPurchasedInPeriod ? (
                        <span className="inline-flex items-center gap-1 rounded-full border border-[#C3E4D1] bg-[#EAF5EF] px-2.5 py-0.5 text-[11px] font-medium text-[#226744]">
                          <span className="h-1.5 w-1.5 rounded-full bg-[#226744]" />
                          Aktif Belanja
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full border border-[#E5E0D8] bg-[#F7F5F0] px-2.5 py-0.5 text-[11px] font-medium text-[#787268]">
                          Belum Belanja
                        </span>
                      )}
                    </td>

                    <td className="px-4 py-4 text-right font-medium text-[#1A1A1A]">
                      {customer.totalOrders > 0 ? (
                        customer.totalOrders
                      ) : (
                        <span className="text-[#A39E95]">—</span>
                      )}
                    </td>

                    <td className="whitespace-nowrap px-4 py-4 text-right">
                      <span
                        className={
                          customer.totalSpent > 0
                            ? 'font-medium text-[#1A1A1A]'
                            : 'font-medium text-[#A39E95]'
                        }
                      >
                        {formatPrice(customer.totalSpent)}
                      </span>
                    </td>

                    <td className="whitespace-nowrap px-4 py-4 text-right text-[#6B6B6B]">
                      {customer.averageOrderValue > 0 ? (
                        formatPrice(customer.averageOrderValue)
                      ) : (
                        <span className="text-[#A39E95]">—</span>
                      )}
                    </td>

                    <td className="whitespace-nowrap px-5 py-4 text-right text-[12.5px] text-[#6B6B6B] sm:px-6">
                      {formatIndonesianDate(customer.lastOrderDate)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <footer className="flex flex-col gap-3 border-t border-[#EDEAE3] bg-[#FAF8F5] px-5 py-3.5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <p className="text-[12px] text-[#8A847B]">
            Halaman{' '}
            <span className="font-semibold text-[#1A1A1A]">
              {meta.page}
            </span>{' '}
            dari{' '}
            <span className="font-semibold text-[#1A1A1A]">
              {meta.totalPages}
            </span>{' '}
            · Menampilkan {customers.length} dari {meta.total} pelanggan
          </p>

          <div className="flex items-center gap-1.5 self-end sm:self-auto">
            <button
              type="button"
              onClick={() => setPage(Math.max(1, page - 1))}
              disabled={page <= 1 || isLoading}
              className="inline-flex items-center gap-1 rounded-lg border border-[#D9E3EC] bg-white px-3 py-1.5 text-[12px] font-medium text-[#4A4A4A] transition-colors hover:bg-[#F3F1EC] disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ChevronLeft size={14} />
              Sebelumnya
            </button>

            <button
              type="button"
              onClick={() => setPage(page + 1)}
              disabled={page >= meta.totalPages || isLoading}
              className="inline-flex items-center gap-1 rounded-lg border border-[#D9E3EC] bg-white px-3 py-1.5 text-[12px] font-medium text-[#4A4A4A] transition-colors hover:bg-[#F3F1EC] disabled:cursor-not-allowed disabled:opacity-40"
            >
              Berikutnya
              <ChevronRight size={14} />
            </button>
          </div>
        </footer>
      </section>
    </div>
  );
}
