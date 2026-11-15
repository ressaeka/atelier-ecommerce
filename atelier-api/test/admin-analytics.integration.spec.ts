import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../src/prisma/prisma.service.js';
import { AdminAnalyticsService } from '../src/admin/admin-analytics.service.js';

const dbUrl = process.env.DATABASE_URL ?? '';
if (!dbUrl.includes('test')) {
  throw new Error(
    `Refusing to run PostgreSQL integration tests: DATABASE_URL must contain "test" (got "${dbUrl}")`,
  );
}

describe('AdminAnalyticsService — PostgreSQL Integration', () => {
  let prisma: PrismaService;
  let service: AdminAnalyticsService;

  const cleanDatabase = async () => {
    await prisma.orderItem.deleteMany();
    await prisma.order.deleteMany();
    await prisma.product.deleteMany();
    await prisma.category.deleteMany();
    await prisma.user.deleteMany();
  };

  beforeAll(async () => {
    const configService = {
      getOrThrow: (key: string) => {
        if (key === 'DATABASE_URL') return dbUrl;
        throw new Error(`Unexpected config key: ${key}`);
      },
    } as unknown as ConfigService;

    prisma = new PrismaService(configService);
    await prisma.$connect();
    service = new AdminAnalyticsService(prisma);
    await cleanDatabase();
  });

  afterAll(async () => {
    await cleanDatabase();
    await prisma.$disconnect();
  });

  beforeEach(async () => {
    await cleanDatabase();
  });

  it('verifies KPI, status filtering, top products tie-breaker, category performance, regional CTE anti-double-counting, low stock, and WIB boundaries', async () => {
    const customer1 = await prisma.user.create({
      data: {
        name: 'Customer One',
        username: 'cust1_int',
        email: 'cust1_int@example.com',
        role: 'USER',
      },
    });
    const customer2 = await prisma.user.create({
      data: {
        name: 'Customer Two',
        username: 'cust2_int',
        email: 'cust2_int@example.com',
        role: 'USER',
      },
    });
    const adminUser = await prisma.user.create({
      data: {
        name: 'Admin User',
        username: 'admin_int',
        email: 'admin_int@example.com',
        role: 'ADMIN',
      },
    });

    const catDress = await prisma.category.create({ data: { name: 'Dress' } });
    const catTop = await prisma.category.create({ data: { name: 'Top' } });

    const prodA = await prisma.product.create({
      data: {
        name: 'Aurelia Dress',
        price: 200000,
        stock: 20,
        image: '/aurelia.jpg',
        isActive: true,
        categoryId: catDress.id,
      },
    });
    const prodB = await prisma.product.create({
      data: {
        name: 'Luna Top',
        price: 100000,
        stock: 3, // active low stock <= 5
        image: '/luna.jpg',
        isActive: true,
        categoryId: catTop.id,
      },
    });
    // Inactive product with 0 stock should NOT trigger low stock alert
    await prisma.product.create({
      data: {
        name: 'Archived Skirt',
        price: 150000,
        stock: 0,
        image: '/archived.jpg',
        isActive: false,
        categoryId: catDress.id,
      },
    });

    const baseAddr = {
      recipientName: 'Tester',
      phone: '08123456789',
      addressLine: 'Jl. Merdeka 1',
      city: 'Bandung',
      postalCode: '40111',
    };

    // 1. Previous period order: 2026-10-31 23:59:59 WIB (2026-10-31T16:59:59Z) -> belongs to Oct 31 WIB
    await prisma.order.create({
      data: {
        ...baseAddr,
        province: 'Jawa Barat',
        userId: customer1.id,
        status: 'PAID',
        subtotal: 200000,
        shippingFee: 0,
        total: 200000,
        createdAt: new Date('2026-10-31T16:59:59.000Z'),
        items: {
          create: [
            {
              productId: prodA.id,
              quantity: 1,
              price: 200000,
              subtotal: 200000,
            },
          ],
        },
      },
    });

    // 2. Current period start (month boundary): 2026-11-01 00:00:00 WIB (2026-10-31T17:00:00Z)
    // Multi-item order to test CTE anti-double-counting & province whitespace normalization
    await prisma.order.create({
      data: {
        ...baseAddr,
        province: '  jawa   barat  ',
        userId: customer1.id,
        status: 'DELIVERED',
        subtotal: 600000,
        shippingFee: 0,
        total: 600000,
        createdAt: new Date('2026-10-31T17:00:00.000Z'),
        items: {
          create: [
            {
              productId: prodA.id,
              quantity: 2,
              price: 200000,
              subtotal: 400000,
            },
            {
              productId: prodB.id,
              quantity: 2,
              price: 100000,
              subtotal: 200000,
            },
          ],
        },
      },
    });

    // 3. Before WIB midnight: 2026-11-12 23:59:59 WIB (2026-11-12T16:59:59Z) -> bucket 2026-11-12
    await prisma.order.create({
      data: {
        ...baseAddr,
        province: 'Banten',
        userId: customer2.id,
        status: 'PROCESSING',
        subtotal: 200000,
        shippingFee: 0,
        total: 200000,
        createdAt: new Date('2026-11-12T16:59:59.000Z'),
        items: {
          create: [
            {
              productId: prodB.id,
              quantity: 2,
              price: 100000,
              subtotal: 200000,
            },
          ],
        },
      },
    });

    // 4. After WIB midnight: 2026-11-13 00:00:00 WIB (2026-11-12T17:00:00Z) -> bucket 2026-11-13
    // Also PENDING order: counted in orders & trend.orders, NOT in revenue/customers/productsSold
    await prisma.order.create({
      data: {
        ...baseAddr,
        province: 'Banten',
        userId: customer2.id,
        status: 'PENDING',
        subtotal: 100000,
        shippingFee: 0,
        total: 100000,
        createdAt: new Date('2026-11-12T17:00:00.000Z'),
        items: {
          create: [
            {
              productId: prodB.id,
              quantity: 1,
              price: 100000,
              subtotal: 100000,
            },
          ],
        },
      },
    });

    // 5. CANCELLED order -> excluded from both orders and revenue
    await prisma.order.create({
      data: {
        ...baseAddr,
        province: 'Banten',
        userId: customer1.id,
        status: 'CANCELLED',
        subtotal: 999000,
        shippingFee: 0,
        total: 999000,
        createdAt: new Date('2026-11-10T10:00:00.000Z'),
        items: {
          create: [
            {
              productId: prodA.id,
              quantity: 5,
              price: 200000,
              subtotal: 999000,
            },
          ],
        },
      },
    });

    // 6. ADMIN order (SHIPPED) -> counted in revenue/orders, NOT counted in customers (role = 'USER')
    await prisma.order.create({
      data: {
        ...baseAddr,
        province: 'Bali',
        userId: adminUser.id,
        status: 'SHIPPED',
        subtotal: 200000,
        shippingFee: 0,
        total: 200000,
        createdAt: new Date('2026-11-11T10:00:00.000Z'),
        items: {
          create: [
            {
              productId: prodA.id,
              quantity: 1,
              price: 200000,
              subtotal: 200000,
            },
          ],
        },
      },
    });

    // Query custom range 2026-11-01 .. 2026-11-13 (13 days)
    // Previous range: 2026-10-19 .. 2026-10-31 (contains order #1 = 200000)
    const ref = new Date('2026-11-13T05:00:00.000Z');
    const res = await service.getOverview(
      {
        preset: 'custom',
        startDate: '2026-11-01',
        endDate: '2026-11-13',
      },
      ref,
    );

    // KPIs:
    // Revenue = 600k (#2) + 200k (#3) + 200k (#6) = 1,000,000 (previous = 200,000 -> +400%)
    expect(res.kpis.revenue.currentValue).toBe(1000000);
    expect(res.kpis.revenue.previousValue).toBe(200000);
    expect(res.kpis.revenue.percentageChange).toBe(400);

    // Orders = #2 (DELIVERED), #3 (PROCESSING), #4 (PENDING), #6 (SHIPPED) = 4 (excludes CANCELLED #5)
    expect(res.kpis.orders.currentValue).toBe(4);
    expect(res.kpis.orders.previousValue).toBe(1);

    // Customers = customer1 + customer2 = 2 (excludes adminUser)
    expect(res.kpis.customers.currentValue).toBe(2);

    // Products Sold (revenue statuses only) = (2+2 from #2) + (2 from #3) + (1 from #6) = 7
    expect(res.kpis.productsSold.currentValue).toBe(7);

    // WIB Boundaries in salesTrend:
    const nov01 = res.salesTrend.find((p) => p.date === '2026-11-01');
    const nov12 = res.salesTrend.find((p) => p.date === '2026-11-12');
    const nov13 = res.salesTrend.find((p) => p.date === '2026-11-13');
    expect(nov01).toEqual({
      date: '2026-11-01',
      label: '1 Nov',
      revenue: 600000,
      orders: 1,
    });
    expect(nov12).toEqual({
      date: '2026-11-12',
      label: '12 Nov',
      revenue: 200000,
      orders: 1,
    });
    expect(nov13).toEqual({
      date: '2026-11-13',
      label: '13 Nov',
      revenue: 0, // PENDING only
      orders: 1,
    });

    // Top Products: prodB has 2+2=4 units (400k), prodA has 2+1=3 units (600k)
    expect(res.topProducts[0].productId).toBe(prodB.id);
    expect(res.topProducts[0].unitsSold).toBe(4);
    expect(res.topProducts[1].productId).toBe(prodA.id);
    expect(res.topProducts[1].unitsSold).toBe(3);

    // Category Performance: Dress = 600k (60%), Top = 400k (40%)
    expect(res.categoryPerformance[0]).toMatchObject({
      name: 'Dress',
      revenue: 600000,
      percentageContribution: 60,
    });
    expect(res.categoryPerformance[1]).toMatchObject({
      name: 'Top',
      revenue: 400000,
      percentageContribution: 40,
    });

    // Regional Sales (no double counting on multi-item order #2):
    const jabar = res.regionalSales.find((r) => r.province === 'Jawa Barat');
    expect(jabar).toMatchObject({
      province: 'Jawa Barat',
      orders: 1,
      revenue: 600000,
      unitsSold: 4,
      percentageContribution: 60,
    });

    // Low stock insight picks active Luna Top (stock 3), ignores inactive Archived Skirt (stock 0)
    const lowStockInsight = res.businessInsights.find(
      (i) => i.type === 'low_stock',
    );
    expect(lowStockInsight?.description).toContain('Luna Top');
    expect(lowStockInsight?.supportingValue).toBe(3);
  });

  it('verifies WIB year boundary (Dec 31 23:59:59 WIB vs Jan 1 00:00:00 WIB) with monthly granularity', async () => {
    const user = await prisma.user.create({
      data: {
        name: 'Year Tester',
        username: 'year_int',
        email: 'year_int@example.com',
        role: 'USER',
      },
    });
    const cat = await prisma.category.create({ data: { name: 'Outerwear' } });
    const prod = await prisma.product.create({
      data: {
        name: 'Maya Outer',
        price: 300000,
        stock: 10,
        image: '/maya.jpg',
        isActive: true,
        categoryId: cat.id,
      },
    });

    const baseAddr = {
      recipientName: 'Year Tester',
      phone: '08123456789',
      addressLine: 'Jl. Asia Afrika',
      city: 'Bandung',
      province: 'Jawa Barat',
      postalCode: '40111',
    };

    // 2025-12-31 23:59:59 WIB (2025-12-31T16:59:59Z) -> bucket 2025-12
    await prisma.order.create({
      data: {
        ...baseAddr,
        userId: user.id,
        status: 'PAID',
        subtotal: 300000,
        shippingFee: 0,
        total: 300000,
        createdAt: new Date('2025-12-31T16:59:59.000Z'),
        items: {
          create: [
            {
              productId: prod.id,
              quantity: 1,
              price: 300000,
              subtotal: 300000,
            },
          ],
        },
      },
    });

    // 2026-01-01 00:00:00 WIB (2025-12-31T17:00:00Z) -> bucket 2026-01
    await prisma.order.create({
      data: {
        ...baseAddr,
        userId: user.id,
        status: 'PAID',
        subtotal: 600000,
        shippingFee: 0,
        total: 600000,
        createdAt: new Date('2025-12-31T17:00:00.000Z'),
        items: {
          create: [
            {
              productId: prod.id,
              quantity: 2,
              price: 300000,
              subtotal: 600000,
            },
          ],
        },
      },
    });

    const ref = new Date('2026-11-13T05:00:00.000Z');
    const res = await service.getOverview({ preset: '1y' }, ref);

    expect(res.period.granularity).toBe('monthly');
    expect(res.period.startDate).toBe('2025-12-01');
    expect(res.period.endDate).toBe('2026-11-13');
    expect(res.comparisonPeriod).toEqual({
      startDate: '2024-12-01',
      endDate: '2025-11-13',
      daysCount: res.period.daysCount,
    });

    const dec2025 = res.salesTrend.find((p) => p.date === '2025-12');
    const jan2026 = res.salesTrend.find((p) => p.date === '2026-01');
    expect(dec2025).toEqual({
      date: '2025-12',
      label: 'Des 2025',
      revenue: 300000,
      orders: 1,
    });
    expect(jan2026).toEqual({
      date: '2026-01',
      label: 'Jan 2026',
      revenue: 600000,
      orders: 1,
    });
  });
});
