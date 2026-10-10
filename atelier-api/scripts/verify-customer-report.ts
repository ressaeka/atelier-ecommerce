import 'dotenv/config';
import { PrismaClient } from '../generated/prisma/client.js';
import { PrismaPg } from '@prisma/adapter-pg';
import { AdminCustomerReportService } from '../src/admin/admin-customer-report.service.js';

const url = process.env.DATABASE_URL;
if (!url) {
  console.error('NO_DATABASE_URL');
  process.exit(1);
}

const adapter = new PrismaPg({ connectionString: url });
const prisma = new PrismaClient({ adapter });

async function verify() {
  console.log('--- Verifying AdminCustomerReportService ---');
  const service = new AdminCustomerReportService(prisma as any);

  // 1. Default call (all customers, 30 days)
  console.log('\n[1] Testing default query (customerType: all):');
  const defaultRes = await service.getCustomerReport({
    page: 1,
    limit: 10,
    customerType: 'all',
    sortBy: 'totalSpent',
    sortOrder: 'desc',
  });
  console.log('Period:', defaultRes.period);
  console.log('Summary:', defaultRes.summary);
  console.log('Total customers returned:', defaultRes.customers.data.length);
  console.log(
    'Customers data:',
    defaultRes.customers.data.map((c) => ({
      id: c.id,
      name: c.name,
      email: c.email,
      totalOrders: c.totalOrders,
      totalSpent: c.totalSpent,
      aov: c.averageOrderValue,
      hasPurchased: c.hasPurchasedInPeriod,
    })),
  );

  // 2. Filter active customers only
  console.log('\n[2] Testing customerType: active:');
  const activeRes = await service.getCustomerReport({
    page: 1,
    limit: 10,
    customerType: 'active',
  });
  console.log('Active customers count:', activeRes.customers.meta.total);
  console.log(
    'Active customers:',
    activeRes.customers.data.map((c) => ({
      name: c.name,
      totalOrders: c.totalOrders,
      totalSpent: c.totalSpent,
    })),
  );

  // 3. Filter inactive customers only
  console.log('\n[3] Testing customerType: inactive:');
  const inactiveRes = await service.getCustomerReport({
    page: 1,
    limit: 10,
    customerType: 'inactive',
  });
  console.log('Inactive customers count:', inactiveRes.customers.meta.total);
  console.log(
    'Inactive customers:',
    inactiveRes.customers.data.map((c) => ({
      name: c.name,
      totalOrders: c.totalOrders,
      totalSpent: c.totalSpent,
    })),
  );

  // 4. Search filter
  console.log('\n[4] Testing search "Reysa":');
  const searchRes = await service.getCustomerReport({
    search: 'Reysa',
    page: 1,
    limit: 10,
  });
  console.log('Search matches:', searchRes.customers.meta.total);
  console.log('Found:', searchRes.customers.data.map((c) => c.name));

  // 5. Empty period test (future date)
  console.log('\n[5] Testing empty period (future date):');
  const emptyRes = await service.getCustomerReport({
    startDate: '2099-01-01',
    endDate: '2099-01-31',
    customerType: 'active',
    page: 1,
    limit: 10,
  });
  console.log('Summary in empty period:', emptyRes.summary);
  console.log('Active customers in empty period:', emptyRes.customers.meta.total);

  console.log('\n--- Verification completed successfully! ---');
  await prisma.$disconnect();
}

verify().catch(async (e) => {
  console.error('Verification failed:', e);
  await prisma.$disconnect();
  process.exit(1);
});
