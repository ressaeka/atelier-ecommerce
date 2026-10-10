import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { OrderStatus, Prisma } from '../../generated/prisma/client.js';
import type { CustomerReportQueryDto } from './dto/customer-report-query.dto.js';

const BUSINESS_TZ_OFFSET_MS = 7 * 60 * 60 * 1000; // WIB (UTC+7)
const BUSINESS_TZ = 'Asia/Jakarta';

export const REVENUE_STATUSES: OrderStatus[] = [
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
  const end = new Date(Date.UTC(ey, em - 1, ed + 1) - BUSINESS_TZ_OFFSET_MS);

  return { start, end, startYmd, endYmd };
}

export interface CustomerReportItem {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  registeredAt: string;
  totalOrders: number;
  totalSpent: number;
  averageOrderValue: number;
  lastOrderDate: string | null;
  hasPurchasedInPeriod: boolean;
}

export interface CustomerReportSummary {
  totalRegisteredCustomers: number;
  newRegisteredCustomers: number;
  activePurchasingCustomers: number;
  inactiveCustomersInPeriod: number;
  totalOrders: number;
  totalRevenue: number;
  averageSpentPerCustomer: number;
  purchasingCustomerRatio: number; // percentage (0 - 100)
}

@Injectable()
export class AdminCustomerReportService {
  constructor(private readonly prisma: PrismaService) {}

  async getCustomerReport(query: CustomerReportQueryDto) {
    const {
      startDate,
      endDate,
      customerType = 'all',
      search,
      sortBy = 'totalSpent',
      sortOrder = 'desc',
      page = 1,
      limit = 10,
    } = query;

    const { start, end, startYmd, endYmd } = parseWibDateToUtcRange(
      startDate,
      endDate,
    );

    // 1. Agregasi order sah di database via groupBy dan aggregate
    const periodOrderWhere: Prisma.OrderWhereInput = {
      createdAt: {
        gte: start,
        lt: end,
      },
      status: { in: REVENUE_STATUSES },
      user: { role: 'USER' },
    };

    const [
      userOrderAggregates,
      revenueAggregate,
      totalRegisteredCustomers,
      newRegisteredCustomers,
    ] = await Promise.all([
      this.prisma.order.groupBy({
        by: ['userId'],
        where: periodOrderWhere,
        _count: { id: true },
        _sum: { total: true },
        _max: { createdAt: true },
      }),
      this.prisma.order.aggregate({
        where: periodOrderWhere,
        _sum: { total: true },
        _count: { id: true },
      }),
      this.prisma.user.count({
        where: { role: 'USER' },
      }),
      this.prisma.user.count({
        where: {
          role: 'USER',
          createdAt: { gte: start, lt: end },
        },
      }),
    ]);

    // Peta statistik per customer dari hasil agregasi database
    const orderStatsByUser = new Map<
      number,
      {
        totalOrders: number;
        totalSpent: number;
        lastOrderDate: Date;
      }
    >();

    for (const agg of userOrderAggregates) {
      if (agg._max.createdAt) {
        orderStatsByUser.set(agg.userId, {
          totalOrders: agg._count.id ?? 0,
          totalSpent: agg._sum.total ?? 0,
          lastOrderDate: agg._max.createdAt,
        });
      }
    }

    const totalRevenue = revenueAggregate._sum.total ?? 0;
    const activeUserIds = Array.from(orderStatsByUser.keys());
    const activePurchasingCustomers = activeUserIds.length;

    const inactiveCustomersInPeriod = Math.max(
      0,
      totalRegisteredCustomers - activePurchasingCustomers,
    );

    const averageSpentPerCustomer =
      activePurchasingCustomers > 0
        ? Math.round(totalRevenue / activePurchasingCustomers)
        : 0;

    const purchasingCustomerRatio =
      totalRegisteredCustomers > 0
        ? Number(
            ((activePurchasingCustomers / totalRegisteredCustomers) * 100).toFixed(
              1,
            ),
          )
        : 0;

    // 3. Susun filter pengguna berdasarkan customerType & search
    const searchFilter: Prisma.UserWhereInput = search
      ? {
          OR: [
            { name: { contains: search, mode: 'insensitive' } },
            { email: { contains: search, mode: 'insensitive' } },
            { phone: { contains: search, mode: 'insensitive' } },
          ],
        }
      : {};

    const typeFilter: Prisma.UserWhereInput = {};
    if (customerType === 'active') {
      typeFilter.id = { in: activeUserIds };
    } else if (customerType === 'inactive') {
      typeFilter.id = { notIn: activeUserIds };
    }

    const userWhere: Prisma.UserWhereInput = {
      role: 'USER',
      ...searchFilter,
      ...typeFilter,
    };

    // Ambil semua user yang memenuhi filter untuk digabungkan dengan statistik transaksi
    const matchedUsers = await this.prisma.user.findMany({
      where: userWhere,
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        createdAt: true,
      },
    });

    // 4. Transformasi ke CustomerReportItem
    const reportItems: CustomerReportItem[] = matchedUsers.map((u) => {
      const stats = orderStatsByUser.get(u.id);
      const totalOrders = stats?.totalOrders ?? 0;
      const totalSpent = stats?.totalSpent ?? 0;
      const averageOrderValue =
        totalOrders > 0 ? Math.round(totalSpent / totalOrders) : 0;
      const lastOrderDate = stats?.lastOrderDate
        ? stats.lastOrderDate.toISOString()
        : null;

      return {
        id: u.id,
        name: u.name,
        email: u.email,
        phone: u.phone,
        registeredAt: u.createdAt.toISOString(),
        totalOrders,
        totalSpent,
        averageOrderValue,
        lastOrderDate,
        hasPurchasedInPeriod: totalOrders > 0,
      };
    });

    // 5. Pengurutan data
    reportItems.sort((a, b) => {
      let comparison = 0;
      if (sortBy === 'totalOrders') {
        comparison = a.totalOrders - b.totalOrders;
      } else if (sortBy === 'name') {
        comparison = a.name.localeCompare(b.name);
      } else if (sortBy === 'registeredAt') {
        comparison =
          new Date(a.registeredAt).getTime() -
          new Date(b.registeredAt).getTime();
      } else {
        // 'totalSpent' (default)
        comparison = a.totalSpent - b.totalSpent;
      }

      // Secondary sort
      if (comparison === 0) {
        comparison = a.totalSpent - b.totalSpent;
      }
      if (comparison === 0) {
        comparison = b.totalOrders - a.totalOrders;
      }

      return sortOrder === 'asc' ? comparison : -comparison;
    });

    // 6. Pagination
    const total = reportItems.length;
    const skip = (page - 1) * limit;
    const paginatedData = reportItems.slice(skip, skip + limit);
    const totalPages = Math.ceil(total / limit) || 1;

    return {
      period: {
        startDate: startYmd,
        endDate: endYmd,
        timezone: BUSINESS_TZ,
      },
      summary: {
        totalRegisteredCustomers,
        newRegisteredCustomers,
        activePurchasingCustomers,
        inactiveCustomersInPeriod,
        totalOrders: revenueAggregate._count.id ?? 0,
        totalRevenue,
        averageSpentPerCustomer,
        purchasingCustomerRatio,
      },
      customers: {
        data: paginatedData,
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
