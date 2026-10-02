import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { PaymentStatus } from '../../generated/prisma/enums.js';
import { buildPaymentMethodDistribution } from '../payment/payment-method-mapper.js';
import type {
  AdminDashboardBestProduct,
  AdminDashboardKpiComparison,
  AdminDashboardRecentOrder,
  AdminDashboardResponse,
  AdminDashboardSalesPoint,
  AdminDashboardSalesReportRow,
  AdminDashboardStatusDistribution,
} from './admin-dashboard.types.js';

/**
 * Business day timezone: Asia/Jakarta (WIB, UTC+7).
 * Used consistently for "hari ini", sales chart, and KPI comparisons.
 */
const BUSINESS_TZ_OFFSET_MS = 7 * 60 * 60 * 1000;
const BUSINESS_TZ = 'Asia/Jakarta';

const REVENUE_STATUSES = [
  'PAID',
  'PROCESSING',
  'SHIPPED',
  'DELIVERED',
] as const;

const LOW_STOCK_THRESHOLD = 5;
const SALES_CHART_DAYS = 7;
const RECENT_ORDERS_LIMIT = 5;
const SALES_REPORT_LIMIT = 5;

function businessDayRange(
  reference: Date,
  daysAgo: number,
): { start: Date; end: Date } {
  const shifted = new Date(reference.getTime() + BUSINESS_TZ_OFFSET_MS);
  const dayUtcMidnight = Date.UTC(
    shifted.getUTCFullYear(),
    shifted.getUTCMonth(),
    shifted.getUTCDate(),
  );
  const start = new Date(
    dayUtcMidnight - BUSINESS_TZ_OFFSET_MS + daysAgo * 24 * 60 * 60 * 1000,
  );
  const end = new Date(start.getTime() + 24 * 60 * 60 * 1000);
  return { start, end };
}

function toYmd(date: Date): string {
  const ymd = new Date(date.getTime() - BUSINESS_TZ_OFFSET_MS);
  const y = ymd.getUTCFullYear();
  const m = String(ymd.getUTCMonth() + 1).padStart(2, '0');
  const d = String(ymd.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function formatRangeLabel(start: Date, end: Date): string {
  const fmt = (d: Date) => toYmd(d).split('-').reverse().join(' ');
  return `${fmt(start)} – ${fmt(new Date(end.getTime() - 1))}`;
}

function emptyStatusDistribution(): AdminDashboardStatusDistribution {
  return {
    PENDING: 0,
    PAID: 0,
    PROCESSING: 0,
    SHIPPED: 0,
    DELIVERED: 0,
    CANCELLED: 0,
    EXPIRED: 0,
  };
}

function safePercent(current: number, previous: number): number | null {
  if (previous === 0) {
    return null;
  }
  return ((current - previous) / previous) * 100;
}

function comparison(
  current: number,
  previous: number,
): AdminDashboardKpiComparison {
  return {
    current,
    previous,
    percent: safePercent(current, previous),
  };
}

@Injectable()
export class AdminDashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async getDashboard(): Promise<AdminDashboardResponse> {
    const now = new Date();
    const today = businessDayRange(now, 0);
    const yesterday = businessDayRange(now, 1);
    const chartStart = businessDayRange(now, SALES_CHART_DAYS - 1);

    const [
      totalOrders,
      totalCustomers,
      totalProducts,
      pendingOrders,
      deliveredOrders,
      paidOrders,
      processingOrders,
      lowStockCount,
      statusGroups,
      revenueTodayAgg,
      revenueYesterdayAgg,
      ordersTodayCount,
      ordersYesterdayCount,
      customersNewToday,
      customersNewYesterday,
      bestSellerGroups,
      recentOrdersRaw,
      reportOrdersRaw,
      completedPaymentsRaw,
    ] = await Promise.all([
      this.prisma.order.count(),
      this.prisma.user.count({ where: { role: 'USER' } }),
      this.prisma.product.count(),
      this.prisma.order.count({ where: { status: 'PENDING' } }),
      this.prisma.order.count({ where: { status: 'DELIVERED' } }),
      this.prisma.order.count({ where: { status: 'PAID' } }),
      this.prisma.order.count({ where: { status: 'PROCESSING' } }),
      this.prisma.product.count({
        where: { stock: { lte: LOW_STOCK_THRESHOLD } },
      }),
      this.prisma.order.groupBy({
        by: ['status'],
        _count: { _all: true },
      }),
      this.prisma.order.aggregate({
        where: {
          createdAt: { gte: today.start, lt: today.end },
          status: { in: [...REVENUE_STATUSES] },
        },
        _sum: { total: true },
      }),
      this.prisma.order.aggregate({
        where: {
          createdAt: { gte: yesterday.start, lt: yesterday.end },
          status: { in: [...REVENUE_STATUSES] },
        },
        _sum: { total: true },
      }),
      this.prisma.order.count({
        where: { createdAt: { gte: today.start, lt: today.end } },
      }),
      this.prisma.order.count({
        where: { createdAt: { gte: yesterday.start, lt: yesterday.end } },
      }),
      this.prisma.user.count({
        where: {
          role: 'USER',
          createdAt: { gte: today.start, lt: today.end },
        },
      }),
      this.prisma.user.count({
        where: {
          role: 'USER',
          createdAt: { gte: yesterday.start, lt: yesterday.end },
        },
      }),
      this.prisma.orderItem.groupBy({
        by: ['productId'],
        _sum: { quantity: true },
        orderBy: { _sum: { quantity: 'desc' } },
        take: 5,
      }),
      this.prisma.order.findMany({
        orderBy: { createdAt: 'desc' },
        take: RECENT_ORDERS_LIMIT,
        select: {
          id: true,
          recipientName: true,
          createdAt: true,
          total: true,
          status: true,
        },
      }),
      this.prisma.order.findMany({
        orderBy: { createdAt: 'desc' },
        take: SALES_REPORT_LIMIT,
        select: {
          id: true,
          recipientName: true,
          createdAt: true,
          total: true,
          status: true,
          items: {
            select: {
              quantity: true,
              subtotal: true,
              product: { select: { name: true } },
            },
          },
        },
      }),
      /**
       * Completed payments only (PaymentStatus.PAID).
       * Select only paymentMethod to keep aggregation light.
       */
      this.prisma.payment.findMany({
        where: { status: PaymentStatus.PAID },
        select: { paymentMethod: true },
      }),
    ]);

    // Sales chart: DB-side sums per business day (not full-table download)
    const salesChart: AdminDashboardSalesPoint[] = [];
    for (let daysAgo = SALES_CHART_DAYS - 1; daysAgo >= 0; daysAgo--) {
      const range = businessDayRange(now, daysAgo);
      const agg = await this.prisma.order.aggregate({
        where: {
          createdAt: { gte: range.start, lt: range.end },
          status: { in: [...REVENUE_STATUSES] },
        },
        _sum: { total: true },
      });
      salesChart.push({
        date: toYmd(range.start),
        revenue: agg._sum.total ?? 0,
      });
    }

    const statusDistribution = emptyStatusDistribution();

    for (const group of statusGroups) {
      const key = group.status;

      if (key in statusDistribution) {
        statusDistribution[key] = group._count._all;
      }
    }

    const bestProductIds = bestSellerGroups.map((g) => g.productId);
    const products = bestProductIds.length
      ? await this.prisma.product.findMany({
          where: { id: { in: bestProductIds } },
          select: { id: true, name: true, image: true },
        })
      : [];
    const productById = new Map(products.map((p) => [p.id, p]));

    const bestSellingProducts: AdminDashboardBestProduct[] = bestSellerGroups
      .map((group, index) => {
        const product = productById.get(group.productId);
        return {
          rank: index + 1,
          productId: group.productId,
          name: product?.name ?? `Produk #${group.productId}`,
          sold: group._sum.quantity ?? 0,
          image: product?.image ?? null,
        };
      })
      .filter((item) => item.sold > 0);

    const recentOrders: AdminDashboardRecentOrder[] = recentOrdersRaw.map(
      (order) => ({
        id: order.id,
        orderNumber: `#ORD-${order.id}`,
        customerName: order.recipientName,
        createdAt: order.createdAt.toISOString(),
        total: order.total,
        status: order.status,
      }),
    );

    const salesReportRows: AdminDashboardSalesReportRow[] = [];
    for (const order of reportOrdersRaw) {
      for (const item of order.items) {
        if (salesReportRows.length >= SALES_REPORT_LIMIT * 3) break;
        salesReportRows.push({
          no: salesReportRows.length + 1,
          date: toYmd(order.createdAt),
          orderNumber: `#ORD-${order.id}`,
          customerName: order.recipientName,
          product: item.product?.name ?? `Produk #${order.id}`,
          quantity: item.quantity,
          total: item.subtotal ?? order.total,
          status: order.status,
        });
      }
      if (salesReportRows.length >= SALES_REPORT_LIMIT * 3) break;
    }

    const revenueToday = revenueTodayAgg._sum.total ?? 0;
    const revenueYesterday = revenueYesterdayAgg._sum.total ?? 0;

    /**
     * Real payment-method distribution from completed payments.
     * Unknown/null methods are not fabricated.
     */
    const paymentMethodDistribution =
      buildPaymentMethodDistribution(completedPaymentsRaw);

    return {
      kpis: {
        totalOrders,
        totalCustomers,
        totalProducts,
        revenueToday,
        pendingOrders,
        deliveredOrders,
        newOrdersToday: ordersTodayCount,
        toShipOrders: paidOrders + processingOrders,
        lowStockCount,
      },
      salesChart,
      recentOrders,
      bestSellingProducts,
      statusDistribution,
      salesReport: {
        rows: salesReportRows,
        totalOrders,
        rangeLabel: formatRangeLabel(chartStart.start, chartStart.end),
      },
      paymentMethods: paymentMethodDistribution.paymentMethods,
      paymentMethodsAvailable:
        paymentMethodDistribution.paymentMethodsAvailable,
      comparisons: {
        orders: comparison(ordersTodayCount, ordersYesterdayCount),
        revenue: comparison(revenueToday, revenueYesterday),
        customers: comparison(customersNewToday, customersNewYesterday),
      },
      lowStockThreshold: LOW_STOCK_THRESHOLD,
      timezone: BUSINESS_TZ,
    };
  }
}
