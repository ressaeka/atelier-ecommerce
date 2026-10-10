import 'dotenv/config';
import { PrismaClient } from '../generated/prisma/client.js';
import { PrismaPg } from '@prisma/adapter-pg';
import { AdminBestSellingService } from '../src/admin/admin-best-selling.service.js';

const url = process.env.DATABASE_URL;
if (!url) {
  console.error('NO_DATABASE_URL');
  process.exit(1);
}

const adapter = new PrismaPg({ connectionString: url });
const prisma = new PrismaClient({ adapter });

async function verify() {
  console.log('--- Verifying AdminBestSellingService ---');
  const service = new AdminBestSellingService(prisma as any);

  // 1. Default call (last 30 days)
  console.log('\n[1] Testing default query:');
  const defaultRes = await service.getBestSellingProducts({
    page: 1,
    limit: 10,
    sortBy: 'sold',
    sortOrder: 'desc',
  });
  console.log('Period:', defaultRes.period);
  console.log('Summary:', defaultRes.summary);
  console.log('Items returned:', defaultRes.products.data.length);
  console.log('Meta:', defaultRes.products.meta);
  if (defaultRes.products.data.length > 0) {
    console.log('Top #1 product:', {
      rank: defaultRes.products.data[0].rank,
      name: defaultRes.products.data[0].name,
      unitsSold: defaultRes.products.data[0].unitsSold,
      revenue: defaultRes.products.data[0].revenue,
      category: defaultRes.products.data[0].categoryName,
    });
  }

  // 2. Sort by revenue desc
  console.log('\n[2] Testing sort by revenue desc:');
  const revRes = await service.getBestSellingProducts({
    page: 1,
    limit: 5,
    sortBy: 'revenue',
    sortOrder: 'desc',
  });
  console.log(
    'Products ranked by revenue:',
    revRes.products.data.map((p) => ({
      rank: p.rank,
      name: p.name,
      revenue: p.revenue,
      unitsSold: p.unitsSold,
    })),
  );

  // 3. Search query
  console.log('\n[3] Testing search filter:');
  const searchRes = await service.getBestSellingProducts({
    page: 1,
    limit: 5,
    search: 'a',
    sortBy: 'sold',
    sortOrder: 'desc',
  });
  console.log('Matches with search "a":', searchRes.products.meta.total);

  // 4. Custom date range
  console.log('\n[4] Testing custom date range:');
  const dateRes = await service.getBestSellingProducts({
    startDate: '2026-01-01',
    endDate: '2026-12-31',
    page: 1,
    limit: 5,
    sortBy: 'sold',
    sortOrder: 'desc',
  });
  console.log('Period:', dateRes.period);
  console.log('Total revenue in 2026:', dateRes.summary.totalRevenue);
  console.log('Total units sold in 2026:', dateRes.summary.totalUnitsSold);

  console.log('\n--- AdminBestSellingService verification completed successfully! ---');
  await prisma.$disconnect();
}

verify().catch(async (e) => {
  console.error('Verification failed:', e);
  await prisma.$disconnect();
  process.exit(1);
});
