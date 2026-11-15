jest.mock('../../generated/prisma/client.js', () => ({
  OrderStatus: {
    PENDING: 'PENDING',
    PAID: 'PAID',
    PROCESSING: 'PROCESSING',
    SHIPPED: 'SHIPPED',
    DELIVERED: 'DELIVERED',
    CANCELLED: 'CANCELLED',
    EXPIRED: 'EXPIRED',
  },
  PaymentStatus: {
    PENDING: 'PENDING',
    PAID: 'PAID',
    EXPIRED: 'EXPIRED',
    CANCELLED: 'CANCELLED',
  },
  Prisma: {},
}));

jest.mock('../prisma/prisma.service.js', () => ({
  PrismaService: class MockPrismaService {},
}));

import {
  BadRequestException,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AdminAnalyticsService } from './admin-analytics.service.js';
import { AnalyticsQuerySchema } from './dto/analytics-query.dto.js';
import { RolesGuard } from '../common/guards/roles.guard.js';
import { PermissionsGuard } from '../common/guards/permissions.guard.js';
import { AdminDashboardController } from './admin-dashboard.controller.js';
import type { PrismaService } from '../prisma/prisma.service.js';
import type { RedisService } from '../common/redis/redis.service.js';

describe('AdminAnalytics — Phase 2 Tests', () => {
  describe('AnalyticsQuerySchema validation', () => {
    it('accepts valid presets and custom ranges', () => {
      expect(AnalyticsQuerySchema.safeParse({ preset: '7d' }).success).toBe(
        true,
      );
      expect(
        AnalyticsQuerySchema.safeParse({
          preset: 'custom',
          startDate: '2026-10-01',
          endDate: '2026-10-31',
        }).success,
      ).toBe(true);
    });

    it('rejects invalid calendar dates such as 2026-02-30', () => {
      const res = AnalyticsQuerySchema.safeParse({
        preset: 'custom',
        startDate: '2026-02-30',
        endDate: '2026-03-01',
      });
      expect(res.success).toBe(false);
    });

    it('rejects custom preset without startDate or endDate', () => {
      expect(AnalyticsQuerySchema.safeParse({ preset: 'custom' }).success).toBe(
        false,
      );
      expect(
        AnalyticsQuerySchema.safeParse({
          preset: 'custom',
          startDate: '2026-10-01',
        }).success,
      ).toBe(false);
      expect(
        AnalyticsQuerySchema.safeParse({
          preset: 'custom',
          endDate: '2026-10-31',
        }).success,
      ).toBe(false);
    });

    it('rejects startDate or endDate when preset is not custom', () => {
      expect(
        AnalyticsQuerySchema.safeParse({
          preset: '7d',
          startDate: '2026-10-01',
          endDate: '2026-10-07',
        }).success,
      ).toBe(false);

      expect(
        AnalyticsQuerySchema.safeParse({
          preset: '30d',
          startDate: '2026-10-01',
        }).success,
      ).toBe(false);

      expect(
        AnalyticsQuerySchema.safeParse({
          preset: '1y',
          endDate: '2026-10-31',
        }).success,
      ).toBe(false);

      // Default preset ('30d') when omitted
      expect(
        AnalyticsQuerySchema.safeParse({
          startDate: '2026-10-01',
          endDate: '2026-10-31',
        }).success,
      ).toBe(false);
    });

    it('rejects startDate > endDate and ranges > 400 days', () => {
      expect(
        AnalyticsQuerySchema.safeParse({
          preset: 'custom',
          startDate: '2026-11-10',
          endDate: '2026-11-01',
        }).success,
      ).toBe(false);

      expect(
        AnalyticsQuerySchema.safeParse({
          preset: 'custom',
          startDate: '2025-01-01',
          endDate: '2026-05-01',
        }).success,
      ).toBe(false);
    });
  });

  describe('Security: RolesGuard & PermissionsGuard on getAnalyticsOverview', () => {
    it('rejects missing user and non-ADMIN USER role with ForbiddenException', () => {
      const reflector = new Reflector();
      const rolesGuard = new RolesGuard(reflector);
      const permissionsGuard = new PermissionsGuard(reflector);
      const handler = Object.getOwnPropertyDescriptor(
        AdminDashboardController.prototype,
        'getAnalyticsOverview',
      )?.value as (...args: unknown[]) => unknown;

      const makeContext = (user?: { role: string }): ExecutionContext =>
        ({
          getHandler: () => handler,
          getClass: () => AdminDashboardController,
          switchToHttp: () => ({
            getRequest: () => ({ user }),
          }),
        }) as unknown as ExecutionContext;

      expect(() => rolesGuard.canActivate(makeContext(undefined))).toThrow(
        ForbiddenException,
      );
      expect(() =>
        rolesGuard.canActivate(makeContext({ role: 'USER' })),
      ).toThrow(ForbiddenException);
      expect(() =>
        permissionsGuard.canActivate(makeContext({ role: 'USER' })),
      ).toThrow(ForbiddenException);

      expect(rolesGuard.canActivate(makeContext({ role: 'ADMIN' }))).toBe(true);
      expect(permissionsGuard.canActivate(makeContext({ role: 'ADMIN' }))).toBe(
        true,
      );
    });
  });

  describe('AdminAnalyticsService aggregation & insights', () => {
    it('handles empty period without fake growth claims', async () => {
      const mockPrisma = {
        $queryRaw: jest
          .fn()
          .mockImplementation((strings: TemplateStringsArray) => {
            const sql = strings.join('');
            if (sql.includes('COUNT(DISTINCT o."userId")')) {
              return Promise.resolve([
                { revenue: 0n, orders: 0n, customers: 0n, productsSold: 0n },
              ]);
            }
            return Promise.resolve([]);
          }),
      };

      const svc = new AdminAnalyticsService(
        mockPrisma as unknown as PrismaService,
      );
      const res = await svc.getOverview({
        preset: 'custom',
        startDate: '2026-10-01',
        endDate: '2026-10-05',
      });

      expect(res.kpis.revenue.percentageChange).toBeNull();
      expect(res.kpis.revenue.comparisonAvailable).toBe(false);
      expect(res.kpis.revenue.trend).toBe('NEUTRAL');
      expect(res.salesTrend).toHaveLength(5);
      expect(res.businessInsights[0].type).toBe('no_data');
      expect(res.topProducts).toEqual([]);
      expect(res.categoryPerformance).toEqual([]);
      expect(res.regionalSales).toEqual([]);
    });

    it('formats KPIs, trend, topProducts, categoryPerformance, regionalSales, and insights from SQL results', async () => {
      let kpiCall = 0;
      const mockPrisma = {
        $queryRaw: jest
          .fn()
          .mockImplementation((strings: TemplateStringsArray) => {
            const sql = strings.join('');
            if (sql.includes('COUNT(DISTINCT o."userId")')) {
              kpiCall++;
              if (kpiCall === 1) {
                return Promise.resolve([
                  {
                    revenue: 1500000n,
                    orders: 5n,
                    customers: 3n,
                    productsSold: 8n,
                  },
                ]);
              }
              return Promise.resolve([
                {
                  revenue: 1000000n,
                  orders: 4n,
                  customers: 2n,
                  productsSold: 5n,
                },
              ]);
            }
            if (sql.includes('bucketDate')) {
              return Promise.resolve([
                { bucketDate: '2026-10-01', revenue: 500000n, orders: 2n },
                { bucketDate: '2026-10-03', revenue: 1000000n, orders: 3n },
              ]);
            }
            if (sql.includes('oi."productId" AS "productId"')) {
              return Promise.resolve([
                {
                  productId: 1,
                  name: 'Linen Shirt',
                  image: '/a.jpg',
                  unitsSold: 5n,
                  revenue: 1000000n,
                },
                {
                  productId: 2,
                  name: null, // Deleted/missing product fallback
                  image: null,
                  unitsSold: 3n,
                  revenue: 500000n,
                },
              ]);
            }
            if (sql.includes('c.id AS "categoryId"')) {
              return Promise.resolve([
                {
                  categoryId: 1,
                  name: 'Kemeja',
                  revenue: 1000000n,
                  unitsSold: 5n,
                },
                {
                  categoryId: null,
                  name: 'Tanpa Kategori',
                  revenue: 500000n,
                  unitsSold: 3n,
                },
              ]);
            }
            if (sql.includes('WITH order_agg AS')) {
              return Promise.resolve([
                {
                  province: 'Jawa Barat',
                  orders: 3n,
                  revenue: 1000000n,
                  unitsSold: 5n,
                },
                {
                  province: 'Unknown',
                  orders: 2n,
                  revenue: 500000n,
                  unitsSold: 3n,
                },
              ]);
            }
            if (sql.includes('FROM "Product"')) {
              return Promise.resolve([
                { id: 1, name: 'Linen Shirt', stock: 3 },
              ]);
            }
            return Promise.resolve([]);
          }),
      };

      const mockRedis = {
        get: jest.fn().mockRejectedValue(new Error('Redis down')),
        set: jest.fn().mockRejectedValue(new Error('Redis down')),
      };

      const svc = new AdminAnalyticsService(
        mockPrisma as unknown as PrismaService,
        mockRedis as unknown as RedisService,
      );
      const res = await svc.getOverview({
        preset: 'custom',
        startDate: '2026-10-01',
        endDate: '2026-10-03',
      });

      expect(res.kpis.revenue).toEqual({
        currentValue: 1500000,
        previousValue: 1000000,
        percentageChange: 50,
        trend: 'UP',
        comparisonAvailable: true,
      });
      expect(res.salesTrend).toHaveLength(3);
      expect(res.salesTrend[1]).toEqual({
        date: '2026-10-02',
        label: '2 Okt',
        revenue: 0,
        orders: 0,
      });
      expect(res.topProducts[1].name).toBe('Produk #2');
      expect(res.topProducts[0].revenueContributionPct).toBe(66.7);
      expect(res.categoryPerformance[1].name).toBe('Tanpa Kategori');
      expect(res.regionalSales[1].province).toBe('Unknown');
      expect(res.businessInsights).toHaveLength(3);
      expect(res.businessInsights[0].severity).toBe('positive');
      expect(res.businessInsights[1].type).toBe('low_stock');
      expect(res.businessInsights[2].type).toBe('top_category');

      expect(mockRedis.get).toHaveBeenCalledWith(
        'v1:analytics:overview:custom:2026-10-01:2026-10-03:daily',
      );
      expect(mockRedis.set).toHaveBeenCalledWith(
        'v1:analytics:overview:custom:2026-10-01:2026-10-03:daily',
        expect.any(String),
        45,
      );
    });

    it('rejects custom endDate in the future based on Asia/Jakarta timezone', async () => {
      const mockPrisma = {
        $queryRaw: jest.fn(),
      };
      const svc = new AdminAnalyticsService(
        mockPrisma as unknown as PrismaService,
      );

      // 2026-11-12 17:30:00 UTC == 2026-11-13 00:30:00 WIB
      const wibEarlyMorning = new Date('2026-11-12T17:30:00.000Z');

      await expect(
        svc.getOverview(
          {
            preset: 'custom',
            startDate: '2026-11-10',
            endDate: '2026-11-14',
          },
          wibEarlyMorning,
        ),
      ).rejects.toThrow(BadRequestException);

      expect(mockPrisma.$queryRaw).not.toHaveBeenCalled();
    });

    it('accepts custom endDate equal to today in Asia/Jakarta even when UTC is previous day', async () => {
      const mockPrisma = {
        $queryRaw: jest
          .fn()
          .mockImplementation((strings: TemplateStringsArray) => {
            const sql = strings.join('');
            if (sql.includes('COUNT(DISTINCT o."userId")')) {
              return Promise.resolve([
                { revenue: 0n, orders: 0n, customers: 0n, productsSold: 0n },
              ]);
            }
            return Promise.resolve([]);
          }),
      };
      const svc = new AdminAnalyticsService(
        mockPrisma as unknown as PrismaService,
      );

      // 2026-11-12 17:30:00 UTC == 2026-11-13 00:30:00 WIB
      const wibEarlyMorning = new Date('2026-11-12T17:30:00.000Z');

      const res = await svc.getOverview(
        {
          preset: 'custom',
          startDate: '2026-11-12',
          endDate: '2026-11-13',
        },
        wibEarlyMorning,
      );

      expect(res.period.endDate).toBe('2026-11-13');
    });

    it('uses versioned non-colliding cache keys between preset and custom ranges', async () => {
      const mockPrisma = {
        $queryRaw: jest
          .fn()
          .mockImplementation((strings: TemplateStringsArray) => {
            const sql = strings.join('');
            if (sql.includes('COUNT(DISTINCT o."userId")')) {
              return Promise.resolve([
                { revenue: 0n, orders: 0n, customers: 0n, productsSold: 0n },
              ]);
            }
            return Promise.resolve([]);
          }),
      };
      const mockRedis = {
        get: jest.fn().mockResolvedValue(null),
        set: jest.fn().mockResolvedValue(undefined),
      };
      const svc = new AdminAnalyticsService(
        mockPrisma as unknown as PrismaService,
        mockRedis as unknown as RedisService,
      );
      const ref = new Date('2026-11-13T05:00:00.000Z');

      await svc.getOverview({ preset: '30d' }, ref);
      await svc.getOverview(
        {
          preset: 'custom',
          startDate: '2026-10-15',
          endDate: '2026-11-13',
        },
        ref,
      );

      expect(mockRedis.get).toHaveBeenNthCalledWith(
        1,
        'v1:analytics:overview:30d:2026-10-15:2026-11-13:daily',
      );
      expect(mockRedis.get).toHaveBeenNthCalledWith(
        2,
        'v1:analytics:overview:custom:2026-10-15:2026-11-13:daily',
      );
    });
  });
});
