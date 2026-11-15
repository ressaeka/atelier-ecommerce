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
} from '../common/types/admin-dashboard.types.js';

import {
  BUSINESS_TIMEZONE,
  BUSINESS_TZ_OFFSET_MS,
  ORDER_EXCLUDED_STATUSES,
  REVENUE_STATUSES,
} from './admin.constants.js';

const LOW_STOCK_THRESHOLD = 5;
const SALES_CHART_DAYS = 7;
const RECENT_ORDERS_LIMIT = 5;
const SALES_REPORT_LIMIT = 5;

interface SalesChartRow {
  date: string;
  revenue: bigint | number | null;
}

export function businessDayRange(
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
    dayUtcMidnight - BUSINESS_TZ_OFFSET_MS - daysAgo * 24 * 60 * 60 * 1000,
  );
  const end = new Date(start.getTime() + 24 * 60 * 60 * 1000);
  return { start, end };
}

export function toYmd(date: Date): string {
  const ymd = new Date(date.getTime() + BUSINESS_TZ_OFFSET_MS);
  const y = ymd.getUTCFullYear();
  const m = String(ymd.getUTCMonth() + 1).padStart(2, '0');
  const d = String(ymd.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function formatRangeLabel(start: Date, end: Date): string {
  const fmt = (d: Date) => toYmd(d).split('-').reverse().join(' ');
  return `${fmt(start)} - ${fmt(new Date(end.getTime() - 1))}`;
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

export function safePercent(current: number, previous: number): number | null {
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

function formatOrderNumber(orderNumber: unknown, orderId: number): string {
  if (typeof orderNumber !== 'string' || orderNumber.length === 0) {
    return `#ATL-${orderId}`;
  }

  return orderNumber[0] === '#' ? orderNumber : `#${orderNumber}`;
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
      salesChartRows,
    ] = await Promise.all([
      this.prisma.order.count({
        where: { status: { notIn: [...ORDER_EXCLUDED_STATUSES] } },
      }),
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
        where: {
          createdAt: { gte: today.start, lt: today.end },
          status: { notIn: [...ORDER_EXCLUDED_STATUSES] },
        },
      }),
      this.prisma.order.count({
        where: {
          createdAt: { gte: yesterday.start, lt: yesterday.end },
          status: { notIn: [...ORDER_EXCLUDED_STATUSES] },
        },
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
        where: {
          order: {
            status: { in: [...REVENUE_STATUSES] },
          },
        },
        _sum: { quantity: true },
        orderBy: [{ _sum: { quantity: 'desc' } }, { productId: 'asc' }],
        take: 5,
      }),
      this.prisma.order.findMany({
        orderBy: { createdAt: 'desc' },
        take: RECENT_ORDERS_LIMIT,
        select: {
          id: true,
          orderNumber: true,
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
          orderNumber: true,
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
      this.prisma.$queryRaw<SalesChartRow[]>`
        SELECT
          to_char(("createdAt" AT TIME ZONE 'UTC') AT TIME ZONE 'Asia/Jakarta', 'YYYY-MM-DD') AS "date",
          COALESCE(SUM(total), 0)::bigint AS "revenue"
        FROM "Order"
        WHERE "createdAt" >= ${chartStart.start}
          AND "createdAt" < ${today.end}
          AND status = ANY(${[...REVENUE_STATUSES]}::"OrderStatus"[])
        GROUP BY 1
        ORDER BY 1 ASC
      `,
    ]);

    // Sales chart: 1 DB GROUP BY query + chronological 7-day zero-filling (WIB)
    const chartRevenueByDate = new Map<string, number>();
    for (const row of salesChartRows) {
      chartRevenueByDate.set(row.date, Number(row.revenue ?? 0));
    }
    const salesChart: AdminDashboardSalesPoint[] = [];
    for (let daysAgo = SALES_CHART_DAYS - 1; daysAgo >= 0; daysAgo--) {
      const dateYmd = toYmd(businessDayRange(now, daysAgo).start);
      salesChart.push({
        date: dateYmd,
        revenue: chartRevenueByDate.get(dateYmd) ?? 0,
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
        orderNumber: formatOrderNumber(order.orderNumber, order.id),
        customerName: order.recipientName,
        createdAt: order.createdAt.toISOString(),
        total: order.total,
        status: order.status,
      }),
    );

    const salesReportRows: AdminDashboardSalesReportRow[] = [];
    for (const order of reportOrdersRaw) {
      const displayOrderNumber = formatOrderNumber(order.orderNumber, order.id);

      const items = order.items as {
        quantity: number;
        subtotal: number | null;
        product: { name: string } | null;
      }[];

      for (const item of items) {
        if (salesReportRows.length >= SALES_REPORT_LIMIT * 3) break;
        salesReportRows.push({
          no: salesReportRows.length + 1,
          date: toYmd(order.createdAt),
          orderNumber: displayOrderNumber,
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
        rangeLabel: formatRangeLabel(chartStart.start, today.end),
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
      timezone: BUSINESS_TIMEZONE,
    };
  }
}
