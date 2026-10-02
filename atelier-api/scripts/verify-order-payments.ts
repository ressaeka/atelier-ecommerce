import { PrismaClient } from '../generated/prisma/client.js';
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
  const payments = await prisma.payment.findMany({
    orderBy: { createdAt: 'desc' },
    take: 10,
    select: {
      id: true,
      orderId: true,
      status: true,
      paymentMethod: true,
      grossAmount: true,
      provider: true,
      createdAt: true,
    },
  });
  console.log(JSON.stringify(payments, null, 2));
} catch (e) {
  console.error('DB_ERROR', e instanceof Error ? e.message : e);
  process.exit(1);
} finally {
  await prisma.$disconnect();
}
