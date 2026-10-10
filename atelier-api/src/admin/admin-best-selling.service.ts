import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { OrderStatus } from '../../generated/prisma/client.js';
import type { BestSellingQueryDto } from './dto/best-selling-query.dto.js';

const BUSINESS_TZ_OFFSET_MS = 7 * 60 * 60 * 1000; // WIB (UTC+7)
const BUSINESS_TZ = 'Asia/Jakarta';

const REVENUE_STATUSES: OrderStatus[] = [
  OrderStatus.PAID,
  OrderStatus.PROCESSING,
  OrderStatus.SHIPPED,
  OrderStatus.DELIVERED,
];

function parseWibDateToUtcRange(
  startDateStr?: string,
  endDateStr?: string,
): { start: Date; end: Date; startYmd: string; endYmd: string } {
  const now = new Date();
  const shiftedNow = new Date(now.getTime() + BUSINESS_TZ_OFFSET_MS);

  let startYmd = startDateStr;
  let endYmd = endDateStr;

  if (!endYmd) {
    const y = shiftedNow.getUTCFullYear();
    const m = String(shiftedNow.getUTCMonth() + 1).padStart(2, '0');
    const d = String(shiftedNow.getUTCDate()).padStart(2, '0');
    endYmd = `${y}-${m}-${d}`;
  }

  if (!startYmd) {
    const [y, m, d] = endYmd.split('-').map(Number);
    const startUtcMidnight = Date.UTC(y, m - 1, d) - 29 * 24 * 60 * 60 * 1000;
    const sDate = new Date(startUtcMidnight);
    const sy = sDate.getUTCFullYear();
    const sm = String(sDate.getUTCMonth() + 1).padStart(2, '0');
    const sd = String(sDate.getUTCDate()).padStart(2, '0');
    startYmd = `${sy}-${sm}-${sd}`;
  }

  const [sy, sm, sd] = startYmd.split('-').map(Number);
  const [ey, em, ed] = endYmd.split('-').map(Number);

  const start = new Date(Date.UTC(sy, sm - 1, sd) - BUSINESS_TZ_OFFSET_MS);
  const end = new Date(
    Date.UTC(ey, em - 1, ed + 1) - BUSINESS_TZ_OFFSET_MS,
  );

  return { start, end, startYmd, endYmd };
}

export interface BestSellingProductItem {
  rank: number;
  productId: number;
  name: string;
  image: string | null;
  categoryName: string;
  unitsSold: number;
  revenue: number;
  orderCount: number;
  averageSellingPrice: number;
  currentPrice: number;
  currentStock: number;
}

@Injectable()
export class AdminBestSellingService {
  constructor(private readonly prisma: PrismaService) {}

  async getBestSellingProducts(query: BestSellingQueryDto) {
    const { startDate, endDate, search, sortBy, sortOrder, page, limit } = query;
    const { start, end, startYmd, endYmd } = parseWibDateToUtcRange(
      startDate,
      endDate,
    );

    // Filter tanggal dan status order yang diakui sebagai omzet sah
    const itemWhere = {
      order: {
        createdAt: {
          gte: start,
          lt: end,
        },
        status: { in: REVENUE_STATUSES },
      },
      ...(search
        ? {
            product: {
              name: { contains: search, mode: 'insensitive' as const },
            },
          }
        : {}),
    };

    // 1. Agregasi langsung di database (PostgreSQL groupBy & aggregate)
    const [groupedStats, overallAggregate, uniqueOrdersGroup] =
      await Promise.all([
        this.prisma.orderItem.groupBy({
          by: ['productId'],
          where: itemWhere,
          _sum: {
            quantity: true,
            subtotal: true,
          },
          _count: {
            orderId: true,
          },
        }),
        this.prisma.orderItem.aggregate({
          where: itemWhere,
          _sum: {
            quantity: true,
            subtotal: true,
          },
        }),
        this.prisma.orderItem.groupBy({
          by: ['orderId'],
          where: itemWhere,
        }),
      ]);

    const totalUnitsSold = overallAggregate._sum.quantity ?? 0;
    const totalRevenue = overallAggregate._sum.subtotal ?? 0;
    const totalOrdersWithProducts = uniqueOrdersGroup.length;

    const productStats = new Map<
      number,
      {
        productId: number;
        unitsSold: number;
        revenue: number;
        orderCount: number;
      }
    >();

    for (const stat of groupedStats) {
      productStats.set(stat.productId, {
        productId: stat.productId,
        unitsSold: stat._sum.quantity ?? 0,
        revenue: stat._sum.subtotal ?? 0,
        orderCount: stat._count.orderId ?? 0,
      });
    }

    const productIds = Array.from(productStats.keys());

    // 2. Ambil data produk terkait (nama, gambar, stok, dan kategori)
    const productDetails = productIds.length
      ? await this.prisma.product.findMany({
          where: { id: { in: productIds } },
          select: {
            id: true,
            name: true,
            image: true,
            price: true,
            stock: true,
            category: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        })
      : [];

    const productDetailMap = new Map(productDetails.map((p) => [p.id, p]));

    // 3. Susun data list produk
    const rankedList: Omit<BestSellingProductItem, 'rank'>[] = [];

    for (const stat of productStats.values()) {
      const detail = productDetailMap.get(stat.productId);
      rankedList.push({
        productId: stat.productId,
        name: detail?.name ?? `Produk #${stat.productId}`,
        image: detail?.image ?? null,
        categoryName: detail?.category?.name ?? 'Tanpa Kategori',
        unitsSold: stat.unitsSold,
        revenue: stat.revenue,
        orderCount: stat.orderCount,
        averageSellingPrice:
          stat.unitsSold > 0 ? Math.round(stat.revenue / stat.unitsSold) : 0,
        currentPrice: detail?.price ?? 0,
        currentStock: detail?.stock ?? 0,
      });
    }

    // 4. Pengurutan data (default: unitsSold desc)
    rankedList.sort((a, b) => {
      let comparison = 0;
      if (sortBy === 'revenue') {
        comparison = a.revenue - b.revenue;
      } else if (sortBy === 'orderCount') {
        comparison = a.orderCount - b.orderCount;
      } else {
        // 'sold' (unit terjual)
        comparison = a.unitsSold - b.unitsSold;
      }

      // secondary sort by revenue if equal
      if (comparison === 0) {
        comparison = a.revenue - b.revenue;
      }

      return sortOrder === 'asc' ? comparison : -comparison;
    });

    // Berikan peringkat 1..N
    const rankedWithIndex: BestSellingProductItem[] = rankedList.map(
      (item, index) => ({
        ...item,
        rank: index + 1,
      }),
    );

    // 5. Pagination
    const total = rankedWithIndex.length;
    const skip = (page - 1) * limit;
    const paginatedItems = rankedWithIndex.slice(skip, skip + limit);
    const totalPages = Math.ceil(total / limit) || 1;

    return {
      period: {
        startDate: startYmd,
        endDate: endYmd,
        timezone: BUSINESS_TZ,
      },
      summary: {
        totalUnitsSold,
        totalRevenue,
        totalUniqueProducts: total,
        totalOrdersWithProducts,
      },
      products: {
        data: paginatedItems,
        meta: {
          page,
          limit,
          total,
          totalPages,
        },
      },
    };
  }
}
