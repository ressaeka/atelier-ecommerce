import { Injectable } from '@nestjs/common';
import ExcelJS from 'exceljs';
import { PrismaService } from '../prisma/prisma.service.js';
import { OrderStatus, Prisma } from '../../generated/prisma/client.js';
import type { SalesReportQueryDto } from './dto/sales-report-query.dto.js';
import {
  BUSINESS_TIMEZONE,
  BUSINESS_TZ_OFFSET_MS,
  REVENUE_STATUSES,
} from './admin.constants.js';

export { REVENUE_STATUSES };

const BUSINESS_TZ = BUSINESS_TIMEZONE;

const STATUS_LABELS: Record<OrderStatus, string> = {
  PAID: 'Dibayar',
  PROCESSING: 'Diproses',
  SHIPPED: 'Dikirim',
  DELIVERED: 'Selesai',
  PENDING: 'Menunggu Pembayaran',
  CANCELLED: 'Dibatalkan',
  EXPIRED: 'Kedaluwarsa',
};

const MONTH_NAMES_SHORT_ID = [
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

const MONTH_NAMES_FULL_ID = [
  'Januari',
  'Februari',
  'Maret',
  'April',
  'Mei',
  'Juni',
  'Juli',
  'Agustus',
  'September',
  'Oktober',
  'November',
  'Desember',
];

export type SalesReportPeriodType = 'today' | 'monthly' | 'yearly' | 'custom';
export type SalesReportGranularity = 'hourly' | 'daily' | 'monthly';
export type KpiTrendDirection = 'UP' | 'DOWN' | 'FLAT' | 'NO_BASELINE';

export interface SalesReportKpiComparison {
  currentValue: number;
  previousValue: number;
  percentageChange: number | null;
  trend: KpiTrendDirection;
  comparisonAvailable: boolean;
}

export interface SalesReportTrendPoint {
  bucket: string;
  date: string;
  label: string;
  fullLabel: string;
  grossRevenue: number;
  discount: number;
  refund: number;
  revenue: number;
  orderCount: number;
  completedOrderCount: number;
  itemsSold: number;
}

export interface ResolvedSalesPeriod {
  periodType: SalesReportPeriodType;
  granularity: SalesReportGranularity;
  month: number;
  year: number;
  start: Date;
  end: Date;
  startYmd: string;
  endYmd: string;
  periodLabel: string;
  comparisonStart: Date;
  comparisonEnd: Date;
  comparisonStartYmd: string;
  comparisonEndYmd: string;
  comparisonLabel: string;
}

function formatWibDateTime(date: Date): string {
  const shifted = new Date(date.getTime() + BUSINESS_TZ_OFFSET_MS);
  const y = shifted.getUTCFullYear();
  const m = String(shifted.getUTCMonth() + 1).padStart(2, '0');
  const d = String(shifted.getUTCDate()).padStart(2, '0');
  const hh = String(shifted.getUTCHours()).padStart(2, '0');
  const mm = String(shifted.getUTCMinutes()).padStart(2, '0');
  const ss = String(shifted.getUTCSeconds()).padStart(2, '0');
  return `${y}-${m}-${d} ${hh}:${mm}:${ss} WIB`;
}

function formatWibYmd(date: Date): string {
  const shifted = new Date(date.getTime() + BUSINESS_TZ_OFFSET_MS);
  const y = shifted.getUTCFullYear();
  const m = String(shifted.getUTCMonth() + 1).padStart(2, '0');
  const d = String(shifted.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function formatWibYm(date: Date): string {
  const shifted = new Date(date.getTime() + BUSINESS_TZ_OFFSET_MS);
  const y = shifted.getUTCFullYear();
  const m = String(shifted.getUTCMonth() + 1).padStart(2, '0');
  return `${y}-${m}`;
}

function formatWibHourBucket(date: Date): string {
  const shifted = new Date(date.getTime() + BUSINESS_TZ_OFFSET_MS);
  const hh = String(shifted.getUTCHours()).padStart(2, '0');
  return `${hh}:00`;
}

function formatYmdToIdShort(ymd: string, includeYear = true): string {
  const parts = ymd.split('-').map(Number);
  if (parts.length !== 3) return ymd;
  const [y, m, d] = parts;
  const mName = MONTH_NAMES_SHORT_ID[m - 1] ?? String(m);
  return includeYear ? `${d} ${mName} ${y}` : `${d} ${mName}`;
}

function formatYmdToIdFull(ymd: string): string {
  const parts = ymd.split('-').map(Number);
  if (parts.length !== 3) return ymd;
  const [y, m, d] = parts;
  const mName = MONTH_NAMES_FULL_ID[m - 1] ?? String(m);
  return `${d} ${mName} ${y}`;
}

function daysInMonthUtc(year: number, month1Based: number): number {
  return new Date(Date.UTC(year, month1Based, 0)).getUTCDate();
}

function formatOrderNumber(
  rawOrderNumber: unknown,
  fallbackId: string | number,
): string {
  const normalized =
    typeof rawOrderNumber === 'string' || typeof rawOrderNumber === 'number'
      ? String(rawOrderNumber).trim()
      : '';

  if (!normalized) {
    return `#ATL-${fallbackId}`;
  }

  return normalized.startsWith('#') ? normalized : `#${normalized}`;
}

function ymdToUtcRangeWib(
  startYmd: string,
  endYmd: string,
): {
  start: Date;
  end: Date;
} {
  const [sy, sm, sd] = startYmd.split('-').map(Number);
  const [ey, em, ed] = endYmd.split('-').map(Number);
  const start = new Date(Date.UTC(sy, sm - 1, sd) - BUSINESS_TZ_OFFSET_MS);
  const end = new Date(Date.UTC(ey, em - 1, ed + 1) - BUSINESS_TZ_OFFSET_MS);
  return { start, end };
}

function buildKpiComparison(
  currentValue: number,
  previousValue: number,
): SalesReportKpiComparison {
  if (previousValue <= 0) {
    return {
      currentValue,
      previousValue,
      percentageChange: null,
      trend: 'NO_BASELINE',
      comparisonAvailable: false,
    };
  }
  const rawPct = ((currentValue - previousValue) / previousValue) * 100;
  const rounded = Math.round(rawPct * 10) / 10;
  const trend: KpiTrendDirection =
    rounded > 0 ? 'UP' : rounded < 0 ? 'DOWN' : 'FLAT';
  return {
    currentValue,
    previousValue,
    percentageChange: rounded,
    trend,
    comparisonAvailable: true,
  };
}

export function resolveSalesReportPeriodWib(
  query: SalesReportQueryDto,
  now: Date = new Date(),
): ResolvedSalesPeriod {
  const shiftedNow = new Date(now.getTime() + BUSINESS_TZ_OFFSET_MS);
  const currentYear = shiftedNow.getUTCFullYear();
  const currentMonth = shiftedNow.getUTCMonth() + 1;
  const currentDay = shiftedNow.getUTCDate();
  const todayYmd = `${currentYear}-${String(currentMonth).padStart(2, '0')}-${String(currentDay).padStart(2, '0')}`;

  // Determine effective periodType
  const periodType: SalesReportPeriodType =
    query.periodType ??
    (query.startDate || query.endDate ? 'custom' : 'monthly');

  const selectedYear = query.year ?? currentYear;
  const selectedMonth = query.month ?? currentMonth;

  if (periodType === 'today') {
    const startYmd = todayYmd;
    const endYmd = todayYmd;
    const { start, end } = ymdToUtcRangeWib(startYmd, endYmd);

    // Previous day (yesterday in WIB)
    const prevDate = new Date(
      Date.UTC(currentYear, currentMonth - 1, currentDay - 1),
    );
    const py = prevDate.getUTCFullYear();
    const pm = String(prevDate.getUTCMonth() + 1).padStart(2, '0');
    const pd = String(prevDate.getUTCDate()).padStart(2, '0');
    const compYmd = `${py}-${pm}-${pd}`;
    const { start: comparisonStart, end: comparisonEnd } = ymdToUtcRangeWib(
      compYmd,
      compYmd,
    );

    return {
      periodType: 'today',
      granularity: 'hourly',
      month: currentMonth,
      year: currentYear,
      start,
      end,
      startYmd,
      endYmd,
      periodLabel: `Hari Ini (${formatYmdToIdFull(todayYmd)})`,
      comparisonStart,
      comparisonEnd,
      comparisonStartYmd: compYmd,
      comparisonEndYmd: compYmd,
      comparisonLabel: `vs kemarin (${formatYmdToIdShort(compYmd)})`,
    };
  }

  if (periodType === 'monthly') {
    const lastDay = daysInMonthUtc(selectedYear, selectedMonth);
    const mStr = String(selectedMonth).padStart(2, '0');
    const startYmd = `${selectedYear}-${mStr}-01`;
    const endYmd = `${selectedYear}-${mStr}-${String(lastDay).padStart(2, '0')}`;
    const { start, end } = ymdToUtcRangeWib(startYmd, endYmd);

    // Previous calendar month
    const prevYear = selectedMonth === 1 ? selectedYear - 1 : selectedYear;
    const prevMonth = selectedMonth === 1 ? 12 : selectedMonth - 1;
    const prevLastDay = daysInMonthUtc(prevYear, prevMonth);
    const pmStr = String(prevMonth).padStart(2, '0');
    const comparisonStartYmd = `${prevYear}-${pmStr}-01`;
    const comparisonEndYmd = `${prevYear}-${pmStr}-${String(prevLastDay).padStart(2, '0')}`;
    const { start: comparisonStart, end: comparisonEnd } = ymdToUtcRangeWib(
      comparisonStartYmd,
      comparisonEndYmd,
    );

    const monthLabel =
      MONTH_NAMES_FULL_ID[selectedMonth - 1] ?? String(selectedMonth);
    const prevMonthLabel =
      MONTH_NAMES_SHORT_ID[prevMonth - 1] ?? String(prevMonth);

    return {
      periodType: 'monthly',
      granularity: 'daily',
      month: selectedMonth,
      year: selectedYear,
      start,
      end,
      startYmd,
      endYmd,
      periodLabel: `Bulanan — ${monthLabel} ${selectedYear}`,
      comparisonStart,
      comparisonEnd,
      comparisonStartYmd,
      comparisonEndYmd,
      comparisonLabel: `vs ${prevMonthLabel} ${prevYear}`,
    };
  }

  if (periodType === 'yearly') {
    const startYmd = `${selectedYear}-01-01`;
    const endYmd = `${selectedYear}-12-31`;
    const { start, end } = ymdToUtcRangeWib(startYmd, endYmd);

    const prevYear = selectedYear - 1;
    const comparisonStartYmd = `${prevYear}-01-01`;
    const comparisonEndYmd = `${prevYear}-12-31`;
    const { start: comparisonStart, end: comparisonEnd } = ymdToUtcRangeWib(
      comparisonStartYmd,
      comparisonEndYmd,
    );

    return {
      periodType: 'yearly',
      granularity: 'monthly',
      month: selectedMonth,
      year: selectedYear,
      start,
      end,
      startYmd,
      endYmd,
      periodLabel: `Tahunan — Tahun ${selectedYear}`,
      comparisonStart,
      comparisonEnd,
      comparisonStartYmd,
      comparisonEndYmd,
      comparisonLabel: `vs Tahun ${prevYear}`,
    };
  }

  // 'custom' (or legacy startDate/endDate without periodType)
  const endYmd = query.endDate || todayYmd;
  let startYmd = query.startDate;
  if (!startYmd) {
    const [ey, em, ed] = endYmd.split('-').map(Number);
    const startUtcMidnight =
      Date.UTC(ey, em - 1, ed) - 29 * 24 * 60 * 60 * 1000;
    const sDate = new Date(startUtcMidnight);
    const sy = sDate.getUTCFullYear();
    const sm = String(sDate.getUTCMonth() + 1).padStart(2, '0');
    const sd = String(sDate.getUTCDate()).padStart(2, '0');
    startYmd = `${sy}-${sm}-${sd}`;
  }

  const { start, end } = ymdToUtcRangeWib(startYmd, endYmd);
  const [sy, sm, sd] = startYmd.split('-').map(Number);
  const [ey, em, ed] = endYmd.split('-').map(Number);
  const startUtcMs = Date.UTC(sy, sm - 1, sd);
  const endUtcMs = Date.UTC(ey, em - 1, ed);
  const totalDays =
    Math.round((endUtcMs - startUtcMs) / (24 * 60 * 60 * 1000)) + 1;

  const granularity: SalesReportGranularity =
    totalDays <= 1 ? 'hourly' : totalDays <= 92 ? 'daily' : 'monthly';

  const compEndMs = startUtcMs - 24 * 60 * 60 * 1000;
  const compStartMs = compEndMs - (totalDays - 1) * 24 * 60 * 60 * 1000;
  const compStartDate = new Date(compStartMs);
  const compEndDate = new Date(compEndMs);
  const comparisonStartYmd = `${compStartDate.getUTCFullYear()}-${String(compStartDate.getUTCMonth() + 1).padStart(2, '0')}-${String(compStartDate.getUTCDate()).padStart(2, '0')}`;
  const comparisonEndYmd = `${compEndDate.getUTCFullYear()}-${String(compEndDate.getUTCMonth() + 1).padStart(2, '0')}-${String(compEndDate.getUTCDate()).padStart(2, '0')}`;
  const { start: comparisonStart, end: comparisonEnd } = ymdToUtcRangeWib(
    comparisonStartYmd,
    comparisonEndYmd,
  );

  const periodLabel =
    startYmd === endYmd
      ? `${formatYmdToIdFull(startYmd)}`
      : `${formatYmdToIdShort(startYmd)} – ${formatYmdToIdShort(endYmd)}`;

  const comparisonLabel =
    comparisonStartYmd === comparisonEndYmd
      ? `vs ${formatYmdToIdShort(comparisonStartYmd)}`
      : `vs ${formatYmdToIdShort(comparisonStartYmd, false)} – ${formatYmdToIdShort(comparisonEndYmd, true)}`;

  return {
    periodType: 'custom',
    granularity,
    month: sm,
    year: sy,
    start,
    end,
    startYmd,
    endYmd,
    periodLabel,
    comparisonStart,
    comparisonEnd,
    comparisonStartYmd,
    comparisonEndYmd,
    comparisonLabel,
  };
}

function buildInitialTrendBuckets(
  period: ResolvedSalesPeriod,
): Map<string, SalesReportTrendPoint> {
  const map = new Map<string, SalesReportTrendPoint>();

  if (period.granularity === 'hourly') {
    for (let h = 0; h < 24; h++) {
      const hh = String(h).padStart(2, '0');
      const bucket = `${hh}:00`;
      map.set(bucket, {
        bucket,
        date: bucket,
        label: `${hh}.00`,
        fullLabel: `${formatYmdToIdFull(period.startYmd)} · ${hh}.00–${hh}.59 WIB`,
        grossRevenue: 0,
        discount: 0,
        refund: 0,
        revenue: 0,
        orderCount: 0,
        completedOrderCount: 0,
        itemsSold: 0,
      });
    }
    return map;
  }

  if (period.granularity === 'monthly') {
    const [sy, sm] = period.startYmd.split('-').map(Number);
    const [ey, em] = period.endYmd.split('-').map(Number);
    let curY = sy;
    let curM = sm;
    while (curY < ey || (curY === ey && curM <= em)) {
      const mStr = String(curM).padStart(2, '0');
      const bucket = `${curY}-${mStr}`;
      const shortM = MONTH_NAMES_SHORT_ID[curM - 1] ?? mStr;
      const fullM = MONTH_NAMES_FULL_ID[curM - 1] ?? mStr;
      map.set(bucket, {
        bucket,
        date: bucket,
        label: sy === ey ? shortM : `${shortM} '${String(curY).slice(-2)}`,
        fullLabel: `${fullM} ${curY}`,
        grossRevenue: 0,
        discount: 0,
        refund: 0,
        revenue: 0,
        orderCount: 0,
        completedOrderCount: 0,
        itemsSold: 0,
      });
      curM += 1;
      if (curM > 12) {
        curM = 1;
        curY += 1;
      }
    }
    return map;
  }

  // 'daily'
  const [sy, sm, sd] = period.startYmd.split('-').map(Number);
  const [ey, em, ed] = period.endYmd.split('-').map(Number);
  const startUtc = Date.UTC(sy, sm - 1, sd);
  const endUtc = Date.UTC(ey, em - 1, ed);
  const dayDiff = Math.round((endUtc - startUtc) / (24 * 60 * 60 * 1000));

  for (let i = 0; i <= dayDiff; i++) {
    const curDate = new Date(startUtc + i * 24 * 60 * 60 * 1000);
    const y = curDate.getUTCFullYear();
    const m = curDate.getUTCMonth() + 1;
    const d = curDate.getUTCDate();
    const ymd = `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    const shortM = MONTH_NAMES_SHORT_ID[m - 1] ?? String(m);
    const fullM = MONTH_NAMES_FULL_ID[m - 1] ?? String(m);
    map.set(ymd, {
      bucket: ymd,
      date: ymd,
      label: `${d} ${shortM}`,
      fullLabel: `${d} ${fullM} ${y}`,
      grossRevenue: 0,
      discount: 0,
      refund: 0,
      revenue: 0,
      orderCount: 0,
      completedOrderCount: 0,
      itemsSold: 0,
    });
  }

  return map;
}

@Injectable()
export class AdminSalesReportService {
  constructor(private readonly prisma: PrismaService) {}

  private buildWhereFilters(
    period: ResolvedSalesPeriod,
    status?: string,
    search?: string,
  ) {
    const dateFilter: Prisma.DateTimeFilter = {
      gte: period.start,
      lt: period.end,
    };

    const comparisonDateFilter: Prisma.DateTimeFilter = {
      gte: period.comparisonStart,
      lt: period.comparisonEnd,
    };

    const statusWhere: Prisma.OrderWhereInput =
      status && status !== 'ALL' ? { status: status as OrderStatus } : {};

    // Effective revenue statuses when a status filter is active:
    // If status === 'ALL', all REVENUE_STATUSES count.
    // If a specific status is selected, only count it if it is one of REVENUE_STATUSES.
    const effectiveRevenueStatuses: OrderStatus[] =
      !status || status === 'ALL'
        ? [...REVENUE_STATUSES]
        : REVENUE_STATUSES.includes(status as OrderStatus)
          ? [status as OrderStatus]
          : [];

    let searchWhere: Prisma.OrderWhereInput = {};
    if (search) {
      const parsedId = Number(search.replace(/[^0-9]/g, ''));
      const orConditions: Prisma.OrderWhereInput[] = [
        { recipientName: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } },
        { user: { name: { contains: search, mode: 'insensitive' } } },
        { user: { email: { contains: search, mode: 'insensitive' } } },
        { orderNumber: { contains: search, mode: 'insensitive' } },
      ];
      if (!Number.isNaN(parsedId) && parsedId > 0) {
        orConditions.push({ id: parsedId });
      }
      searchWhere = { OR: orConditions };
    }

    const reportTableWhere: Prisma.OrderWhereInput = {
      createdAt: dateFilter,
      ...statusWhere,
      ...searchWhere,
    };

    const revenueWhere: Prisma.OrderWhereInput = {
      createdAt: dateFilter,
      status: { in: effectiveRevenueStatuses },
      ...searchWhere,
    };

    const comparisonRevenueWhere: Prisma.OrderWhereInput = {
      createdAt: comparisonDateFilter,
      status: { in: effectiveRevenueStatuses },
      ...searchWhere,
    };

    const periodAllStatusesWhere: Prisma.OrderWhereInput = {
      createdAt: dateFilter,
      ...searchWhere,
    };

    return {
      dateFilter,
      statusWhere,
      searchWhere,
      effectiveRevenueStatuses,
      reportTableWhere,
      revenueWhere,
      comparisonRevenueWhere,
      periodAllStatusesWhere,
    };
  }

  /**
   * Single Source of Truth untuk perhitungan pendapatan, breakdown, tren, dan distribusi status.
   * Dipakai bersama oleh API GET /admin/reports/sales dan Export Excel GET /admin/reports/sales/export.
   */
  private async computeCoreReportData(query: SalesReportQueryDto) {
    const period = resolveSalesReportPeriodWib(query);
    const {
      reportTableWhere,
      revenueWhere,
      comparisonRevenueWhere,
      periodAllStatusesWhere,
    } = this.buildWhereFilters(period, query.status, query.search);

    const [
      revenueAggregate,
      totalOrdersInFilterCount,
      completedOrdersCount,
      revenueItemsAggregate,
      distinctProductsGroup,
      statusGroupResults,
      cancelledExpiredAggregate,
      pendingAggregate,
      compRevenueAggregate,
      compCompletedOrdersCount,
      compItemsAggregate,
      periodOrdersForTrend,
      grossSalesAggregate,
      nonCancelledAggregate,
    ] = await Promise.all([
      // 1. Current period revenue aggregate (subtotal, shippingFee, total)
      this.prisma.order.aggregate({
        where: revenueWhere,
        _sum: {
          subtotal: true,
          shippingFee: true,
          total: true,
        },
      }),
      // 2. Total orders matching current table filter (or all statuses in period)
      this.prisma.order.count({
        where: reportTableWhere,
      }),
      // 3. Completed (revenue-recognized) orders count
      this.prisma.order.count({
        where: revenueWhere,
      }),
      // 4. Total items sold in revenue-recognized orders
      this.prisma.orderItem.aggregate({
        where: { order: revenueWhere },
        _sum: { quantity: true },
      }),
      // 5. Distinct products sold in revenue-recognized orders
      this.prisma.orderItem.groupBy({
        by: ['productId'],
        where: { order: revenueWhere },
      }),
      // 6. Status distribution across period (matching search if any)
      this.prisma.order.groupBy({
        by: ['status'],
        where: periodAllStatusesWhere,
        _count: { _all: true },
      }),
      // 7. Excluded cancelled/expired order value in period
      this.prisma.order.aggregate({
        where: {
          ...periodAllStatusesWhere,
          status: { in: [OrderStatus.CANCELLED, OrderStatus.EXPIRED] },
        },
        _sum: { total: true },
        _count: { _all: true },
      }),
      // 8. Excluded pending order value in period
      this.prisma.order.aggregate({
        where: {
          ...periodAllStatusesWhere,
          status: OrderStatus.PENDING,
        },
        _sum: { total: true },
        _count: { _all: true },
      }),
      // 9. Comparison period revenue
      this.prisma.order.aggregate({
        where: comparisonRevenueWhere,
        _sum: { total: true },
      }),
      // 10. Comparison period completed orders
      this.prisma.order.count({
        where: comparisonRevenueWhere,
      }),
      // 11. Comparison period items sold
      this.prisma.orderItem.aggregate({
        where: { order: comparisonRevenueWhere },
        _sum: { quantity: true },
      }),
      // 12. Orders for trend bucket aggregation
      this.prisma.order.findMany({
        where: reportTableWhere,
        select: {
          createdAt: true,
          subtotal: true,
          shippingFee: true,
          total: true,
          status: true,
          items: {
            select: { quantity: true },
          },
        },
      }),
      // 13. Gross sales (all orders in period)
      this.prisma.order.aggregate({
        where: periodAllStatusesWhere,
        _sum: { total: true },
        _count: { _all: true },
      }),
      // 14. Non-cancelled orders in period (DELIVERED, SHIPPED, PROCESSING, PAID, PENDING)
      this.prisma.order.aggregate({
        where: {
          ...periodAllStatusesWhere,
          status: { notIn: [OrderStatus.CANCELLED, OrderStatus.EXPIRED] },
        },
        _sum: { total: true },
        _count: { _all: true },
      }),
    ]);

    const grossProductSales = revenueAggregate._sum.subtotal ?? 0;
    const shippingRevenue = revenueAggregate._sum.shippingFee ?? 0;
    const grossRevenue = revenueAggregate._sum.total ?? 0;
    const discountTotal = 0;
    const refundTotal = 0;
    const netRevenue = grossRevenue - discountTotal - refundTotal;
    const totalRevenue = netRevenue;

    const totalItemsSold = revenueItemsAggregate._sum.quantity ?? 0;
    const uniqueProductsSold = distinctProductsGroup.length;
    const averageOrderValue =
      completedOrdersCount > 0
        ? Math.round(totalRevenue / completedOrdersCount)
        : 0;

    // Comparison period metrics
    const prevRevenue = compRevenueAggregate._sum.total ?? 0;
    const prevCompletedOrders = compCompletedOrdersCount;
    const prevItemsSold = compItemsAggregate._sum.quantity ?? 0;
    const prevAov =
      prevCompletedOrders > 0
        ? Math.round(prevRevenue / prevCompletedOrders)
        : 0;

    const kpis = {
      totalRevenue: buildKpiComparison(totalRevenue, prevRevenue),
      completedOrders: buildKpiComparison(
        completedOrdersCount,
        prevCompletedOrders,
      ),
      averageOrderValue: buildKpiComparison(averageOrderValue, prevAov),
      totalItemsSold: buildKpiComparison(totalItemsSold, prevItemsSold),
    };

    const statusDistribution: Record<OrderStatus, number> = {
      PENDING: 0,
      PAID: 0,
      PROCESSING: 0,
      SHIPPED: 0,
      DELIVERED: 0,
      CANCELLED: 0,
      EXPIRED: 0,
    };
    let allStatusesOrderCount = 0;
    for (const group of statusGroupResults) {
      statusDistribution[group.status] = group._count._all;
      allStatusesOrderCount += group._count._all;
    }

    // Build Trend Buckets (hourly, daily, or monthly)
    const trendMap = buildInitialTrendBuckets(period);
    for (const ord of periodOrdersForTrend) {
      const bucketKey =
        period.granularity === 'hourly'
          ? formatWibHourBucket(ord.createdAt)
          : period.granularity === 'monthly'
            ? formatWibYm(ord.createdAt)
            : formatWibYmd(ord.createdAt);

      const entry = trendMap.get(bucketKey);
      if (entry) {
        entry.orderCount += 1;
        if (REVENUE_STATUSES.includes(ord.status)) {
          const itemQty = ord.items.reduce((sum, it) => sum + it.quantity, 0);
          entry.completedOrderCount += 1;
          entry.grossRevenue += ord.total;
          entry.revenue += ord.total;
          entry.itemsSold += itemQty;
        }
      }
    }

    const trend = Array.from(trendMap.values());

    const grossSalesAmount = grossSalesAggregate._sum.total ?? 0;
    const grossSalesCount = grossSalesAggregate._count._all ?? 0;
    const nonCancelledAmount = nonCancelledAggregate._sum.total ?? 0;
    const nonCancelledCount = nonCancelledAggregate._count._all ?? 0;
    const cancelledAmount = cancelledExpiredAggregate._sum.total ?? 0;
    const cancelledCount = cancelledExpiredAggregate._count._all ?? 0;

    const revenueBreakdown = {
      grossSales: grossSalesAmount,
      grossSalesCount,
      nonCancelledAmount,
      nonCancelledCount,
      cancelledOrdersAmount: cancelledAmount,
      cancelledOrdersCount: cancelledCount,
      completedRevenue: totalRevenue,
      grossProductSales,
      shippingRevenue,
      grossRevenue,
      discountTotal,
      discountAvailable: false,
      refundTotal,
      refundAvailable: false,
      netRevenue,
      excludedCancelledCount: cancelledCount,
      excludedCancelledAmount: cancelledAmount,
      excludedPendingCount: pendingAggregate._count._all ?? 0,
      excludedPendingAmount: pendingAggregate._sum.total ?? 0,
      methodology: {
        recognizedStatuses: REVENUE_STATUSES,
        recognitionBasis:
          'Pendapatan sah (completed revenue) diakui berdasarkan pesanan yang telah selesai diterima pelanggan (DELIVERED). Pesanan dalam proses (PROCESSING) dan pengiriman (SHIPPED) belum diakui sebagai pendapatan selesai.',
        cancellationPolicy:
          'Pesanan berstatus CANCELLED dan EXPIRED dikecualikan sepenuhnya (Rp 0 pendapatan diakui).',
        discountPolicy:
          'Skema database saat ini belum menerapkan potongan voucher/diskon pada level pesanan (Rp 0).',
        refundPolicy:
          'Skema database saat ini belum memiliki entitas refund parsial/penuh (Rp 0).',
        shippingPolicy:
          'Total Penjualan mencakup nilai produk (subtotal) ditambah ongkos kirim (shippingFee) pada pesanan sah.',
        doubleCountingProtection:
          'Agregasi dilakukan pada entitas Order (bukan tabel percobaan Payment) sehingga retry pembayaran Midtrans tidak pernah menyebabkan double counting.',
      },
    };

    return {
      period,
      reportTableWhere,
      summary: {
        totalRevenue,
        grossRevenue,
        grossSales: grossSalesAmount,
        nonCancelledRevenue: nonCancelledAmount,
        cancelledOrdersAmount: cancelledAmount,
        discountTotal,
        refundTotal,
        netRevenue,
        totalOrders: totalOrdersInFilterCount,
        allStatusesOrderCount,
        completedOrders: completedOrdersCount,
        totalItemsSold,
        uniqueProductsSold,
        averageOrderValue,
      },
      kpis,
      revenueBreakdown,
      statusDistribution,
      trend,
    };
  }

  async getSalesReport(query: SalesReportQueryDto) {
    const { page, limit, sortBy = 'createdAt', sortOrder = 'desc' } = query;
    const core = await this.computeCoreReportData(query);

    const skip = (page - 1) * limit;

    const orderByClause: Prisma.OrderOrderByWithRelationInput =
      sortBy === 'total' || sortBy === 'recognizedRevenue'
        ? { total: sortOrder }
        : sortBy === 'status'
          ? { status: sortOrder }
          : { createdAt: sortOrder };

    const [tableOrders, tableTotalCount] = await Promise.all([
      this.prisma.order.findMany({
        where: core.reportTableWhere,
        skip,
        take: limit,
        orderBy: orderByClause,
        include: {
          user: {
            select: { id: true, name: true, email: true, phone: true },
          },
          items: {
            include: {
              product: {
                select: { id: true, name: true, image: true },
              },
              variant: {
                select: { id: true, color: true, size: true },
              },
            },
          },
          payments: {
            orderBy: { attempt: 'desc' },
            take: 1,
            select: {
              id: true,
              paymentMethod: true,
              status: true,
              createdAt: true,
            },
          },
        },
      }),
      this.prisma.order.count({
        where: core.reportTableWhere,
      }),
    ]);

    const formattedTransactions = tableOrders.map((order) => {
      const latestPayment = order.payments[0] ?? null;
      const isRev = REVENUE_STATUSES.includes(order.status);
      const grossAmount = order.total;
      const discount = 0;
      const refund = 0;
      const recognizedRevenue = isRev
        ? Math.max(0, grossAmount - discount - refund)
        : 0;

      return {
        id: order.id,
        orderNumber: formatOrderNumber(order.orderNumber, order.id),
        createdAt: order.createdAt.toISOString(),
        dateWib: formatWibYmd(order.createdAt),
        recipientName: order.recipientName,
        customerName: order.user?.name || order.recipientName,
        customerEmail: order.user?.email ?? null,
        phone: order.phone,
        city: order.city,
        province: order.province,
        subtotal: order.subtotal,
        shippingFee: order.shippingFee,
        grossAmount,
        discount,
        refund,
        recognizedRevenue,
        total: order.total,
        status: order.status,
        isRevenue: isRev,
        paymentMethod: latestPayment?.paymentMethod ?? null,
        paymentStatus: latestPayment?.status ?? null,
        itemsCount: order.items.reduce((acc, it) => acc + it.quantity, 0),
        items: order.items.map((it) => ({
          id: it.id,
          productId: it.productId,
          productName: it.product.name,
          quantity: it.quantity,
          price: it.price,
          subtotal: it.subtotal,
          variant: it.variant
            ? [it.variant.color, it.variant.size].filter(Boolean).join(' / ')
            : null,
        })),
      };
    });

    return {
      period: {
        periodType: core.period.periodType,
        granularity: core.period.granularity,
        month: core.period.month,
        year: core.period.year,
        startDate: core.period.startYmd,
        endDate: core.period.endYmd,
        periodLabel: core.period.periodLabel,
        comparisonStartDate: core.period.comparisonStartYmd,
        comparisonEndDate: core.period.comparisonEndYmd,
        comparisonLabel: core.period.comparisonLabel,
        timezone: BUSINESS_TZ,
      },
      summary: core.summary,
      kpis: core.kpis,
      revenueBreakdown: core.revenueBreakdown,
      statusDistribution: core.statusDistribution,
      trend: core.trend,
      dailyTrends: core.trend,
      transactions: {
        data: formattedTransactions,
        meta: {
          page,
          limit,
          total: tableTotalCount,
          totalPages: Math.ceil(tableTotalCount / limit) || 1,
        },
      },
    };
  }

  /**
   * Export Laporan Pendapatan Toko ke Excel (.xlsx) dengan 2 Worksheet:
   * - Sheet 1: Ringkasan Pendapatan (Identitas laporan, Rincian Pendapatan, KPI, & Rekapitulasi per periode)
   * - Sheet 2: Detail Transaksi (Rekonsiliasi penuh dengan Sheet 1)
   */
  async exportSalesReportExcel(query: SalesReportQueryDto): Promise<{
    buffer: Buffer;
    filename: string;
  }> {
    const core = await this.computeCoreReportData(query);
    const { period, summary, revenueBreakdown, trend } = core;

    const allOrders = await this.prisma.order.findMany({
      where: core.reportTableWhere,
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: { id: true, name: true, email: true, phone: true },
        },
        payments: {
          orderBy: { attempt: 'desc' },
          take: 1,
          select: { paymentMethod: true, status: true },
        },
        items: {
          include: {
            product: { select: { name: true } },
          },
        },
      },
    });

    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Atelier Official Store';
    workbook.lastModifiedBy = 'Atelier Revenue Reporting';
    workbook.created = new Date();
    workbook.modified = new Date();

    const brandBrownFill: ExcelJS.Fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF5C4033' },
    };
    const darkBrownFill: ExcelJS.Fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF3D2920' },
    };
    const softIvoryFill: ExcelJS.Fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFFAF8F4' },
    };
    const thinBorder: Partial<ExcelJS.Borders> = {
      top: { style: 'thin', color: { argb: 'FFECE7DE' } },
      left: { style: 'thin', color: { argb: 'FFECE7DE' } },
      bottom: { style: 'thin', color: { argb: 'FFECE7DE' } },
      right: { style: 'thin', color: { argb: 'FFECE7DE' } },
    };

    // ── SHEET 1: RINGKASAN PENDAPATAN ────────────────────────────
    const wsSummary = workbook.addWorksheet('Ringkasan Pendapatan', {
      views: [{ showGridLines: true }],
    });

    wsSummary.columns = [
      { width: 34 }, // A
      { width: 24 }, // B
      { width: 20 }, // C
      { width: 20 }, // D
      { width: 20 }, // E
      { width: 24 }, // F
    ];

    // Header Identitas Toko & Laporan
    wsSummary.addRow(['ATELIER OFFICIAL STORE']).font = {
      name: 'Poppins',
      size: 13,
      bold: true,
      color: { argb: 'FF5C4033' },
    };
    wsSummary.addRow(['LAPORAN PENDAPATAN PENJUALAN TOKO']).font = {
      name: 'Poppins',
      size: 16,
      bold: true,
      color: { argb: 'FF1A1A1A' },
    };
    wsSummary.addRow([
      `Periode Laporan: ${period.periodLabel} (${period.startYmd} s/d ${period.endYmd} · ${BUSINESS_TZ})`,
    ]).font = {
      name: 'Poppins',
      size: 10,
      color: { argb: 'FF3F3B36' },
    };
    wsSummary.addRow([
      `Filter Status: ${query.status && query.status !== 'ALL' ? STATUS_LABELS[query.status] : 'Semua Status'} | Pencarian: ${query.search || '—'}`,
    ]).font = {
      name: 'Poppins',
      size: 10,
      color: { argb: 'FF6F6A62' },
    };
    wsSummary.addRow([
      `Waktu Pembuatan: ${formatWibDateTime(new Date())}`,
    ]).font = {
      name: 'Poppins',
      size: 10,
      color: { argb: 'FF6F6A62' },
    };
    wsSummary.addRow([]);

    // Tabel 1: Ringkasan Perhitungan Pendapatan & KPI
    const breakdownHeader = wsSummary.addRow([
      'Komponen Pendapatan & Indikator',
      'Nilai',
      'Keterangan & Kebijakan Pengakuan',
    ]);
    breakdownHeader.height = 24;
    breakdownHeader.font = {
      name: 'Poppins',
      size: 10,
      bold: true,
      color: { argb: 'FFFFFFFF' },
    };
    for (let c = 1; c <= 3; c++) {
      breakdownHeader.getCell(c).fill = brandBrownFill;
      breakdownHeader.getCell(c).alignment = { vertical: 'middle' };
    }

    const summaryRowsData: Array<[string, number, string, string, boolean]> = [
      [
        'Total Penjualan Kotor (Gross Sales)',
        revenueBreakdown.grossSales,
        'Nilai seluruh pesanan yang tercatat pada periode ini (termasuk dibatalkan, diproses, dan dikirim)',
        '"Rp"#,##0',
        false,
      ],
      [
        'Pesanan Dibatalkan (Cancelled Orders)',
        revenueBreakdown.cancelledOrdersAmount,
        'Nilai pesanan berstatus CANCELLED / EXPIRED (dikecualikan dari pendapatan sah)',
        '"Rp"#,##0',
        false,
      ],
      [
        'Pesanan Tidak Dibatalkan (Non-Cancelled Orders)',
        revenueBreakdown.nonCancelledAmount,
        'Nilai pesanan aktif yang tidak dibatalkan (DELIVERED, SHIPPED, PROCESSING)',
        '"Rp"#,##0',
        false,
      ],
      [
        'Pendapatan Selesai Diakui (Completed Orders / DELIVERED)',
        revenueBreakdown.netRevenue,
        'Total pendapatan sah dari pesanan selesai (DELIVERED) setelah dikurangi diskon & refund',
        '"Rp"#,##0',
        true,
      ],
      [
        'Total Diskon',
        revenueBreakdown.discountTotal,
        'Potongan diskon/voucher pada pesanan selesai (skema saat ini: Rp 0)',
        '"Rp"#,##0',
        false,
      ],
      [
        'Total Refund',
        revenueBreakdown.refundTotal,
        'Pengembalian dana penuh/parsial (skema saat ini: Rp 0)',
        '"Rp"#,##0',
        false,
      ],
      [
        'Jumlah Transaksi Berhasil (DELIVERED)',
        summary.completedOrders,
        `Dari total ${summary.totalOrders} transaksi yang tercatat pada filter periode`,
        '#,##0 "transaksi"',
        false,
      ],
      [
        'Total Unit Produk Terjual (DELIVERED)',
        summary.totalItemsSold,
        `Kuantitas unit produk dari ${summary.completedOrders} transaksi berhasil`,
        '#,##0 "unit"',
        false,
      ],
      [
        'Average Order Value (AOV)',
        summary.averageOrderValue,
        'Rata-rata nilai pendapatan per transaksi berhasil (DELIVERED)',
        '"Rp"#,##0',
        false,
      ],
    ];

    for (const [label, val, note, numFmt, isHighlight] of summaryRowsData) {
      const r = wsSummary.addRow([label, val, note]);
      r.height = 21;
      r.getCell(1).font = {
        name: 'Poppins',
        size: 10,
        bold: isHighlight,
        color: { argb: 'FF1A1A1A' },
      };
      r.getCell(2).numFmt = numFmt;
      r.getCell(2).font = {
        name: 'Poppins',
        size: 10,
        bold: true,
        color: { argb: isHighlight ? 'FF2F7A4F' : 'FF1A1A1A' },
      };
      r.getCell(2).alignment = { horizontal: 'right', vertical: 'middle' };
      r.getCell(3).font = {
        name: 'Poppins',
        size: 9.5,
        color: { argb: 'FF6F6A62' },
      };

      for (let c = 1; c <= 3; c++) {
        r.getCell(c).border = thinBorder;
        if (isHighlight) {
          r.getCell(c).fill = softIvoryFill;
        }
      }
    }

    wsSummary.addRow([]);

    // Tabel 2: Ringkasan Pendapatan per Periode (Jam / Hari / Bulan)
    const granularityTitle =
      period.granularity === 'hourly'
        ? 'Rekapitulasi Pendapatan per Jam (WIB)'
        : period.granularity === 'monthly'
          ? 'Rekapitulasi Pendapatan per Bulan'
          : 'Rekapitulasi Pendapatan per Hari (WIB)';

    const trendTitleRow = wsSummary.addRow([granularityTitle]);
    trendTitleRow.font = {
      name: 'Poppins',
      size: 11,
      bold: true,
      color: { argb: 'FF1A1A1A' },
    };

    const trendHeader = wsSummary.addRow([
      period.granularity === 'hourly'
        ? 'Jam (WIB)'
        : period.granularity === 'monthly'
          ? 'Bulan'
          : 'Tanggal (WIB)',
      'Transaksi Berhasil',
      'Unit Terjual',
      'Total Penjualan (Rp)',
      'Diskon & Refund (Rp)',
      'Pendapatan Setelah Pengurangan (Rp)',
    ]);
    trendHeader.height = 24;
    trendHeader.font = {
      name: 'Poppins',
      size: 10,
      bold: true,
      color: { argb: 'FFFFFFFF' },
    };
    for (let c = 1; c <= 6; c++) {
      trendHeader.getCell(c).fill = darkBrownFill;
      trendHeader.getCell(c).alignment = {
        vertical: 'middle',
        horizontal: c === 1 ? 'left' : 'right',
      };
    }

    let sumTrendOrders = 0;
    let sumTrendItems = 0;
    let sumTrendGross = 0;
    let sumTrendDeductions = 0;
    let sumTrendNet = 0;

    for (const pt of trend) {
      const deductions = pt.discount + pt.refund;
      sumTrendOrders += pt.completedOrderCount;
      sumTrendItems += pt.itemsSold;
      sumTrendGross += pt.grossRevenue;
      sumTrendDeductions += deductions;
      sumTrendNet += pt.revenue;

      const r = wsSummary.addRow([
        pt.fullLabel,
        pt.completedOrderCount,
        pt.itemsSold,
        pt.grossRevenue,
        deductions,
        pt.revenue,
      ]);
      r.getCell(1).font = { name: 'Poppins', size: 9.5 };
      r.getCell(2).numFmt = '#,##0';
      r.getCell(3).numFmt = '#,##0';
      r.getCell(4).numFmt = '"Rp"#,##0';
      r.getCell(5).numFmt = '"Rp"#,##0';
      r.getCell(6).numFmt = '"Rp"#,##0';
      r.getCell(6).font = {
        name: 'Poppins',
        size: 9.5,
        bold: pt.revenue > 0,
      };
      for (let c = 1; c <= 6; c++) {
        r.getCell(c).border = thinBorder;
      }
    }

    const totalTrendRow = wsSummary.addRow([
      'Total Rekonsiliasi Periode',
      sumTrendOrders,
      sumTrendItems,
      sumTrendGross,
      sumTrendDeductions,
      sumTrendNet,
    ]);
    totalTrendRow.font = { name: 'Poppins', size: 10, bold: true };
    totalTrendRow.getCell(2).numFmt = '#,##0';
    totalTrendRow.getCell(3).numFmt = '#,##0';
    totalTrendRow.getCell(4).numFmt = '"Rp"#,##0';
    totalTrendRow.getCell(5).numFmt = '"Rp"#,##0';
    totalTrendRow.getCell(6).numFmt = '"Rp"#,##0';
    for (let c = 1; c <= 6; c++) {
      totalTrendRow.getCell(c).fill = softIvoryFill;
      totalTrendRow.getCell(c).border = {
        top: { style: 'thin', color: { argb: 'FF5C4033' } },
        bottom: { style: 'double', color: { argb: 'FF5C4033' } },
      };
    }

    // ── SHEET 2: DETAIL TRANSAKSI ────────────────────────────────
    const wsDetail = workbook.addWorksheet('Detail Transaksi', {
      views: [{ state: 'frozen', ySplit: 1, showGridLines: true }],
    });

    wsDetail.columns = [
      { header: 'Tanggal (WIB)', width: 24 },
      { header: 'Nomor Pesanan', width: 16 },
      { header: 'Pelanggan', width: 28 },
      { header: 'Total Produk', width: 16 },
      { header: 'Total Penjualan (Rp)', width: 20 },
      { header: 'Diskon (Rp)', width: 16 },
      { header: 'Refund (Rp)', width: 16 },
      { header: 'Pendapatan yang Diakui (Rp)', width: 26 },
      { header: 'Status', width: 22 },
    ];

    const detailHeaderRow = wsDetail.getRow(1);
    detailHeaderRow.font = {
      name: 'Poppins',
      size: 10,
      bold: true,
      color: { argb: 'FFFFFFFF' },
    };
    detailHeaderRow.height = 26;
    detailHeaderRow.eachCell((cell) => {
      cell.fill = brandBrownFill;
      cell.alignment = { vertical: 'middle', horizontal: 'center' };
    });

    wsDetail.autoFilter = 'A1:I1';

    let sumDetailItemsAll = 0;
    let sumDetailItemsRecognized = 0;
    let sumDetailGrossRecognized = 0;
    let sumDetailDiscount = 0;
    let sumDetailRefund = 0;
    let sumDetailRecognizedRevenue = 0;

    for (const order of allOrders) {
      const isRev = REVENUE_STATUSES.includes(order.status);
      const itemsCount = order.items.reduce((acc, it) => acc + it.quantity, 0);
      const grossOrderAmount = order.total;
      const discount = 0;
      const refund = 0;
      const recognizedRev = isRev
        ? Math.max(0, grossOrderAmount - discount - refund)
        : 0;

      sumDetailItemsAll += itemsCount;
      if (isRev) {
        sumDetailItemsRecognized += itemsCount;
        sumDetailGrossRecognized += grossOrderAmount;
      }
      sumDetailDiscount += discount;
      sumDetailRefund += refund;
      sumDetailRecognizedRevenue += recognizedRev;

      const customerName = order.user?.name || order.recipientName;

      const rawOrderNumber: unknown = order.orderNumber;
      const displayOrderNumber =
        typeof rawOrderNumber === 'string' && rawOrderNumber.length > 0
          ? rawOrderNumber.startsWith('#')
            ? rawOrderNumber
            : `#${rawOrderNumber}`
          : `#ATL-${order.id}`;

      const row = wsDetail.addRow([
        formatWibDateTime(order.createdAt),
        displayOrderNumber,
        customerName,
        itemsCount,
        grossOrderAmount,
        discount,
        refund,
        recognizedRev,
        STATUS_LABELS[order.status],
      ]);

      row.height = 20;
      row.font = { name: 'Poppins', size: 9.5 };
      row.getCell(1).alignment = { horizontal: 'center', vertical: 'middle' };
      row.getCell(2).alignment = { horizontal: 'center', vertical: 'middle' };
      row.getCell(3).alignment = { horizontal: 'left', vertical: 'middle' };
      row.getCell(4).alignment = { horizontal: 'right', vertical: 'middle' };
      row.getCell(5).alignment = { horizontal: 'right', vertical: 'middle' };
      row.getCell(6).alignment = { horizontal: 'right', vertical: 'middle' };
      row.getCell(7).alignment = { horizontal: 'right', vertical: 'middle' };
      row.getCell(8).alignment = { horizontal: 'right', vertical: 'middle' };
      row.getCell(9).alignment = { horizontal: 'center', vertical: 'middle' };

      row.getCell(4).numFmt = '#,##0';
      row.getCell(5).numFmt = '"Rp"#,##0';
      row.getCell(6).numFmt = '"Rp"#,##0';
      row.getCell(7).numFmt = '"Rp"#,##0';
      row.getCell(8).numFmt = '"Rp"#,##0';

      row.getCell(8).font = {
        name: 'Poppins',
        size: 9.5,
        bold: isRev,
        color: { argb: isRev ? 'FF2F7A4F' : 'FF6F6A62' },
      };

      for (let c = 1; c <= 9; c++) {
        row.getCell(c).border = thinBorder;
      }
    }

    if (allOrders.length === 0) {
      const emptyRow = wsDetail.addRow([
        '—',
        '—',
        'Tidak ada transaksi pada periode dan filter ini.',
        0,
        0,
        0,
        0,
        0,
        '—',
      ]);
      emptyRow.font = {
        name: 'Poppins',
        size: 9.5,
        italic: true,
        color: { argb: 'FF6F6A62' },
      };
    } else {
      const footerRow = wsDetail.addRow([
        'TOTAL TRANSAKSI SAH (REKONSILIASI)',
        `${summary.completedOrders} dari ${allOrders.length} pesanan`,
        `Unit keseluruhan: ${sumDetailItemsAll}`,
        sumDetailItemsRecognized,
        sumDetailGrossRecognized,
        sumDetailDiscount,
        sumDetailRefund,
        sumDetailRecognizedRevenue,
        'Terverifikasi',
      ]);
      footerRow.height = 24;
      footerRow.font = { name: 'Poppins', size: 10, bold: true };
      footerRow.getCell(4).numFmt = '#,##0';
      footerRow.getCell(5).numFmt = '"Rp"#,##0';
      footerRow.getCell(6).numFmt = '"Rp"#,##0';
      footerRow.getCell(7).numFmt = '"Rp"#,##0';
      footerRow.getCell(8).numFmt = '"Rp"#,##0';
      footerRow.getCell(8).font = {
        name: 'Poppins',
        size: 10,
        bold: true,
        color: { argb: 'FF2F7A4F' },
      };
      for (let c = 1; c <= 9; c++) {
        footerRow.getCell(c).fill = softIvoryFill;
        footerRow.getCell(c).border = {
          top: { style: 'thin', color: { argb: 'FF5C4033' } },
          bottom: { style: 'double', color: { argb: 'FF5C4033' } },
        };
      }
    }

    const buffer = await workbook.xlsx.writeBuffer();
    const filename = `Laporan-Pendapatan-Atelier-${period.endYmd}.xlsx`;

    return {
      buffer: Buffer.from(buffer),
      filename,
    };
  }
}
