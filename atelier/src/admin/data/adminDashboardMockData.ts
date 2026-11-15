/**
 * Admin Dashboard UI types + reference mock (types/status CSS).
 *
 * Production data comes from GET /admin/dashboard via useAdminDashboardData.
 * Mock values remain only as reference fallback — not the active data source.
 */

export type AdminOrderStatus =
  | 'Diproses'
  | 'Dikirim'
  | 'Selesai'
  | 'Dibatalkan'
  | 'Menunggu'
  | 'Menunggu Pembayaran'
  | 'Dibayar'
  | 'Kedaluwarsa';

/** Backend OrderStatus → Indonesian UI label */
export const ORDER_STATUS_LABEL: Record<string, AdminOrderStatus> = {
  PENDING: 'Menunggu Pembayaran',
  PAID: 'Dibayar',
  PROCESSING: 'Diproses',
  SHIPPED: 'Dikirim',
  DELIVERED: 'Selesai',
  CANCELLED: 'Dibatalkan',
  EXPIRED: 'Kedaluwarsa',
};

export interface AdminKpiCard {
  id: string;
  label: string;
  value: string;
  rawValue: number;
  comparison: string;
  comparisonTrend: 'up' | 'down' | 'flat';
}

export interface AdminSalesPoint {
  label: string;
  revenue: number;
}

export interface AdminPaymentMethod {
  id: string;
  name: string;
  percentage: number;
  orders: number;
}

export interface AdminRecentOrder {
  id: string;
  orderNumber: string;
  customerName: string;
  dateLabel: string;
  total: number;
  status: AdminOrderStatus;
}

export interface AdminBestSellingProduct {
  rank: number;
  name: string;
  sold: number;
  image: string;
}

export interface AdminSalesReportRow {
  no: number;
  date: string;
  orderNumber: string;
  customerName: string;
  product: string;
  quantity: number;
  total: number;
  status: AdminOrderStatus;
}

export interface AdminReportPromo {
  title: string;
  description: string;
  ctaLabel: string;
}

export interface AdminDashboardData {
  kpis: AdminKpiCard[];
  salesChart: AdminSalesPoint[];
  paymentMethods: AdminPaymentMethod[];
  paymentCenter: {
    label: string;
    value: string;
  };
  paymentMethodsAvailable: boolean;
  recentOrders: AdminRecentOrder[];
  bestSellingProducts: AdminBestSellingProduct[];
  salesReport: {
    rows: AdminSalesReportRow[];
    totalOrders: number;
    rangeLabel: string;
  };
  reportPromo: AdminReportPromo;
  todaySummary: {
    newOrders: number;
    toShip: number;
    lowStock: number;
  };
  /** true when production data comes from mock (should be false in prod) */
  isMock: boolean;
}

/** Warm brown accent mengikuti sistem warna Atelier (tanpa biru/ungu). */
export const ADMIN_PAYMENT_COLORS = [
  '#9A7458',
  '#5C4033',
  '#C2A48A',
  '#DDBF9F',
] as const;

export const ADMIN_REPORT_PROMO: AdminReportPromo = {
  title: 'Butuh laporan lain?',
  description:
    'Unduh laporan penjualan, produk terlaris, dan pelanggan (Excel).',
  ctaLabel: 'Lihat semua laporan',
};

export const adminDashboardMockData: AdminDashboardData = {
  isMock: true,
  paymentMethodsAvailable: true,
  todaySummary: { newOrders: 4, toShip: 3, lowStock: 2 },

  kpis: [
    {
      id: 'total-pesanan',
      label: 'Total Pesanan',
      value: '24',
      rawValue: 24,
      comparison: '↑ 12% dari kemarin',
      comparisonTrend: 'up',
    },
    {
      id: 'total-pelanggan',
      label: 'Total Pelanggan',
      value: '18',
      rawValue: 18,
      comparison: '↑ 8% dari kemarin',
      comparisonTrend: 'up',
    },
    {
      id: 'total-produk',
      label: 'Total Produk',
      value: '32',
      rawValue: 32,
      comparison: '— tidak berubah',
      comparisonTrend: 'flat',
    },
    {
      id: 'pendapatan-hari-ini',
      label: 'Pendapatan Hari Ini',
      value: 'Rp 4.280.000',
      rawValue: 4_280_000,
      comparison: '↑ 15% dari kemarin',
      comparisonTrend: 'up',
    },
  ],

  salesChart: [
    { label: '24 Sep', revenue: 2_150_000 },
    { label: '25 Sep', revenue: 2_680_000 },
    { label: '26 Sep', revenue: 2_420_000 },
    { label: '27 Sep', revenue: 3_120_000 },
    { label: '28 Sep', revenue: 2_950_000 },
    { label: '29 Sep', revenue: 3_480_000 },
    { label: '30 Sep', revenue: 3_820_000 },
    { label: '1 Okt', revenue: 4_280_000 },
  ],

  paymentMethods: [
    { id: 'transfer', name: 'Transfer Bank', percentage: 45, orders: 11 },
    { id: 'ewallet', name: 'E-Wallet', percentage: 30, orders: 7 },
    { id: 'cod', name: 'COD', percentage: 15, orders: 3 },
    { id: 'va', name: 'Virtual Account', percentage: 10, orders: 3 },
  ],

  paymentCenter: {
    label: 'Total',
    value: '24 Pesanan',
  },

  recentOrders: [
    {
      id: '1',
      orderNumber: '#P-2025-0103',
      customerName: 'Dewi Sartika',
      dateLabel: '1 Okt 2025, 10:24',
      total: 450_000,
      status: 'Diproses',
    },
    {
      id: '2',
      orderNumber: '#P-2025-0102',
      customerName: 'Sarah Wijaya',
      dateLabel: '1 Okt 2025, 09:12',
      total: 780_000,
      status: 'Dikirim',
    },
    {
      id: '3',
      orderNumber: '#P-2025-0101',
      customerName: 'Rina Adelia',
      dateLabel: '30 Sep 2025, 16:42',
      total: 620_000,
      status: 'Selesai',
    },
    {
      id: '4',
      orderNumber: '#P-2025-0100',
      customerName: 'Siti Nurhaliza',
      dateLabel: '30 Sep 2025, 14:17',
      total: 320_000,
      status: 'Dibatalkan',
    },
    {
      id: '5',
      orderNumber: '#P-2025-0099',
      customerName: 'Maya Putri',
      dateLabel: '30 Sep 2025, 11:05',
      total: 910_000,
      status: 'Menunggu',
    },
  ],

  bestSellingProducts: [
    {
      rank: 1,
      name: 'Classic Handbag',
      sold: 12,
      image: '/images/dompet.jpeg',
    },
    {
      rank: 2,
      name: 'Leather Jacket',
      sold: 8,
      image: '/images/jas.jpeg',
    },
    {
      rank: 3,
      name: 'Sneakers White',
      sold: 6,
      image: '/images/tas_sepatu.jpeg',
    },
    {
      rank: 4,
      name: 'Cozy Outerwear',
      sold: 5,
      image: '/images/rajut-kasual.jpeg',
    },
    {
      rank: 5,
      name: 'Shoulder Bag',
      sold: 4,
      image: '/images/dompet (1).jpeg',
    },
  ],

  salesReport: {
    rangeLabel: '24 Sep – 1 Okt 2025',
    totalOrders: 24,
    rows: [
      {
        no: 1,
        date: '1 Okt 2025',
        orderNumber: '#P-2025-0103',
        customerName: 'Dewi Sartika',
        product: 'Classic Handbag',
        quantity: 1,
        total: 450_000,
        status: 'Diproses',
      },
      {
        no: 2,
        date: '1 Okt 2025',
        orderNumber: '#P-2025-0102',
        customerName: 'Sarah Wijaya',
        product: 'Leather Jacket',
        quantity: 1,
        total: 780_000,
        status: 'Dikirim',
      },
      {
        no: 3,
        date: '30 Sep 2025',
        orderNumber: '#P-2025-0101',
        customerName: 'Rina Adelia',
        product: 'Sneakers White',
        quantity: 2,
        total: 620_000,
        status: 'Selesai',
      },
      {
        no: 4,
        date: '30 Sep 2025',
        orderNumber: '#P-2025-0100',
        customerName: 'Siti Nurhaliza',
        product: 'Cozy Outerwear',
        quantity: 1,
        total: 320_000,
        status: 'Dibatalkan',
      },
      {
        no: 5,
        date: '30 Sep 2025',
        orderNumber: '#P-2025-0099',
        customerName: 'Maya Putri',
        product: 'Shoulder Bag',
        quantity: 1,
        total: 910_000,
        status: 'Menunggu',
      },
    ],
  },

  reportPromo: {
    title: 'Butuh laporan lain?',
    description:
      'Unduh laporan penjualan, produk terlaris, dan pelanggan (Excel).',
    ctaLabel: 'Lihat semua laporan',
  },
};

export const ADMIN_ORDER_STATUS_META: Record<
  AdminOrderStatus,
  { className: string; dotClassName: string }
> = {
  Diproses: {
    className: 'bg-[#FBF1E1] text-[#9A5B14]',
    dotClassName: 'bg-[#9A5B14]',
  },
  Dikirim: {
    className: 'bg-[#FBF1E1] text-[#9A5B14]',
    dotClassName: 'bg-[#9A5B14]',
  },
  Selesai: {
    className: 'bg-[#E7F3EC] text-[#2F7A4F]',
    dotClassName: 'bg-[#2F7A4F]',
  },
  Dibatalkan: {
    className: 'bg-[#FBECEA] text-[#B4382E]',
    dotClassName: 'bg-[#B4382E]',
  },
  Menunggu: {
    className: 'bg-[#FBF1E1] text-[#9A5B14]',
    dotClassName: 'bg-[#9A5B14]',
  },
  'Menunggu Pembayaran': {
    className: 'bg-[#FBF1E1] text-[#9A5B14]',
    dotClassName: 'bg-[#9A5B14]',
  },
  Dibayar: {
    className: 'bg-[#FBF1E1] text-[#9A5B14]',
    dotClassName: 'bg-[#9A5B14]',
  },
  Kedaluwarsa: {
    className: 'bg-[#FBECEA] text-[#B4382E]',
    dotClassName: 'bg-[#B4382E]',
  },
};
