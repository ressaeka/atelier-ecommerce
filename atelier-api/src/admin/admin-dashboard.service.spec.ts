jest.mock('../prisma/prisma.service.js', () => ({
  PrismaService: class MockPrismaService {},
}));

import {
  AdminDashboardService,
  businessDayRange,
  formatRangeLabel,
  safePercent,
  toYmd,
} from './admin-dashboard.service.js';
import {
  BUSINESS_TIMEZONE,
  ORDER_EXCLUDED_STATUSES,
  REVENUE_STATUSES,
  VALID_ORDER_STATUSES,
} from './admin.constants.js';
import type { PrismaService } from '../prisma/prisma.service.js';

describe('AdminDashboardService — Phase 1 Stabilization', () => {
  describe('Centralized Constants', () => {
    it('defines REVENUE_STATUSES, ORDER_EXCLUDED_STATUSES, VALID_ORDER_STATUSES, and BUSINESS_TIMEZONE', () => {
      expect(REVENUE_STATUSES).toEqual(['DELIVERED']);
      expect(ORDER_EXCLUDED_STATUSES).toEqual(['CANCELLED', 'EXPIRED']);
      expect(VALID_ORDER_STATUSES).toEqual([
        'PENDING',
        'PAID',
        'PROCESSING',
        'SHIPPED',
        'DELIVERED',
      ]);
      expect(BUSINESS_TIMEZONE).toBe('Asia/Jakarta');
    });
  });

  describe('Date & Timezone Calculation (WIB / Asia/Jakarta)', () => {
    it('calculates today (daysAgo=0), yesterday (daysAgo=1), and 6 days ago (daysAgo=6) chronologically with no future dates', () => {
      // 2026-11-13 11:48:54 WIB = 2026-11-13T04:48:54.000Z
      const ref = new Date('2026-11-13T04:48:54.000Z');

      const today = businessDayRange(ref, 0);
      const yesterday = businessDayRange(ref, 1);
      const sixDaysAgo = businessDayRange(ref, 6);

      expect(toYmd(today.start)).toBe('2026-11-13');
      expect(toYmd(yesterday.start)).toBe('2026-11-12');
      expect(toYmd(sixDaysAgo.start)).toBe('2026-11-07');

      // Exact UTC boundaries for WIB day 2026-11-13
      expect(today.start.toISOString()).toBe('2026-11-12T17:00:00.000Z');
      expect(today.end.toISOString()).toBe('2026-11-13T17:00:00.000Z');

      // rangeLabel spans full 7 days
      expect(formatRangeLabel(sixDaysAgo.start, today.end)).toBe(
        '07 11 2026 - 13 11 2026',
      );
    });

    it('handles WIB midnight boundary accurately', () => {
      // 2026-11-12 23:59:59.999 WIB = 2026-11-12T16:59:59.999Z
      const justBeforeMidnight = new Date('2026-11-12T16:59:59.999Z');
      expect(toYmd(justBeforeMidnight)).toBe('2026-11-12');
      expect(toYmd(businessDayRange(justBeforeMidnight, 0).start)).toBe(
        '2026-11-12',
      );

      // 2026-11-13 00:00:00.000 WIB = 2026-11-12T17:00:00.000Z
      const exactMidnight = new Date('2026-11-12T17:00:00.000Z');
      expect(toYmd(exactMidnight)).toBe('2026-11-13');
      expect(toYmd(businessDayRange(exactMidnight, 0).start)).toBe(
        '2026-11-13',
      );
    });

    it('handles month boundary correctly', () => {
      // 2026-11-01 10:00:00 WIB = 2026-11-01T03:00:00.000Z
      const ref = new Date('2026-11-01T03:00:00.000Z');
      expect(toYmd(businessDayRange(ref, 0).start)).toBe('2026-11-01');
      expect(toYmd(businessDayRange(ref, 1).start)).toBe('2026-10-31');
      expect(toYmd(businessDayRange(ref, 6).start)).toBe('2026-10-26');
    });

    it('handles year boundary correctly', () => {
      // 2026-01-01 10:00:00 WIB = 2026-01-01T03:00:00.000Z
      const ref = new Date('2026-01-01T03:00:00.000Z');
      expect(toYmd(businessDayRange(ref, 0).start)).toBe('2026-01-01');
      expect(toYmd(businessDayRange(ref, 1).start)).toBe('2025-12-31');
      expect(toYmd(businessDayRange(ref, 6).start)).toBe('2025-12-26');
    });
  });

  describe('safePercent', () => {
    it('returns null when previous is 0 (prevents NaN / Infinity)', () => {
      expect(safePercent(10, 0)).toBeNull();
      expect(safePercent(0, 0)).toBeNull();
      expect(safePercent(150, 100)).toBe(50);
      expect(safePercent(50, 100)).toBe(-50);
    });
  });

  describe('getDashboard aggregation & filters', () => {
    let service: AdminDashboardService;
    let mockPrisma: {
      order: {
        count: jest.Mock;
        groupBy: jest.Mock;
        aggregate: jest.Mock;
        findMany: jest.Mock;
      };
      user: { count: jest.Mock };
      product: { count: jest.Mock; findMany: jest.Mock };
      orderItem: { groupBy: jest.Mock };
      payment: { findMany: jest.Mock };
      $queryRaw: jest.Mock;
    };

    beforeEach(() => {
      jest.useFakeTimers();
      // 2026-11-13 11:45:00 WIB
      jest.setSystemTime(new Date('2026-11-13T04:45:00.000Z'));

      mockPrisma = {
        order: {
          count: jest
            .fn()
            .mockResolvedValueOnce(12) // totalOrders (excluding CANCELLED/EXPIRED)
            .mockResolvedValueOnce(2) // pendingOrders
            .mockResolvedValueOnce(4) // deliveredOrders
            .mockResolvedValueOnce(3) // paidOrders
            .mockResolvedValueOnce(2) // processingOrders
            .mockResolvedValueOnce(3) // ordersTodayCount
            .mockResolvedValueOnce(2), // ordersYesterdayCount
          groupBy: jest.fn().mockResolvedValue([
            { status: 'PENDING', _count: { _all: 2 } },
            { status: 'PAID', _count: { _all: 3 } },
            { status: 'PROCESSING', _count: { _all: 2 } },
            { status: 'SHIPPED', _count: { _all: 1 } },
            { status: 'DELIVERED', _count: { _all: 4 } },
            { status: 'CANCELLED', _count: { _all: 5 } },
          ]),
          aggregate: jest
            .fn()
            .mockResolvedValueOnce({ _sum: { total: 500000 } }) // revenueToday
            .mockResolvedValueOnce({ _sum: { total: 250000 } }), // revenueYesterday
          findMany: jest.fn().mockResolvedValue([]),
        },
        user: {
          count: jest
            .fn()
            .mockResolvedValueOnce(20) // totalCustomers
            .mockResolvedValueOnce(1) // customersNewToday
            .mockResolvedValueOnce(1), // customersNewYesterday
        },
        product: {
          count: jest
            .fn()
            .mockResolvedValueOnce(15) // totalProducts
            .mockResolvedValueOnce(2), // lowStockCount
          findMany: jest
            .fn()
            .mockResolvedValue([
              { id: 10, name: 'Linen Shirt', image: '/shirt.jpg' },
            ]),
        },
        orderItem: {
          groupBy: jest
            .fn()
            .mockResolvedValue([{ productId: 10, _sum: { quantity: 7 } }]),
        },
        payment: {
          findMany: jest.fn().mockResolvedValue([]),
        },
        $queryRaw: jest.fn().mockResolvedValue([
          { date: '2026-11-08', revenue: 150000n },
          { date: '2026-11-13', revenue: 500000n },
        ]),
      };

      service = new AdminDashboardService(
        mockPrisma as unknown as PrismaService,
      );
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('excludes CANCELLED/EXPIRED from Total Orders, filters best sellers by REVENUE_STATUSES, and builds 7 chronological WIB chart days', async () => {
      const res = await service.getDashboard();

      // Verify Total Orders excluded CANCELLED/EXPIRED
      expect(mockPrisma.order.count).toHaveBeenNthCalledWith(1, {
        where: { status: { notIn: [...ORDER_EXCLUDED_STATUSES] } },
      });
      expect(mockPrisma.order.count).toHaveBeenNthCalledWith(6, {
        where: {
          createdAt: {
            gte: new Date('2026-11-12T17:00:00.000Z'),
            lt: new Date('2026-11-13T17:00:00.000Z'),
          },
          status: { notIn: [...ORDER_EXCLUDED_STATUSES] },
        },
      });
      expect(res.kpis.totalOrders).toBe(12);
      expect(res.comparisons.orders.percent).toBe(50);

      // Verify Best Seller filtered by REVENUE_STATUSES
      expect(mockPrisma.orderItem.groupBy).toHaveBeenCalledWith(
        expect.objectContaining({
          by: ['productId'],
          where: {
            order: {
              status: { in: [...REVENUE_STATUSES] },
            },
          },
          take: 5,
        }),
      );
      expect(res.bestSellingProducts).toEqual([
        {
          rank: 1,
          productId: 10,
          name: 'Linen Shirt',
          sold: 7,
          image: '/shirt.jpg',
        },
      ]);

      // Verify 1 $queryRaw call for salesChart & 7 chronological days zero-filled
      expect(mockPrisma.$queryRaw).toHaveBeenCalledTimes(1);
      expect(res.salesChart).toEqual([
        { date: '2026-11-07', revenue: 0 },
        { date: '2026-11-08', revenue: 150000 },
        { date: '2026-11-09', revenue: 0 },
        { date: '2026-11-10', revenue: 0 },
        { date: '2026-11-11', revenue: 0 },
        { date: '2026-11-12', revenue: 0 },
        { date: '2026-11-13', revenue: 500000 },
      ]);
      expect(res.salesReport.rangeLabel).toBe('07 11 2026 - 13 11 2026');
      expect(res.timezone).toBe('Asia/Jakarta');
    });
  });
});
