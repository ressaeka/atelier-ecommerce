import { PrismaClient } from '../generated/prisma/client.js';
import { OrderStatus } from '../generated/prisma/enums.js';
import { PrismaPg } from '@prisma/adapter-pg';

const url = process.env.DATABASE_URL;
if (!url) {
  console.log('NO_DB_URL');
  process.exit(2);
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: url }),
});

try {
  const [
    usersAll,
    usersCustomer,
    products,
    ordersAll,
    pending,
    delivered,
    paid,
    processing,
    lowStock,
    statusGroups,
    paymentsPaid,
    bestSellers,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { role: 'USER' } }),
    prisma.product.count(),
    prisma.order.count(),
    prisma.order.count({ where: { status: 'PENDING' } }),
    prisma.order.count({ where: { status: 'DELIVERED' } }),
    prisma.order.count({ where: { status: 'PAID' } }),
    prisma.order.count({ where: { status: 'PROCESSING' } }),
    prisma.product.count({ where: { stock: { lte: 5 } } }),
    prisma.order.groupBy({ by: ['status'], _count: { _all: true } }),
    prisma.payment.findMany({
      where: { status: 'PAID' },
      select: { paymentMethod: true },
    }),
    prisma.orderItem.groupBy({
      by: ['productId'],
      _sum: { quantity: true },
      orderBy: { _sum: { quantity: 'desc' } },
      take: 5,
    }),
  ]);

  const TZ = 7 * 60 * 60 * 1000;
  const now = new Date();

  function dayRange(daysAgo: number) {
    const shifted = new Date(now.getTime() + TZ);
    const ymd = Date.UTC(
      shifted.getUTCFullYear(),
      shifted.getUTCMonth(),
      shifted.getUTCDate(),
    );
    const start = new Date(ymd - TZ + daysAgo * 24 * 60 * 60 * 1000);
    return { start, end: new Date(start.getTime() + 24 * 60 * 60 * 1000) };
  }

  const today = dayRange(0);
  const revenueStatuses: OrderStatus[] = [
    OrderStatus.PAID,
    OrderStatus.PROCESSING,
    OrderStatus.SHIPPED,
    OrderStatus.DELIVERED,
  ];
  const revToday = await prisma.order.aggregate({
    where: {
      createdAt: { gte: today.start, lt: today.end },
      status: { in: revenueStatuses },
    },
    _sum: { total: true },
  });

  const orderUserIds = await prisma.order.findMany({ select: { userId: true } });
  const userRows = await prisma.user.findMany({ select: { id: true } });
  const userSet = new Set(userRows.map((u) => u.id));
  const orphanOrderCount = orderUserIds.filter((o) => !userSet.has(o.userId)).length;

  const methodCounts: Record<string, number> = {};
  for (const p of paymentsPaid) {
    const k = p.paymentMethod ?? 'NULL';
    methodCounts[k] = (methodCounts[k] ?? 0) + 1;
  }

  console.log(
    JSON.stringify(
      {
        usersAll,
        usersCustomer,
        products,
        ordersAll,
        pending,
        delivered,
        paid,
        processing,
        lowStock,
        statusGroups: statusGroups.map((g) => ({
          status: g.status,
          count: g._count._all,
        })),
        paymentsPaidCount: paymentsPaid.length,
        paymentMethods: methodCounts,
        revenueToday: revToday._sum?.total ?? 0,
        bestSellers,
        orphanOrderCount,
      },
      null,
      2,
    ),
  );
} catch (e) {
  console.error('DB_ERROR', e instanceof Error ? e.message : e);
  process.exit(1);
} finally {
  await prisma.$disconnect();
}
