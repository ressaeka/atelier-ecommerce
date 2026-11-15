import { useCallback, useMemo, useState } from 'react';
import { AlertCircle } from 'lucide-react';

import { api } from '../../lib/api';
import type {
  OrderStatus,
  PaginationMeta,
  SalesReportRevenueBreakdown,
  SalesReportSummary,
  SalesReportTransaction,
} from '../../types/api';
import { ADMIN_ORDER_STATUS_META } from '../components/AdminOrdersTable';
import { SalesReportFilters } from '../components/sales-report/SalesReportFilters';
import { SalesReportHeader } from '../components/sales-report/SalesReportHeader';
import { SalesReportKpi } from '../components/sales-report/SalesReportKpi';
import { SalesRevenueBreakdown } from '../components/sales-report/SalesRevenueBreakdown';
import {
  type GranularityMeta,
  type SalesChartPoint,
  SalesRevenueChart,
} from '../components/sales-report/SalesRevenueChart';
import { SalesTransactionTable } from '../components/sales-report/SalesTransactionTable';
import {
  type StatusTotals,
  TransactionStatusChart,
} from '../components/sales-report/TransactionStatusChart';
import { formatFullIndonesianDateTime } from '../components/sales-report/salesReportUtils';
import { useAdminSalesReport } from '../hooks/useAdminSalesReport';
import { exportSalesReportPdf } from '../utils/pdfReportGenerator';

const DEFAULT_SUMMARY: SalesReportSummary = {
  totalRevenue: 0,
  grossRevenue: 0,
  discountTotal: 0,
  refundTotal: 0,
  netRevenue: 0,
  totalOrders: 0,
  allStatusesOrderCount: 0,
  completedOrders: 0,
  totalItemsSold: 0,
  uniqueProductsSold: 0,
  averageOrderValue: 0,
};

const DEFAULT_METHODOLOGY = {
  recognizedStatuses: [
    'DELIVERED',
  ] as OrderStatus[],
  recognitionBasis:
    'Pendapatan sah (completed revenue) diakui secara definitif dari pesanan yang telah selesai diterima pelanggan (DELIVERED). Pesanan dalam proses (PROCESSING) dan pengiriman (SHIPPED) belum diakui sebagai pendapatan selesai.',
  cancellationPolicy:
    'Pesanan berstatus CANCELLED dan EXPIRED dikecualikan sepenuhnya (Rp 0 pendapatan diakui).',
  discountPolicy:
    'Skema database saat ini belum menerapkan potongan voucher/diskon pada level pesanan (Rp 0).',
  refundPolicy:
    'Skema database saat ini belum memiliki entitas refund parsial/penuh (Rp 0).',
  shippingPolicy:
    'Total Penjualan mencakup nilai produk (subtotal) ditambah ongkos kirim (shippingFee) pada pesanan sah.',
  doubleCountingProtection:
    'Agregasi dilakukan pada entitas Order (bukan tabel percobaan Payment) sehingga retry pembayaran tidak pernah menyebabkan double counting.',
};

const DEFAULT_META: PaginationMeta = {
  page: 1,
  limit: 10,
  total: 0,
  totalPages: 1,
};

const DEFAULT_STATUS_DISTRIBUTION: Record<OrderStatus, number> = {
  PENDING: 0,
  PAID: 0,
  PROCESSING: 0,
  SHIPPED: 0,
  DELIVERED: 0,
  CANCELLED: 0,
  EXPIRED: 0,
};

const EMPTY_TRANSACTIONS: SalesReportTransaction[] = [];

export default function AdminSalesReportPage() {
  const {
    data,
    isLoading,
    isFetching,
    error,
    periodType,
    month,
    year,
    startDate,
    endDate,
    statusFilter,
    search,
    debouncedSearch,
    page,
    lastUpdatedWib,
    selectPeriodType,
    selectMonth,
    selectYear,
    setStartDate,
    setEndDate,
    setStatusFilter,
    setSearch,
    handleSortChange,
    setPage,
    refetch,
  } = useAdminSalesReport();

  const [isExportingExcel, setIsExportingExcel] = useState(false);
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);

  const summary = data?.summary ?? DEFAULT_SUMMARY;

  const breakdown = useMemo<SalesReportRevenueBreakdown>(() => {
    if (data?.revenueBreakdown) {
      return data.revenueBreakdown;
    }
    return {
      grossProductSales: summary.totalRevenue,
      shippingRevenue: 0,
      grossRevenue: summary.totalRevenue,
      discountTotal: 0,
      discountAvailable: false,
      refundTotal: 0,
      refundAvailable: false,
      netRevenue: summary.totalRevenue,
      excludedCancelledCount: 0,
      excludedCancelledAmount: 0,
      excludedPendingCount: 0,
      excludedPendingAmount: 0,
      methodology: DEFAULT_METHODOLOGY,
    };
  }, [data?.revenueBreakdown, summary.totalRevenue]);

  const chartSeries = useMemo<SalesChartPoint[]>(() => {
    const raw = data?.trend ?? data?.dailyTrends ?? [];
    return raw.map((pt) => ({
      bucket: pt.bucket ?? pt.date,
      label: pt.label ?? pt.date,
      fullLabel: pt.fullLabel ?? pt.date,
      revenue: Number(pt.revenue ?? 0),
      orderCount: Number(pt.orderCount ?? 0),
      completedOrderCount: Number(
        pt.completedOrderCount ?? pt.orderCount ?? 0,
      ),
      itemsSold: Number(pt.itemsSold ?? 0),
    }));
  }, [data?.trend, data?.dailyTrends]);

  const hasChartRevenue = useMemo(
    () => chartSeries.some((pt) => pt.revenue > 0 || pt.orderCount > 0),
    [chartSeries],
  );

  const transactions = data?.transactions?.data ?? EMPTY_TRANSACTIONS;
  const meta = data?.transactions?.meta ?? DEFAULT_META;
  const statusDistribution =
    data?.statusDistribution ?? DEFAULT_STATUS_DISTRIBUTION;

  const statusTotals = useMemo<StatusTotals>(() => {
    const succeeded = statusDistribution.DELIVERED ?? 0;
    const pending =
      (statusDistribution.PENDING ?? 0) +
      (statusDistribution.PAID ?? 0) +
      (statusDistribution.PROCESSING ?? 0) +
      (statusDistribution.SHIPPED ?? 0);
    const cancelledOrExpired =
      (statusDistribution.CANCELLED ?? 0) + (statusDistribution.EXPIRED ?? 0);
    const total = succeeded + pending + cancelledOrExpired;
    return {
      succeeded,
      pending,
      cancelledOrExpired,
      total,
      succeededPct: total > 0 ? (succeeded / total) * 100 : 0,
      pendingPct: total > 0 ? (pending / total) * 100 : 0,
      cancelledPct: total > 0 ? (cancelledOrExpired / total) * 100 : 0,
    };
  }, [statusDistribution]);

  const granularityMeta = useMemo<GranularityMeta>(() => {
    const g = data?.period?.granularity;
    if (g === 'hourly' || periodType === 'today') {
      return {
        title: 'Tren Pendapatan per Jam (WIB)',
        subtitle:
          'Pergerakan pendapatan yang diakui setiap jam (00.00 – 23.00 WIB)',
        badge: 'Granularitas: Per Jam',
      };
    }
    if (g === 'monthly' || periodType === 'yearly') {
      return {
        title: 'Tren Pendapatan Bulanan',
        subtitle:
          'Pergerakan pendapatan yang diakui per bulan sepanjang periode tahunan',
        badge: 'Granularitas: Per Bulan',
      };
    }
    return {
      title: 'Tren Pendapatan Harian',
      subtitle:
        'Pergerakan pendapatan yang diakui per hari dari transaksi berhasil',
      badge: 'Granularitas: Per Hari',
    };
  }, [data?.period?.granularity, periodType]);

  const comparisonLabel =
    data?.period?.comparisonLabel ?? 'vs periode sebelumnya';
  const periodDisplayLabel =
    data?.period?.periodLabel ?? `${startDate} – ${endDate}`;

  const handleExportExcel = useCallback(async () => {
    if (isExportingExcel) return;
    setIsExportingExcel(true);
    setExportError(null);
    try {
      const { blob, filename } = await api.getBlob(
        '/admin/reports/sales/export',
        {
          periodType,
          month: periodType === 'monthly' ? month : undefined,
          year:
            periodType === 'monthly' || periodType === 'yearly'
              ? year
              : undefined,
          startDate,
          endDate,
          status: statusFilter,
          search: debouncedSearch || undefined,
        },
      );

      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download =
        filename || `Laporan-Pendapatan-Atelier-${endDate || startDate}.xlsx`;
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
  }, [
    isExportingExcel,
    periodType,
    month,
    year,
    startDate,
    endDate,
    statusFilter,
    debouncedSearch,
  ]);

  const handleExportCsv = useCallback(() => {
    if (!transactions.length) return;
    const headers = [
      'Tanggal Transaksi (WIB)',
      'Nomor Pesanan',
      'Nama Pelanggan',
      'Total Produk (Unit)',
      'Total Penjualan (Rp)',
      'Diskon (Rp)',
      'Refund (Rp)',
      'Pendapatan yang Diakui (Rp)',
      'Status Transaksi',
    ];
    const rows = transactions.map((t) => {
      const grossVal = t.grossAmount ?? t.total;
      const discVal = t.discount ?? 0;
      const refVal = t.refund ?? 0;
      const recVal = t.recognizedRevenue ?? (t.isRevenue ? t.total : 0);
      const custName = t.customerName ?? t.recipientName;
      return [
        `"${formatFullIndonesianDateTime(t.createdAt)}"`,
        t.orderNumber,
        `"${custName.replace(/"/g, '""')}"`,
        t.itemsCount,
        grossVal,
        discVal,
        refVal,
        recVal,
        ADMIN_ORDER_STATUS_META[t.status]?.label ?? t.status,
      ];
    });
    const csvContent =
      'data:text/csv;charset=utf-8,\uFEFF' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.href = encodedUri;
    link.download = `Laporan-Pendapatan-Atelier-${endDate || startDate}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, [transactions, endDate, startDate]);

  const handleExportPdf = useCallback(async () => {
    if (isExportingPdf || !data) return;
    setIsExportingPdf(true);
    setExportError(null);
    try {
      const statusCounts = {
        DELIVERED: { count: 0, amount: 0 },
        PROCESSING: { count: 0, amount: 0 },
        SHIPPED: { count: 0, amount: 0 },
        CANCELLED: { count: 0, amount: 0 },
      };

      for (const t of transactions) {
        const st = t.status as keyof typeof statusCounts;
        if (statusCounts[st]) {
          statusCounts[st].count += 1;
          statusCounts[st].amount += t.total;
        }
      }

      await exportSalesReportPdf({
        periodLabel: periodDisplayLabel,
        summary: {
          grossSales: summary.grossSales ?? summary.totalRevenue ?? 0,
          completedRevenue: summary.completedRevenue ?? summary.totalRevenue ?? 0,
          nonCancelledRevenue: summary.nonCancelledRevenue ?? summary.totalRevenue ?? 0,
          cancelledOrdersAmount: summary.cancelledOrdersAmount ?? statusCounts.CANCELLED.amount,
          totalOrders: summary.totalOrders ?? 0,
          succeededOrders: summary.completedOrders ?? statusCounts.DELIVERED.count,
          cancelledOrders: statusCounts.CANCELLED.count,
          averageOrderValue: summary.averageOrderValue ?? 0,
        },
        breakdown: {
          deliveredCount: statusCounts.DELIVERED.count || summary.completedOrders,
          deliveredAmount: statusCounts.DELIVERED.amount || summary.totalRevenue,
          processingCount: statusCounts.PROCESSING.count,
          processingAmount: statusCounts.PROCESSING.amount,
          shippedCount: statusCounts.SHIPPED.count,
          shippedAmount: statusCounts.SHIPPED.amount,
          cancelledCount: statusCounts.CANCELLED.count,
          cancelledAmount: statusCounts.CANCELLED.amount,
        },
        transactions: transactions.map((t) => ({
          id: t.id,
          orderNumber: t.orderNumber || `#${t.id}`,
          date: formatFullIndonesianDateTime(t.createdAt),
          customerName: t.customerName ?? t.recipientName ?? 'Pelanggan',
          paymentMethod: t.paymentMethod ?? '-',
          status: t.status,
          totalAmount: t.total,
          itemCount: t.itemsCount ?? 1,
        })),
        chartElementId: 'sales-revenue-chart-card',
      });
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : 'Terjadi kendala saat mengekspor laporan ke PDF.';
      setExportError(msg);
    } finally {
      setIsExportingPdf(false);
    }
  }, [
    isExportingPdf,
    data,
    periodDisplayLabel,
    summary,
    transactions,
  ]);

  return (
    <div className="space-y-5">
      {/* 2.A. Compact Page Header */}
      <SalesReportHeader
        lastUpdatedWib={lastUpdatedWib}
        isLoading={isLoading}
        isFetching={isFetching}
        isExportingExcel={isExportingExcel}
        isExportingPdf={isExportingPdf}
        hasTransactions={transactions.length > 0}
        hasError={Boolean(error)}
        onRefetch={refetch}
        onExportCsv={handleExportCsv}
        onExportExcel={handleExportExcel}
        onExportPdf={handleExportPdf}
      />

      {/* Export Error Alert */}
      {exportError && (
        <div
          role="alert"
          className="flex items-center justify-between rounded-2xl border border-[#F5D6D2] bg-[#FBECEA] px-4 py-3 text-[#B4382E]"
        >
          <div className="flex items-center gap-2.5">
            <AlertCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
            <div>
              <p className="text-[13px] font-semibold">
                Gagal mengekspor laporan Excel
              </p>
              <p className="text-[12px] text-[#B4382E]/90">{exportError}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setExportError(null)}
            className="rounded-lg px-2.5 py-1 text-[11.5px] font-semibold underline hover:bg-[#B4382E]/10"
          >
            Tutup
          </button>
        </div>
      )}

      {/* 2.B. Unified Period Filter & Search/Status Toolbar */}
      <SalesReportFilters
        periodType={periodType}
        month={month}
        year={year}
        startDate={startDate}
        endDate={endDate}
        statusFilter={statusFilter}
        search={search}
        periodLabel={data?.period?.periodLabel}
        comparisonLabel={data?.period?.comparisonLabel}
        onSelectPeriodType={selectPeriodType}
        onSelectMonth={selectMonth}
        onSelectYear={selectYear}
        onStartDateChange={setStartDate}
        onEndDateChange={setEndDate}
        onStatusFilterChange={setStatusFilter}
        onSearchChange={setSearch}
      />

      {/* Date Validation / API Error Alert (Previous data stays visible below!) */}
      {error && (
        <div
          role="alert"
          className="rounded-2xl border border-[#F5D6D2] bg-[#FBECEA] p-5 text-[#B4382E]"
        >
          <div className="flex items-start gap-3">
            <AlertCircle
              className="mt-0.5 h-5 w-5 shrink-0"
              aria-hidden="true"
            />
            <div>
              <p className="text-[13.5px] font-semibold">
                Tidak dapat memuat laporan penjualan
              </p>
              <p className="mt-1 text-[12.5px] text-[#B4382E]/90">{error}</p>
              <button
                type="button"
                onClick={refetch}
                className="mt-3 rounded-xl bg-[#5C4033] px-4 py-2 text-[11.5px] font-semibold text-white transition-colors hover:bg-[#3D2920]"
              >
                Coba Lagi
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2.C. Revenue Overview (4 KPI Cards) */}
      <SalesReportKpi
        summary={summary}
        kpis={data?.kpis}
        comparisonLabel={comparisonLabel}
      />

      {/* 2.D. Revenue Trend Chart & Status Distribution */}
      <section className="grid grid-cols-1 gap-5 xl:grid-cols-3">
        <SalesRevenueChart
          chartSeries={chartSeries}
          hasChartRevenue={hasChartRevenue}
          granularityMeta={granularityMeta}
          periodDisplayLabel={periodDisplayLabel}
        />

        <TransactionStatusChart
          statusDistribution={statusDistribution}
          statusTotals={statusTotals}
        />
      </section>

      {/* 2.E. Revenue Breakdown (Rincian Perhitungan Pendapatan Transparan) */}
      <SalesRevenueBreakdown breakdown={breakdown} />

      {/* 2.F. Transaction Details (Rincian Transaksi + Pagination) */}
      <SalesTransactionTable
        transactions={transactions}
        meta={meta}
        page={page}
        totalRevenue={summary.totalRevenue}
        isInitialLoading={isLoading}
        isFetching={isFetching}
        onSortChange={handleSortChange}
        onPageChange={setPage}
      />
    </div>
  );
}
