import React, { useMemo } from 'react';
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  CreditCard,
  DollarSign,
  Download,
  FileSpreadsheet,
  PackageCheck,
  RefreshCw,
  Search,
  ShoppingBag,
  TrendingUp,
} from 'lucide-react';
import { api } from '../../lib/api';
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import {
  useAdminSalesReport,
  type ReportPreset,
} from '../hooks/useAdminSalesReport';
import { ADMIN_ORDER_STATUS_META } from '../components/AdminOrdersTable';
import { formatPrice } from '../../lib/utils';
import type { OrderStatus } from '../../types/api';

const PRESET_BUTTONS: Array<{ id: ReportPreset; label: string }> = [
  { id: 'today', label: 'Hari Ini' },
  { id: '7d', label: '7 Hari Terakhir' },
  { id: '30d', label: '30 Hari Terakhir' },
  { id: 'this_month', label: 'Bulan Ini' },
];

const STATUS_OPTIONS: Array<{ value: string; label: string }> = [
  { value: 'ALL', label: 'Semua Status' },
  { value: 'PAID', label: 'Dibayar' },
  { value: 'PROCESSING', label: 'Diproses' },
  { value: 'SHIPPED', label: 'Dikirim' },
  { value: 'DELIVERED', label: 'Selesai' },
  { value: 'PENDING', label: 'Menunggu Pembayaran' },
  { value: 'CANCELLED', label: 'Dibatalkan' },
  { value: 'EXPIRED', label: 'Kedaluwarsa' },
];

function formatIndonesianDateLabel(dateYmd: string): string {
  const parts = dateYmd.split('-');
  if (parts.length !== 3) return dateYmd;
  const months = [
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
  const mIdx = Number(parts[1]) - 1;
  return `${Number(parts[2])} ${months[mIdx] ?? parts[1]}`;
}

function formatFullIndonesianDateTime(isoString: string): string {
  try {
    return new Date(isoString).toLocaleString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return isoString;
  }
}

function formatCompactRp(value: number): string {
  if (value >= 1_000_000_000) {
    return `${(value / 1_000_000_000).toFixed(1)} M`;
  }
  if (value >= 1_000_000) {
    return `${(value / 1_000_000).toFixed(value % 1_000_000 === 0 ? 0 : 1)} jt`;
  }
  if (value >= 1_000) {
    return `${Math.round(value / 1_000)} rb`;
  }
  return String(value);
}

export default function AdminSalesReportPage() {
  const {
    data,
    isLoading,
    error,
    preset,
    startDate,
    endDate,
    statusFilter,
    search,
    page,
    applyPreset,
    setStartDate,
    setEndDate,
    setStatusFilter,
    setSearch,
    setPage,
    refetch,
  } = useAdminSalesReport();

  const chartData = useMemo(() => {
    if (!data?.dailyTrends) return [];
    return data.dailyTrends.map((point) => ({
      ...point,
      formattedDate: formatIndonesianDateLabel(point.date),
    }));
  }, [data?.dailyTrends]);

  const summary = data?.summary ?? {
    totalRevenue: 0,
    totalOrders: 0,
    completedOrders: 0,
    totalItemsSold: 0,
    averageOrderValue: 0,
  };

  const transactions = data?.transactions?.data ?? [];
  const meta = data?.transactions?.meta ?? {
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1,
  };

  const statusDistribution = data?.statusDistribution ?? {
    PENDING: 0,
    PAID: 0,
    PROCESSING: 0,
    SHIPPED: 0,
    DELIVERED: 0,
    CANCELLED: 0,
    EXPIRED: 0,
  };

  const [isExportingExcel, setIsExportingExcel] = React.useState(false);
  const [exportError, setExportError] = React.useState<string | null>(null);

  const handleExportExcel = async () => {
    if (isExportingExcel) return;
    setIsExportingExcel(true);
    setExportError(null);
    try {
      const { blob, filename } = await api.getBlob(
        '/admin/reports/sales/export',
        {
          startDate,
          endDate,
          status: statusFilter,
          search: search.trim() || undefined,
        },
      );

      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download =
        filename || `atelier-laporan-penjualan-${startDate}-${endDate}.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : 'Terjadi kendala saat mengekspor laporan ke Excel.';
      setExportError(msg);
    } finally {
      setIsExportingExcel(false);
    }
  };

  const handleExportCsv = () => {
    if (!transactions.length) return;
    const headers = [
      'ID Pesanan',
      'Tanggal (WIB)',
      'Pelanggan',
      'Telepon',
      'Kota & Provinsi',
      'Status',
      'Kategori Omzet',
      'Metode Pembayaran',
      'Jumlah Item',
      'Subtotal',
      'Ongkir',
      'Total',
    ];
    const rows = transactions.map((t) => [
      t.orderNumber,
      t.dateWib,
      `"${t.recipientName.replace(/"/g, '""')}"`,
      `"${(t.phone ?? '').replace(/"/g, '""')}"`,
      `"${[t.city, t.province].filter(Boolean).join(', ').replace(/"/g, '""')}"`,
      t.status,
      t.isRevenue ? 'Omzet Sah' : 'Bukan Omzet',
      t.paymentMethod ?? '-',
      t.itemsCount,
      t.subtotal,
      t.shippingFee,
      t.total,
    ]);
    const csvContent =
      'data:text/csv;charset=utf-8,\uFEFF' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.href = encodedUri;
    link.download = `atelier-laporan-penjualan-${startDate}-${endDate}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#8A847B]">
            Admin · Laporan
          </p>
          <h1 className="mt-1.5 font-editorial text-[26px] font-medium tracking-tight text-[#1A1A1A] sm:text-[30px]">
            Laporan Penjualan
          </h1>
          <p className="mt-1.5 text-[13px] text-[#6B6B6B]">
            Ringkasan pendapatan, omzet sah, performa transaksi, dan tren penjualan toko.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={handleExportExcel}
            disabled={isExportingExcel || isLoading}
            className="inline-flex items-center gap-2 rounded-xl border border-[#C7D9E8] bg-[#F2F7FA] px-3.5 py-2.5 text-[12px] font-semibold text-[#20496E] transition-all hover:bg-[#E5F0F7] disabled:cursor-not-allowed disabled:opacity-50"
            title="Download seluruh hasil laporan format Excel (.xlsx)"
          >
            {isExportingExcel ? (
              <RefreshCw size={15} className="animate-spin text-[#2F5D86]" />
            ) : (
              <FileSpreadsheet size={15} className="text-[#2F5D86]" strokeWidth={1.8} />
            )}
            <span>{isExportingExcel ? 'Mengekspor…' : 'Ekspor Excel (.xlsx)'}</span>
          </button>

          <button
            type="button"
            onClick={handleExportCsv}
            disabled={transactions.length === 0 || isLoading}
            className="inline-flex items-center gap-2 rounded-xl border border-[#D9E3EC] bg-white px-3.5 py-2.5 text-[12px] font-semibold text-[#1A1A1A] transition-colors hover:bg-[#F3F1EC] disabled:cursor-not-allowed disabled:opacity-40"
            title="Download transaksi halaman ini format CSV"
          >
            <Download size={15} strokeWidth={1.8} />
            Ekspor CSV
          </button>

          <button
            type="button"
            onClick={refetch}
            disabled={isLoading}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#D9E3EC] bg-white px-3.5 py-2.5 text-[12px] font-semibold text-[#4A4A4A] transition-colors hover:bg-[#F3F1EC] disabled:opacity-50"
          >
            <RefreshCw
              size={14}
              className={isLoading ? 'animate-spin' : undefined}
            />
            Refresh Data
          </button>
        </div>
      </header>

      {/* Export Error Alert */}
      {exportError && (
        <div
          role="alert"
          className="rounded-2xl border border-[#F3B0A3] bg-[#FBD9D3] p-4 text-[#8C3A1E]"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[13px] font-semibold">Gagal mengekspor file Excel</p>
              <p className="mt-0.5 text-[12px] text-[#8C3A1E]/90">{exportError}</p>
            </div>
            <button
              type="button"
              onClick={() => setExportError(null)}
              className="text-[11px] font-semibold uppercase tracking-wider underline hover:opacity-80"
            >
              Tutup
            </button>
          </div>
        </div>
      )}

      {/* Filter Card */}
      <section className="rounded-2xl border border-[#E8E4DC] bg-white p-5 shadow-[0_1px_2px_rgba(26,26,26,0.03)] sm:p-6">
        <div className="flex flex-col gap-4">
          {/* Preset Buttons + Custom Date Picker */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="mr-1 text-[11px] font-semibold uppercase tracking-[0.1em] text-[#8A847B]">
                Periode:
              </span>
              {PRESET_BUTTONS.map((btn) => (
                <button
                  key={btn.id}
                  type="button"
                  onClick={() => applyPreset(btn.id)}
                  className={`rounded-xl px-3 py-1.5 text-[12px] font-medium transition-colors ${
                    preset === btn.id
                      ? 'bg-[#1A1A1A] text-white shadow-sm'
                      : 'border border-[#E8E4DC] bg-[#FAFAF8] text-[#4A4A4A] hover:bg-[#F0EDE7]'
                  }`}
                >
                  {btn.label}
                </button>
              ))}
              <span
                className={`rounded-xl px-3 py-1.5 text-[12px] font-medium ${
                  preset === 'custom'
                    ? 'bg-[#2F5D86] text-white'
                    : 'text-[#8A847B]'
                }`}
              >
                {preset === 'custom' ? 'Kustom Terpilih' : ''}
              </span>
            </div>

            {data?.period && (
              <span className="text-[12px] text-[#8A847B]">
                Zona Waktu: <strong className="font-semibold text-[#1A1A1A]">{data.period.timezone} (WIB)</strong>
              </span>
            )}
          </div>

          {/* Date inputs & Status dropdown */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="startDateInput" className="text-[11px] font-medium text-[#6B6B6B]">
                Dari Tanggal
              </label>
              <div className="relative">
                <input
                  id="startDateInput"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="h-10 w-full rounded-xl border border-[#E8E4DC] bg-[#FAFAF8] px-3 text-[12px] text-[#1A1A1A] focus:border-[#B7C9D9] focus:bg-white focus:outline-none"
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="endDateInput" className="text-[11px] font-medium text-[#6B6B6B]">
                Sampai Tanggal
              </label>
              <div className="relative">
                <input
                  id="endDateInput"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="h-10 w-full rounded-xl border border-[#E8E4DC] bg-[#FAFAF8] px-3 text-[12px] text-[#1A1A1A] focus:border-[#B7C9D9] focus:bg-white focus:outline-none"
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="statusSelect" className="text-[11px] font-medium text-[#6B6B6B]">
                Status Pesanan
              </label>
              <select
                id="statusSelect"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="h-10 w-full rounded-xl border border-[#E8E4DC] bg-[#FAFAF8] px-3 text-[12px] text-[#1A1A1A] focus:border-[#B7C9D9] focus:bg-white focus:outline-none"
              >
                {STATUS_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="searchInput" className="text-[11px] font-medium text-[#6B6B6B]">
                Pencarian Transaksi
              </label>
              <div className="relative">
                <Search
                  size={14}
                  className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#A39E95]"
                />
                <input
                  id="searchInput"
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Cari penerima / no. pesanan..."
                  className="h-10 w-full rounded-xl border border-[#E8E4DC] bg-[#FAFAF8] pl-8 pr-3 text-[12px] text-[#1A1A1A] placeholder:text-[#A39E95] focus:border-[#B7C9D9] focus:bg-white focus:outline-none"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Error Alert */}
      {error && (
        <div
          role="alert"
          className="rounded-2xl border border-[#F3B0A3] bg-[#FBD9D3] p-5 text-[#8C3A1E]"
        >
          <p className="text-[13px] font-semibold">Kendala Memuat Laporan Penjualan</p>
          <p className="mt-1 text-[12px] opacity-90">{error}</p>
          <button
            type="button"
            onClick={refetch}
            className="mt-3 rounded-xl bg-[#8C3A1E] px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.1em] text-white hover:bg-[#722e17]"
          >
            Coba Lagi
          </button>
        </div>
      )}

      {/* Summary KPI Cards */}
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {/* Total Omzet */}
        <div className="relative overflow-hidden rounded-2xl border border-[#E8E4DC] bg-white p-5 shadow-[0_1px_2px_rgba(26,26,26,0.03)] sm:p-6">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#8A847B]">
              Total Omzet Sah
            </span>
            <div className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-[#E8F1F8] text-[#2F5D86]">
              <DollarSign size={17} strokeWidth={2} />
            </div>
          </div>
          <p className="mt-3 font-editorial text-[25px] font-semibold tracking-tight text-[#1A1A1A]">
            {formatPrice(summary.totalRevenue)}
          </p>
          <p className="mt-1 text-[11px] text-[#8A847B]">
            Pendapatan dari pesanan berstatus dibayar/selesai
          </p>
          <div className="mt-3 inline-block rounded-md bg-[#EEF4F9] px-2 py-0.5 text-[10px] font-medium text-[#2F5D86]">
            PAID · PROCESSING · SHIPPED · DELIVERED
          </div>
        </div>

        {/* Transaksi Selesai / Memenuhi Syarat */}
        <div className="rounded-2xl border border-[#E8E4DC] bg-white p-5 shadow-[0_1px_2px_rgba(26,26,26,0.03)] sm:p-6">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#8A847B]">
              Pesanan Berhasil
            </span>
            <div className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-[#E4F4EA] text-[#3D8B5C]">
              <PackageCheck size={17} strokeWidth={2} />
            </div>
          </div>
          <p className="mt-3 font-editorial text-[25px] font-semibold tracking-tight text-[#1A1A1A]">
            {summary.completedOrders} <span className="font-sans text-[14px] font-normal text-[#6B6B6B]">pesanan</span>
          </p>
          <p className="mt-1 text-[11px] text-[#8A847B]">
            Dari total {summary.totalOrders} transaksi dalam rentang periode
          </p>
        </div>

        {/* Rata-rata Nilai Pesanan (AOV) */}
        <div className="rounded-2xl border border-[#E8E4DC] bg-white p-5 shadow-[0_1px_2px_rgba(26,26,26,0.03)] sm:p-6">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#8A847B]">
              Rata-rata Order (AOV)
            </span>
            <div className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-[#FDF0E0] text-[#A67C3D]">
              <TrendingUp size={17} strokeWidth={2} />
            </div>
          </div>
          <p className="mt-3 font-editorial text-[25px] font-semibold tracking-tight text-[#1A1A1A]">
            {formatPrice(summary.averageOrderValue)}
          </p>
          <p className="mt-1 text-[11px] text-[#8A847B]">
            Rata-rata omzet per pesanan yang berhasil
          </p>
        </div>

        {/* Total Item Terjual */}
        <div className="rounded-2xl border border-[#E8E4DC] bg-white p-5 shadow-[0_1px_2px_rgba(26,26,26,0.03)] sm:p-6">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#8A847B]">
              Produk Terjual
            </span>
            <div className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-[#F4F8FB] text-[#4A7BA8]">
              <ShoppingBag size={17} strokeWidth={2} />
            </div>
          </div>
          <p className="mt-3 font-editorial text-[25px] font-semibold tracking-tight text-[#1A1A1A]">
            {summary.totalItemsSold} <span className="font-sans text-[14px] font-normal text-[#6B6B6B]">item</span>
          </p>
          <p className="mt-1 text-[11px] text-[#8A847B]">
            Total kuantitas item dari pesanan terkonfirmasi
          </p>
        </div>
      </section>

      {/* Visual Charts & Status Distribution */}
      <section className="grid grid-cols-1 gap-5 xl:grid-cols-3">
        {/* Trend Omzet Harian */}
        <div className="rounded-2xl border border-[#E8E4DC] bg-white p-5 shadow-[0_1px_2px_rgba(26,26,26,0.03)] sm:p-6 xl:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="font-editorial text-[18px] font-medium tracking-tight text-[#1A1A1A]">
                Tren Pendapatan Penjualan
              </h2>
              <p className="text-[12px] text-[#8A847B]">
                Perkembangan omzet harian sepanjang rentang waktu yang dipilih
              </p>
            </div>
          </div>

          <div className="h-[280px] w-full sm:h-[300px]">
            {chartData.length === 0 ? (
              <div className="flex h-full items-center justify-center text-[12px] text-[#8A847B]">
                Belum ada data grafik untuk periode ini
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={chartData}
                  margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="salesReportGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#2F5D86" stopOpacity={0.25} />
                      <stop offset="100%" stopColor="#2F5D86" stopOpacity={0.01} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke="#EDEAE3" vertical={false} />
                  <XAxis
                    dataKey="formattedDate"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#8A847B', fontSize: 11 }}
                    dy={6}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#8A847B', fontSize: 11 }}
                    tickFormatter={formatCompactRp}
                    width={56}
                  />
                  <Tooltip
                    contentStyle={{
                      borderRadius: 12,
                      border: '1px solid #E8E4DC',
                      boxShadow: '0 8px 24px rgba(26,26,26,0.06)',
                      fontSize: 12,
                      fontFamily: 'Inter, sans-serif',
                    }}
                    formatter={(value: number | string) => [
                      formatPrice(Number(value)),
                      'Omzet',
                    ]}
                    labelStyle={{ color: '#1A1A1A', fontWeight: 600 }}
                  />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stroke="#2F5D86"
                    strokeWidth={2}
                    fill="url(#salesReportGrad)"
                    activeDot={{ r: 4, fill: '#2F5D86', stroke: '#fff', strokeWidth: 2 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Status Distribution Summary */}
        <div className="flex flex-col justify-between rounded-2xl border border-[#E8E4DC] bg-white p-5 shadow-[0_1px_2px_rgba(26,26,26,0.03)] sm:p-6">
          <div>
            <h2 className="font-editorial text-[18px] font-medium tracking-tight text-[#1A1A1A]">
              Distribusi Status Pesanan
            </h2>
            <p className="mt-1 text-[12px] text-[#8A847B]">
              Total pesanan berdasarkan status pada periode ini
            </p>

            <ul className="mt-4 space-y-2.5">
              {(
                [
                  'PAID',
                  'PROCESSING',
                  'SHIPPED',
                  'DELIVERED',
                  'PENDING',
                  'CANCELLED',
                  'EXPIRED',
                ] as OrderStatus[]
              ).map((st) => {
                const count = statusDistribution[st] ?? 0;
                const metaItem = ADMIN_ORDER_STATUS_META[st];
                return (
                  <li
                    key={st}
                    className="flex items-center justify-between rounded-xl border border-[#F0EDE7] bg-[#FCFBF9] px-3.5 py-2.5 text-[12px]"
                  >
                    <span className="flex items-center gap-2 font-medium text-[#4A4A4A]">
                      <span
                        className={`h-2 w-2 rounded-full ${metaItem?.dotClassName ?? 'bg-gray-400'}`}
                      />
                      {metaItem?.label ?? st}
                    </span>
                    <span className="font-editorial text-[14px] font-semibold text-[#1A1A1A]">
                      {count}
                    </span>
                  </li>
                );
              })}
            </ul>
          </div>

          <div className="mt-4 rounded-xl border border-[#EDEAE3] bg-[#FAFAF8] p-3 text-[11px] text-[#6B6B6B]">
            * Hanya status <strong>Dibayar, Diproses, Dikirim,</strong> dan <strong>Selesai</strong> yang diakui sebagai omzet toko.
          </div>
        </div>
      </section>

      {/* Transactions Table Section */}
      <section className="overflow-hidden rounded-2xl border border-[#E8E4DC] bg-white shadow-[0_1px_2px_rgba(26,26,26,0.03)]">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#F0EDE7] px-5 py-4 sm:px-6">
          <div>
            <h2 className="font-editorial text-[18px] font-medium tracking-tight text-[#1A1A1A]">
              Daftar Transaksi Periode Ini
            </h2>
            <p className="mt-0.5 text-[12px] text-[#8A847B]">
              {meta.total} transaksi tercatat sesuai parameter filter
            </p>
          </div>
          <span className="text-[11px] uppercase tracking-[0.1em] text-[#8A847B]">
            Halaman {meta.page} dari {Math.max(meta.totalPages, 1)}
          </span>
        </div>

        {/* Loading Indicator */}
        {isLoading && transactions.length === 0 && (
          <div className="flex min-h-[30vh] items-center justify-center">
            <p className="text-[11px] uppercase tracking-[0.22em] text-[#8A847B]">
              Memuat data transaksi laporan…
            </p>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && transactions.length === 0 && (
          <div className="flex min-h-[35vh] flex-col items-center justify-center px-6 py-12 text-center">
            <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-[#EEF4F9] text-[#4A7BA8]">
              <Calendar size={20} strokeWidth={1.6} />
            </div>
            <p className="font-editorial text-[17px] text-[#1A1A1A]">
              Tidak Ada Transaksi Ditemukan
            </p>
            <p className="mt-2 max-w-md text-[12px] leading-relaxed text-[#8A847B]">
              Tidak ada riwayat transaksi penjualan yang sesuai dengan filter tanggal atau status yang Anda tentukan. Silakan ubah rentang tanggal atau kata kunci pencarian.
            </p>
          </div>
        )}

        {/* Table */}
        {transactions.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[840px] border-collapse text-left">
              <thead>
                <tr className="border-b border-[#F0EDE7] bg-[#FAFAF8]">
                  {[
                    'No',
                    'Tanggal (WIB)',
                    'No. Pesanan',
                    'Pelanggan & Lokasi',
                    'Rincian Produk',
                    'Total',
                    'Metode Bayar',
                    'Status',
                  ].map((col) => (
                    <th
                      key={col}
                      className="whitespace-nowrap px-4 py-3 text-[10.5px] font-semibold uppercase tracking-[0.1em] text-[#8A847B]"
                    >
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {transactions.map((tx, idx) => {
                  const statusMeta =
                    ADMIN_ORDER_STATUS_META[tx.status] ??
                    ADMIN_ORDER_STATUS_META.PENDING;
                  const rowNumber = (meta.page - 1) * meta.limit + idx + 1;

                  return (
                    <tr
                      key={tx.id}
                      className="border-b border-[#F5F2EC] transition-colors last:border-0 hover:bg-[#FCFBF9]"
                    >
                      <td className="px-4 py-3.5 text-[12px] text-[#8A847B]">
                        {rowNumber}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3.5 text-[12px] text-[#4A4A4A]">
                        {formatFullIndonesianDateTime(tx.createdAt)}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3.5 font-editorial text-[13px] font-semibold text-[#1A1A1A]">
                        {tx.orderNumber}
                      </td>
                      <td className="px-4 py-3.5 text-[12px] text-[#4A4A4A]">
                        <p className="font-medium text-[#1A1A1A]">{tx.recipientName}</p>
                        <p className="mt-0.5 text-[11px] text-[#8A847B]">
                          {[tx.city, tx.province].filter(Boolean).join(', ') || '-'}
                        </p>
                      </td>
                      <td className="px-4 py-3.5 text-[12px] text-[#4A4A4A]">
                        {tx.items.map((it) => (
                          <div key={it.id} className="text-[11.5px] leading-tight">
                            <span className="font-medium text-[#1A1A1A]">{it.productName}</span>
                            <span className="text-[#8A847B]"> x{it.quantity}</span>
                            {it.variant && (
                              <span className="text-[10.5px] text-[#8A847B]"> ({it.variant})</span>
                            )}
                          </div>
                        ))}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3.5 text-[12.5px] font-semibold text-[#1A1A1A]">
                        {formatPrice(tx.total)}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3.5 text-[12px] text-[#4A4A4A]">
                        {tx.paymentMethod ? (
                          <span className="inline-flex items-center gap-1 rounded-md bg-[#FAFAF8] px-2 py-1 text-[11px] font-medium text-[#4A4A4A] border border-[#EDEAE3]">
                            <CreditCard size={12} className="text-[#8A847B]" />
                            {tx.paymentMethod}
                          </span>
                        ) : (
                          <span className="text-[11px] text-[#A39E95]">-</span>
                        )}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3.5">
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium ${statusMeta.className}`}
                        >
                          <span
                            className={`h-1.5 w-1.5 rounded-full ${statusMeta.dotClassName}`}
                          />
                          {statusMeta.label}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Footer */}
        {transactions.length > 0 && meta.totalPages > 1 && (
          <div className="flex flex-col gap-4 border-t border-[#F0EDE7] px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <p className="text-[12px] text-[#8A847B]">
              Menampilkan {transactions.length} dari {meta.total} transaksi
            </p>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setPage(Math.max(page - 1, 1))}
                disabled={page <= 1 || isLoading}
                className="flex h-8 items-center gap-1 rounded-lg px-2.5 text-[12px] font-medium text-[#6B6B6B] transition-colors hover:bg-[#F3F1EC] disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ChevronLeft size={14} />
                Sebelumnya
              </button>

              {(() => {
                const windowSize = 5;
                const half = Math.floor(windowSize / 2);
                const start = Math.max(1, Math.min(page - half, meta.totalPages - windowSize + 1));
                const end = Math.min(meta.totalPages, start + windowSize - 1);
                const pages: (number | '…')[] = [];
                if (start > 1) { pages.push(1); if (start > 2) pages.push('…'); }
                for (let p = start; p <= end; p++) pages.push(p);
                if (end < meta.totalPages) { if (end < meta.totalPages - 1) pages.push('…'); pages.push(meta.totalPages); }
                return pages.map((pNum, idx) =>
                  pNum === '…' ? (
                    <span key={`e-${idx}`} className="px-1 text-[12px] text-[#8A847B]">…</span>
                  ) : (
                    <button
                      key={pNum}
                      type="button"
                      onClick={() => setPage(pNum as number)}
                      disabled={isLoading}
                      className={`h-8 min-w-8 rounded-lg px-2 text-[12px] font-medium transition-colors ${
                        page === pNum ? 'bg-[#EEF4F9] text-[#2F5D86]' : 'text-[#6B6B6B] hover:bg-[#F3F1EC]'
                      }`}
                    >
                      {pNum}
                    </button>
                  ),
                );
              })()}

              <button
                type="button"
                onClick={() => setPage(Math.min(page + 1, meta.totalPages))}
                disabled={page >= meta.totalPages || isLoading}
                className="flex h-8 items-center gap-1 rounded-lg px-2.5 text-[12px] font-medium text-[#6B6B6B] transition-colors hover:bg-[#F3F1EC] disabled:cursor-not-allowed disabled:opacity-40"
              >
                Berikutnya
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
