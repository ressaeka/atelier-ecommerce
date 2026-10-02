import { useCallback, useEffect, useState } from 'react';
import { api } from '../../lib/api';
import {
  ADMIN_REPORT_PROMO,
  ORDER_STATUS_LABEL,
  type AdminDashboardData,
  type AdminOrderStatus,
  type AdminSalesPoint,
} from '../data/adminDashboardMockData';

/** Shape returned by GET /api/v1/admin/dashboard (success envelope unwrapped by api client). */
interface AdminDashboardApiResponse {
  kpis: {
    totalOrders: number;
    totalCustomers: number;
    totalProducts: number;
    revenueToday: number;
    pendingOrders: number;
    deliveredOrders: number;
    newOrdersToday: number;
    toShipOrders: number;
    lowStockCount: number;
  };
  salesChart: Array<{ date: string; revenue: number }>;
  recentOrders: Array<{
    id: number;
    orderNumber: string;
    customerName: string;
    createdAt: string;
    total: number;
    status: string;
  }>;
  bestSellingProducts: Array<{
    rank: number;
    productId: number;
    name: string;
    sold: number;
    image: string | null;
  }>;
  salesReport: {
    rows: Array<{
      no: number;
      date: string;
      orderNumber: string;
      customerName: string;
      product: string;
      quantity: number;
      total: number;
      status: string;
    }>;
    totalOrders: number;
    rangeLabel: string;
  };
  paymentMethods: Array<{
    id: string;
    name: string;
    percentage: number;
    orders: number;
  }>;
  paymentMethodsAvailable: boolean;
  // paymentMethods come from backend — display names + percentages are authoritative there
  comparisons: {
    orders: { current: number; previous: number; percent: number | null };
    revenue: { current: number; previous: number; percent: number | null };
    customers: { current: number; previous: number; percent: number | null };
  };
  lowStockThreshold: number;
  timezone: string;
}

export interface AdminDashboardState {
  data: AdminDashboardData;
  isLoading: boolean;
  error: string | null;
  usingMock: boolean;
  refetch: () => void;
}

function formatRpId(value: number): string {
  return `Rp ${new Intl.NumberFormat('id-ID').format(Math.round(value))}`;
}

function formatChartLabel(dateYmd: string): string {
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
  const monthIndex = Number(parts[1]) - 1;
  return `${Number(parts[2])} ${months[monthIndex] ?? parts[1]}`;
}

function formatDateLabel(iso: string): string {
  try {
    return new Date(iso).toLocaleString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return iso;
  }
}

function toAdminStatus(status: string): AdminOrderStatus {
  return ORDER_STATUS_LABEL[status] ?? 'Menunggu';
}

function comparisonText(
  percent: number | null,
  label: string,
): { text: string; trend: 'up' | 'down' | 'flat' } {
  if (percent === null) {
    return { text: `— ${label} baru hari ini`, trend: 'flat' };
  }
  if (Math.abs(percent) < 0.05) {
    return { text: `— tidak berubah`, trend: 'flat' };
  }
  const rounded = Math.abs(percent).toFixed(percent % 1 === 0 ? 0 : 1);
  if (percent > 0) {
    return { text: `↑ ${rounded}% dari kemarin`, trend: 'up' };
  }
  return { text: `↓ ${rounded}% dari kemarin`, trend: 'down' };
}

function mapDashboardResponse(
  response: AdminDashboardApiResponse,
): AdminDashboardData {
  const revenueComparison = comparisonText(
    response.comparisons.revenue.percent,
    'pendapatan',
  );
  const ordersComparison = comparisonText(
    response.comparisons.orders.percent,
    'pesanan',
  );
  const customersComparison = comparisonText(
    response.comparisons.customers.percent,
    'pelanggan',
  );

  const salesChart: AdminSalesPoint[] = response.salesChart.map((point) => ({
    label: formatChartLabel(point.date),
    revenue: point.revenue,
  }));

  return {
    isMock: false,
    paymentMethodsAvailable: response.paymentMethodsAvailable,
    todaySummary: {
      newOrders: response.kpis.newOrdersToday,
      toShip: response.kpis.toShipOrders,
      lowStock: response.kpis.lowStockCount,
    },
    kpis: [
      {
        id: 'total-pesanan',
        label: 'Total Pesanan',
        value: String(response.kpis.totalOrders),
        rawValue: response.kpis.totalOrders,
        comparison: ordersComparison.text,
        comparisonTrend: ordersComparison.trend,
      },
      {
        id: 'total-pelanggan',
        label: 'Total Pelanggan',
        value: String(response.kpis.totalCustomers),
        rawValue: response.kpis.totalCustomers,
        comparison: customersComparison.text,
        comparisonTrend: customersComparison.trend,
      },
      {
        id: 'total-produk',
        label: 'Total Produk',
        value: String(response.kpis.totalProducts),
        rawValue: response.kpis.totalProducts,
        comparison: '— total keseluruhan',
        comparisonTrend: 'flat',
      },
      {
        id: 'pendapatan-hari-ini',
        label: 'Pendapatan Hari Ini',
        value: formatRpId(response.kpis.revenueToday),
        rawValue: response.kpis.revenueToday,
        comparison: revenueComparison.text,
        comparisonTrend: revenueComparison.trend,
      },
    ],
    salesChart,
    // Authoritative payment methods from backend (no FE fabrication)
    paymentMethods: response.paymentMethods.map((method) => ({
      id: method.id,
      name: method.name,
      percentage: method.percentage,
      orders: method.orders,
    })),
    paymentCenter: {
      label: 'Total Pesanan',
      value: `${response.kpis.totalOrders} Pesanan`,
    },
    recentOrders: response.recentOrders.map((order) => ({
      id: String(order.id),
      orderNumber: order.orderNumber,
      customerName: order.customerName,
      dateLabel: formatDateLabel(order.createdAt),
      total: order.total,
      status: toAdminStatus(order.status),
    })),
    bestSellingProducts: response.bestSellingProducts.map((item) => ({
      rank: item.rank,
      name: item.name,
      sold: item.sold,
      image: item.image ?? '',
    })),
    salesReport: {
      rows: response.salesReport.rows.map((row) => ({
        no: row.no,
        date: row.date.split('-').reverse().join(' '),
        orderNumber: row.orderNumber,
        customerName: row.customerName,
        product: row.product,
        quantity: row.quantity,
        total: row.total,
        status: toAdminStatus(row.status),
      })),
      totalOrders: response.salesReport.totalOrders,
      rangeLabel: response.salesReport.rangeLabel,
    },
    reportPromo: ADMIN_REPORT_PROMO,
  };
}

/**
 * Production dashboard data source.
 * Single request → GET /admin/dashboard (ADMIN JWT).
 * Financial aggregates are owned by the backend.
 */
export function useAdminDashboardData(): AdminDashboardState {
  const [data, setData] = useState<AdminDashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  const refetch = useCallback(() => {
    setReloadKey((k) => k + 1);
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setIsLoading(true);
      setError(null);
      try {
        const response = await api.get<AdminDashboardApiResponse>(
          '/admin/dashboard',
        );
        if (cancelled) return;
        setData(mapDashboardResponse(response));
      } catch (err) {
        if (cancelled) return;
        void err;
        setError('Gagal memuat dashboard. Silakan coba lagi.');
        setData(null);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [reloadKey]);

  return {
    data:
      data ??
      ({
        isMock: false,
        paymentMethodsAvailable: false,
        todaySummary: { newOrders: 0, toShip: 0, lowStock: 0 },
        kpis: [],
        salesChart: [],
        paymentMethods: [],
        paymentCenter: { label: 'Total', value: '0 Pesanan' },
        recentOrders: [],
        bestSellingProducts: [],
        salesReport: { rows: [], totalOrders: 0, rangeLabel: '' },
        reportPromo: ADMIN_REPORT_PROMO,
      } satisfies AdminDashboardData),
    isLoading,
    error,
    usingMock: false,
    refetch,
  };
}
