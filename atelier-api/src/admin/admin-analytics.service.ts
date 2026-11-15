import {
  BadRequestException,
  Injectable,
  Logger,
  Optional,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { RedisService } from '../common/redis/redis.service.js';
import { REVENUE_STATUSES, VALID_ORDER_STATUSES } from './admin.constants.js';
import type { AnalyticsQueryDto } from './dto/analytics-query.dto.js';
import {
  buildKpiMetric,
  formatWibYmd,
  generateZeroFilledTrendBuckets,
  LOW_STOCK_THRESHOLD,
  parseAnalyticsPeriodWib,
} from './admin-analytics.util.js';
import type {
  AnalyticsBusinessInsight,
  AnalyticsCategoryPerformance,
  AnalyticsOverviewResponse,
  AnalyticsRegionalSales,
  AnalyticsTopProduct,
} from './admin-analytics.types.js';

interface PeriodKpiRow {
  revenue: bigint | number | null;
  orders: bigint | number | null;
  customers: bigint | number | null;
  productsSold: bigint | number | null;
}

interface SalesTrendRow {
  bucketDate: string;
  revenue: bigint | number | null;
  orders: bigint | number | null;
}

interface TopProductRow {
  productId: number | null;
  name: string | null;
  image: string | null;
  unitsSold: bigint | number | null;
  revenue: bigint | number | null;
}

interface CategoryPerformanceRow {
  categoryId: number | null;
  name: string;
  revenue: bigint | number | null;
  unitsSold: bigint | number | null;
}

interface RegionalSalesRow {
  province: string;
  orders: bigint | number | null;
  revenue: bigint | number | null;
  unitsSold: bigint | number | null;
}

interface LowStockProductRow {
  id: number;
  name: string;
  stock: number;
}

const ANALYTICS_CACHE_TTL_SECONDS = 45;

@Injectable()
export class AdminAnalyticsService {
  private readonly logger = new Logger(AdminAnalyticsService.name);

  constructor(
    private readonly prisma: PrismaService,
    @Optional() private readonly redisService?: RedisService,
  ) {}

  async getOverview(
    query: AnalyticsQueryDto,
    nowReference: Date = new Date(),
  ): Promise<AnalyticsOverviewResponse> {
    if (query.preset === 'custom') {
      const todayWib = formatWibYmd(nowReference);
      if (query.endDate && query.endDate > todayWib) {
        throw new BadRequestException(
          'endDate tidak boleh melewati tanggal hari ini (Asia/Jakarta)',
        );
      }
      if (query.startDate && query.startDate > todayWib) {
        throw new BadRequestException(
          'startDate tidak boleh melewati tanggal hari ini (Asia/Jakarta)',
        );
      }
    }

    const period = parseAnalyticsPeriodWib(
      query.preset ?? '30d',
      query.startDate,
      query.endDate,
      nowReference,
    );

    const cacheKey = `v1:analytics:overview:${period.preset}:${period.startYmd}:${period.endYmd}:${period.granularity}`;

    // Redis cache lookup (graceful fallback if Redis unavailable)
    if (this.redisService) {
      try {
        const cached = await this.redisService.get(cacheKey);
        if (cached) {
          return JSON.parse(cached) as AnalyticsOverviewResponse;
        }
      } catch (err) {
        this.logger.warn(
          `Redis cache read failed for ${cacheKey}: ${err instanceof Error ? err.message : String(err)}`,
        );
      }
    }

    const revenueStatuses = [...REVENUE_STATUSES];
    const validOrderStatuses = [...VALID_ORDER_STATUSES];
    const dateFormat =
      period.granularity === 'monthly' ? 'YYYY-MM' : 'YYYY-MM-DD';

    const [
      currentKpiRows,
      previousKpiRows,
      trendRows,
      topProductRows,
      categoryRows,
      regionalRows,
      lowStockRows,
    ] = await Promise.all([
      // 1. Current Period KPIs
      this.fetchPeriodKpis(
        period.start,
        period.end,
        revenueStatuses,
        validOrderStatuses,
      ),
      // 2. Previous Period KPIs
      this.fetchPeriodKpis(
        period.previousStart,
        period.previousEnd,
        revenueStatuses,
        validOrderStatuses,
      ),
      // 3. Sales Trend (WIB)
      this.prisma.$queryRaw<SalesTrendRow[]>`
        SELECT
          to_char(("createdAt" AT TIME ZONE 'UTC') AT TIME ZONE 'Asia/Jakarta', ${dateFormat}) AS "bucketDate",
          COALESCE(SUM(CASE WHEN status = ANY(${revenueStatuses}::"OrderStatus"[]) THEN total ELSE 0 END), 0)::bigint AS "revenue",
          COUNT(id)::bigint AS "orders"
        FROM "Order"
        WHERE "createdAt" >= ${period.start}
          AND "createdAt" < ${period.end}
          AND status = ANY(${validOrderStatuses}::"OrderStatus"[])
        GROUP BY 1
        ORDER BY 1 ASC
      `,
      // 4. Top 5 Products (consistent tie-breaker with AdminBestSellingService)
      this.prisma.$queryRaw<TopProductRow[]>`
        SELECT
          oi."productId" AS "productId",
          p.name AS "name",
          p.image AS "image",
          COALESCE(SUM(oi.quantity), 0)::bigint AS "unitsSold",
          COALESCE(SUM(oi.subtotal), 0)::bigint AS "revenue"
        FROM "OrderItem" oi
        JOIN "Order" o ON oi."orderId" = o.id
        LEFT JOIN "Product" p ON oi."productId" = p.id
        WHERE o."createdAt" >= ${period.start}
          AND o."createdAt" < ${period.end}
          AND o.status = ANY(${revenueStatuses}::"OrderStatus"[])
        GROUP BY oi."productId", p.name, p.image
        ORDER BY "unitsSold" DESC, "revenue" DESC, oi."productId" ASC
        LIMIT 5
      `,
      // 5. Category Performance
      this.prisma.$queryRaw<CategoryPerformanceRow[]>`
        SELECT
          c.id AS "categoryId",
          COALESCE(c.name, 'Tanpa Kategori') AS "name",
          COALESCE(SUM(oi.subtotal), 0)::bigint AS "revenue",
          COALESCE(SUM(oi.quantity), 0)::bigint AS "unitsSold"
        FROM "OrderItem" oi
        JOIN "Order" o ON oi."orderId" = o.id
        LEFT JOIN "Product" p ON oi."productId" = p.id
        LEFT JOIN "Category" c ON p."categoryId" = c.id
        WHERE o."createdAt" >= ${period.start}
          AND o."createdAt" < ${period.end}
          AND o.status = ANY(${revenueStatuses}::"OrderStatus"[])
        GROUP BY c.id, c.name
        ORDER BY "revenue" DESC, "unitsSold" DESC, "name" ASC
      `,
      // 6. Regional Sales (CTE prevents double counting Order.total / Order.id)
      this.prisma.$queryRaw<RegionalSalesRow[]>`
        WITH order_agg AS (
          SELECT
            COALESCE(INITCAP(REGEXP_REPLACE(NULLIF(TRIM(o.province), ''), '\\s+', ' ', 'g')), 'Unknown') AS "province",
            COUNT(o.id)::bigint AS "orders",
            COALESCE(SUM(o.total), 0)::bigint AS "revenue"
          FROM "Order" o
          WHERE o."createdAt" >= ${period.start}
            AND o."createdAt" < ${period.end}
            AND o.status = ANY(${revenueStatuses}::"OrderStatus"[])
          GROUP BY 1
        ),
        item_agg AS (
          SELECT
            COALESCE(INITCAP(REGEXP_REPLACE(NULLIF(TRIM(o.province), ''), '\\s+', ' ', 'g')), 'Unknown') AS "province",
            COALESCE(SUM(oi.quantity), 0)::bigint AS "unitsSold"
          FROM "OrderItem" oi
          JOIN "Order" o ON oi."orderId" = o.id
          WHERE o."createdAt" >= ${period.start}
            AND o."createdAt" < ${period.end}
            AND o.status = ANY(${revenueStatuses}::"OrderStatus"[])
          GROUP BY 1
        )
        SELECT
          oa."province",
          oa."orders",
          oa."revenue",
          COALESCE(ia."unitsSold", 0)::bigint AS "unitsSold"
        FROM order_agg oa
        LEFT JOIN item_agg ia ON ia."province" = oa."province"
        ORDER BY oa."revenue" DESC, oa."orders" DESC, oa."province" ASC
      `,
      // 7. Low Stock Active Product Alert
      this.prisma.$queryRaw<LowStockProductRow[]>`
        SELECT id, name, stock
        FROM "Product"
        WHERE stock <= ${LOW_STOCK_THRESHOLD}
          AND "isActive" = true
        ORDER BY stock ASC, id ASC
        LIMIT 1
      `,
    ]);

    const cur = currentKpiRows[0] ?? {
      revenue: 0,
      orders: 0,
      customers: 0,
      productsSold: 0,
    };
    const prev = previousKpiRows[0] ?? {
      revenue: 0,
      orders: 0,
      customers: 0,
      productsSold: 0,
    };

    const kpis = {
      revenue: buildKpiMetric(
        Number(cur.revenue ?? 0),
        Number(prev.revenue ?? 0),
      ),
      orders: buildKpiMetric(Number(cur.orders ?? 0), Number(prev.orders ?? 0)),
      customers: buildKpiMetric(
        Number(cur.customers ?? 0),
        Number(prev.customers ?? 0),
      ),
      productsSold: buildKpiMetric(
        Number(cur.productsSold ?? 0),
        Number(prev.productsSold ?? 0),
      ),
    };

    // Sales trend zero-filling
    const trendMap = generateZeroFilledTrendBuckets(
      period.startYmd,
      period.endYmd,
      period.granularity,
    );
    for (const row of trendRows) {
      const bucket = trendMap.get(row.bucketDate);
      if (bucket) {
        bucket.revenue = Number(row.revenue ?? 0);
        bucket.orders = Number(row.orders ?? 0);
      }
    }
    const salesTrend = Array.from(trendMap.values());

    // Category Performance
    const totalCategoryRevenue = categoryRows.reduce(
      (sum, row) => sum + Number(row.revenue ?? 0),
      0,
    );
    const categoryPerformance: AnalyticsCategoryPerformance[] =
      categoryRows.map((row, idx) => {
        const rev = Number(row.revenue ?? 0);
        return {
          rank: idx + 1,
          categoryId: row.categoryId,
          name: row.name,
          revenue: rev,
          unitsSold: Number(row.unitsSold ?? 0),
          percentageContribution:
            totalCategoryRevenue > 0
              ? Math.round((rev / totalCategoryRevenue) * 1000) / 10
              : 0,
        };
      });

    // Top 5 Products
    const revenueDenominator =
      totalCategoryRevenue > 0
        ? totalCategoryRevenue
        : kpis.revenue.currentValue;
    const topProducts: AnalyticsTopProduct[] = topProductRows.map(
      (row, idx) => {
        const rev = Number(row.revenue ?? 0);
        const pid = row.productId ?? 0;
        return {
          rank: idx + 1,
          productId: pid,
          name: row.name ?? `Produk #${pid}`,
          image: row.image ?? null,
          unitsSold: Number(row.unitsSold ?? 0),
          revenue: rev,
          revenueContributionPct:
            revenueDenominator > 0
              ? Math.round((rev / revenueDenominator) * 1000) / 10
              : 0,
        };
      },
    );

    // Regional Sales
    const totalRegionalRevenue = regionalRows.reduce(
      (sum, row) => sum + Number(row.revenue ?? 0),
      0,
    );
    const regionalSales: AnalyticsRegionalSales[] = regionalRows.map(
      (row, idx) => {
        const rev = Number(row.revenue ?? 0);
        return {
          rank: idx + 1,
          province: row.province,
          orders: Number(row.orders ?? 0),
          revenue: rev,
          unitsSold: Number(row.unitsSold ?? 0),
          percentageContribution:
            totalRegionalRevenue > 0
              ? Math.round((rev / totalRegionalRevenue) * 1000) / 10
              : 0,
        };
      },
    );

    // Deterministic Rule-Based Business Insights
    const businessInsights = this.buildBusinessInsights(
      kpis.revenue,
      kpis.orders.currentValue,
      lowStockRows[0] ?? null,
      categoryPerformance[0] ?? null,
    );

    const response: AnalyticsOverviewResponse = {
      period: {
        preset: period.preset,
        startDate: period.startYmd,
        endDate: period.endYmd,
        granularity: period.granularity,
        daysCount: period.daysCount,
        timezone: period.timezone,
      },
      comparisonPeriod: {
        startDate: period.previousStartYmd,
        endDate: period.previousEndYmd,
        daysCount: period.previousDaysCount,
      },
      kpis,
      salesTrend,
      topProducts,
      categoryPerformance,
      regionalSales,
      businessInsights,
    };

    if (this.redisService) {
      try {
        await this.redisService.set(
          cacheKey,
          JSON.stringify(response),
          ANALYTICS_CACHE_TTL_SECONDS,
        );
      } catch (err) {
        this.logger.warn(
          `Redis cache write failed for ${cacheKey}: ${err instanceof Error ? err.message : String(err)}`,
        );
      }
    }

    return response;
  }

  private async fetchPeriodKpis(
    start: Date,
    end: Date,
    revenueStatuses: string[],
    validOrderStatuses: string[],
  ): Promise<PeriodKpiRow[]> {
    return this.prisma.$queryRaw<PeriodKpiRow[]>`
      SELECT
        (
          SELECT COALESCE(SUM(total), 0)
          FROM "Order"
          WHERE "createdAt" >= ${start}
            AND "createdAt" < ${end}
            AND status = ANY(${revenueStatuses}::"OrderStatus"[])
        )::bigint AS "revenue",
        (
          SELECT COUNT(id)
          FROM "Order"
          WHERE "createdAt" >= ${start}
            AND "createdAt" < ${end}
            AND status = ANY(${validOrderStatuses}::"OrderStatus"[])
        )::bigint AS "orders",
        (
          SELECT COUNT(DISTINCT o."userId")
          FROM "Order" o
          JOIN "User" u ON o."userId" = u.id
          WHERE o."createdAt" >= ${start}
            AND o."createdAt" < ${end}
            AND o.status = ANY(${revenueStatuses}::"OrderStatus"[])
            AND u.role = 'USER'
        )::bigint AS "customers",
        (
          SELECT COALESCE(SUM(oi.quantity), 0)
          FROM "OrderItem" oi
          JOIN "Order" o ON oi."orderId" = o.id
          WHERE o."createdAt" >= ${start}
            AND o."createdAt" < ${end}
            AND o.status = ANY(${revenueStatuses}::"OrderStatus"[])
        )::bigint AS "productsSold"
    `;
  }

  private buildBusinessInsights(
    revenueKpi: AnalyticsOverviewResponse['kpis']['revenue'],
    totalOrders: number,
    lowStockProduct: LowStockProductRow | null,
    topCategory: AnalyticsCategoryPerformance | null,
  ): AnalyticsBusinessInsight[] {
    const insights: AnalyticsBusinessInsight[] = [];

    if (revenueKpi.currentValue === 0 && totalOrders === 0) {
      insights.push({
        id: 'no_data',
        type: 'no_data',
        title: 'Belum ada transaksi pada periode ini',
        description:
          'Tidak ditemukan pesanan maupun pendapatan pada rentang tanggal yang dipilih.',
        severity: 'info',
        supportingValue: 0,
      });
    } else if (!revenueKpi.comparisonAvailable) {
      insights.push({
        id: 'revenue_trend',
        type: 'revenue_trend',
        title: 'Baseline perbandingan belum tersedia',
        description:
          'Periode sebelumnya belum memiliki transaksi pendapatan sehingga persentase pertumbuhan tidak dapat dihitung.',
        severity: 'info',
        supportingValue: revenueKpi.currentValue,
      });
    } else if (
      revenueKpi.percentageChange !== null &&
      revenueKpi.percentageChange > 0
    ) {
      insights.push({
        id: 'revenue_trend',
        type: 'revenue_trend',
        title: `Pendapatan meningkat ${revenueKpi.percentageChange}%`,
        description: `Pendapatan periode ini naik ${revenueKpi.percentageChange}% dibanding periode sebelumnya${
          topCategory ? `, dipimpin oleh kategori ${topCategory.name}.` : '.'
        }`,
        severity: 'positive',
        supportingValue: revenueKpi.percentageChange,
      });
    } else if (
      revenueKpi.percentageChange !== null &&
      revenueKpi.percentageChange < 0
    ) {
      const drop = Math.abs(revenueKpi.percentageChange);
      insights.push({
        id: 'revenue_trend',
        type: 'revenue_trend',
        title: `Pendapatan menurun ${drop}%`,
        description: `Pendapatan periode ini turun ${drop}% dibanding periode sebelumnya. Evaluasi promo dan ketersediaan produk unggulan.`,
        severity: 'negative',
        supportingValue: revenueKpi.percentageChange,
      });
    } else {
      insights.push({
        id: 'revenue_trend',
        type: 'revenue_trend',
        title: 'Pendapatan stabil',
        description: 'Pendapatan periode ini setara dengan periode sebelumnya.',
        severity: 'info',
        supportingValue: 0,
      });
    }

    if (lowStockProduct) {
      insights.push({
        id: 'low_stock',
        type: 'low_stock',
        title: 'Stok produk aktif menipis',
        description: `Produk "${lowStockProduct.name}" hanya tersisa ${lowStockProduct.stock} unit. Segera lakukan restock.`,
        severity: 'warning',
        supportingValue: lowStockProduct.stock,
      });
    } else {
      insights.push({
        id: 'low_stock',
        type: 'low_stock',
        title: 'Stok produk aktif dalam batas aman',
        description: `Seluruh produk aktif memiliki stok di atas ${LOW_STOCK_THRESHOLD} unit.`,
        severity: 'positive',
        supportingValue: null,
      });
    }

    if (topCategory) {
      insights.push({
        id: 'top_category',
        type: 'top_category',
        title: `Kategori terlaris: ${topCategory.name}`,
        description: `Menyumbang ${topCategory.percentageContribution}% dari total pendapatan produk pada periode ini.`,
        severity: 'info',
        supportingValue: topCategory.percentageContribution,
      });
    }

    return insights;
  }
}
