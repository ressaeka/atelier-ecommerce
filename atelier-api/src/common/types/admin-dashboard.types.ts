/**
 * Admin Dashboard API types.
 * Shared by AdminDashboardController / Service on the backend.
 */

export type AdminOrderStatus =
  | 'PENDING'
  | 'PAID'
  | 'PROCESSING'
  | 'SHIPPED'
  | 'DELIVERED'
  | 'CANCELLED'
  | 'EXPIRED';

export interface AdminDashboardKpis {
  totalOrders: number;
  totalCustomers: number;
  totalProducts: number;
  revenueToday: number;
  pendingOrders: number;
  deliveredOrders: number;
  newOrdersToday: number;
  toShipOrders: number;
  lowStockCount: number;
}

export interface AdminDashboardSalesPoint {
  date: string; // YYYY-MM-DD
  revenue: number;
}

export interface AdminDashboardRecentOrder {
  id: number;
  orderNumber: string;
  customerName: string;
  createdAt: string;
  total: number;
  status: AdminOrderStatus;
}

export interface AdminDashboardBestProduct {
  rank: number;
  productId: number;
  name: string;
  sold: number;
  image: string | null;
}

export interface AdminDashboardStatusDistribution {
  PENDING: number;
  PAID: number;
  PROCESSING: number;
  SHIPPED: number;
  DELIVERED: number;
  CANCELLED: number;
  EXPIRED: number;
}

export interface AdminDashboardKpiComparison {
  current: number;
  previous: number;
  /** Percentage change vs previous period; null when previous is 0 */
  percent: number | null;
}

export interface AdminDashboardSalesReportRow {
  no: number;
  date: string;
  orderNumber: string;
  customerName: string;
  product: string;
  quantity: number;
  total: number;
  status: AdminOrderStatus;
}

export type AdminPaymentMethodId =
  'GOPAY' | 'VIRTUAL_ACCOUNT' | 'SHOPEEPAY' | 'OVO' | 'DANA' | 'QRIS';

export interface AdminDashboardPaymentMethod {
  id: AdminPaymentMethodId;
  /** Backend-provided display label */
  name: string;
  percentage: number;
  orders: number;
}

export interface AdminDashboardResponse {
  kpis: AdminDashboardKpis;
  salesChart: AdminDashboardSalesPoint[];
  recentOrders: AdminDashboardRecentOrder[];
  bestSellingProducts: AdminDashboardBestProduct[];
  statusDistribution: AdminDashboardStatusDistribution;
  salesReport: {
    rows: AdminDashboardSalesReportRow[];
    totalOrders: number;
    rangeLabel: string;
  };
  /**
   * Payment method distribution from persisted Payment.paymentMethod.
   * Empty when no completed payments have a recognized method.
   * Display names come from the backend — frontend must not invent methods.
   */
  paymentMethods: AdminDashboardPaymentMethod[];
  paymentMethodsAvailable: boolean;
  comparisons: {
    orders: AdminDashboardKpiComparison;
    revenue: AdminDashboardKpiComparison;
    customers: AdminDashboardKpiComparison;
  };
  lowStockThreshold: number;
  timezone: string;
}
