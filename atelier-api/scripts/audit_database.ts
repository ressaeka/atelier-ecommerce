import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../generated/prisma/client.js';

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
});
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('=== AUDIT POSTGRESQL ATELIER DATASET ===\n');

  // 1. Fetch all orders with orderNumber ATL-%
  const orders = await prisma.order.findMany({
    where: {
      orderNumber: { startsWith: 'ATL-' }
    },
    include: {
      user: true,
      items: {
        include: {
          product: {
            include: {
              category: true
            }
          }
        }
      }
    },
    orderBy: { orderNumber: 'asc' }
  });

  console.log(`Total ATL orders in database: ${orders.length}`);

  // Check order numbers ATL-001 to ATL-030
  const orderNumbers = orders.map(o => o.orderNumber);
  const expectedNumbers = Array.from({ length: 30 }, (_, i) => `ATL-${String(i + 1).padStart(3, '0')}`);
  const missingNumbers = expectedNumbers.filter(n => !orderNumbers.includes(n));
  console.log(`Order numbers completeness: ${missingNumbers.length === 0 ? 'COMPLETE (ATL-001 s.d ATL-030)' : 'MISSING: ' + missingNumbers.join(', ')}`);

  // 2. Check Monthly Distribution (Mei–Oktober 2026, 5 per month)
  const monthlyCount: Record<string, number> = {};
  for (const o of orders) {
    const month = o.createdAt.toISOString().slice(0, 7); // YYYY-MM
    monthlyCount[month] = (monthlyCount[month] || 0) + 1;
  }
  console.log('\nMonthly distribution:');
  for (const [m, count] of Object.entries(monthlyCount).sort()) {
    console.log(`  ${m}: ${count} orders`);
  }

  // 3. Unique Customers, Products, Categories
  const uniqueCustomers = new Set<string>();
  const uniqueProducts = new Set<string>();
  const uniqueCategories = new Set<string>();

  let formulaViolations = 0;
  let grossSales = 0;
  let cancelledSales = 0;
  let nonCancelledSales = 0;
  let completedRevenue = 0;

  const statusCount: Record<string, number> = {};

  for (const o of orders) {
    uniqueCustomers.add(o.user.name || o.recipientName);
    statusCount[o.status] = (statusCount[o.status] || 0) + 1;

    // Check item formula
    for (const item of o.items) {
      uniqueProducts.add(item.product.name);
      if (item.product.category) {
        uniqueCategories.add(item.product.category.name);
      }
      const calculatedTotal = (item.price * item.quantity) + (o.shippingFee || 0);
      if (calculatedTotal !== o.total) {
        console.error(`Formula violation on ${o.orderNumber}: calculated ${calculatedTotal} vs total ${o.total}`);
        formulaViolations++;
      }
    }

    grossSales += o.total;
    if (o.status === 'CANCELLED') {
      cancelledSales += o.total;
    } else {
      nonCancelledSales += o.total;
      if (o.status === 'DELIVERED') {
        completedRevenue += o.total;
      }
    }
  }

  console.log(`\nUnique Customers (${uniqueCustomers.size}):`, Array.from(uniqueCustomers).sort());
  console.log(`\nUnique Products (${uniqueProducts.size}):`, Array.from(uniqueProducts).sort());
  console.log(`\nUnique Categories (${uniqueCategories.size}):`, Array.from(uniqueCategories).sort());

  console.log('\nStatus Distribution:');
  for (const [st, count] of Object.entries(statusCount)) {
    console.log(`  ${st}: ${count}`);
  }

  console.log('\nFinancial Totals:');
  console.log(`  Gross Sales: Rp ${grossSales.toLocaleString('id-ID')} (Expected: Rp 20.017.000)`);
  console.log(`  Cancelled Sales: Rp ${cancelledSales.toLocaleString('id-ID')} (Expected: Rp 1.597.000)`);
  console.log(`  Non-Cancelled Sales: Rp ${nonCancelledSales.toLocaleString('id-ID')} (Expected: Rp 18.420.000)`);
  console.log(`  Completed Revenue (DELIVERED): Rp ${completedRevenue.toLocaleString('id-ID')} (Expected: Rp 15.035.000)`);
  console.log(`  Formula Violations: ${formulaViolations}`);

  console.log('\nAll 30 Transactions Audit:');
  for (const o of orders) {
    const item = o.items[0];
    console.log(`  ${o.orderNumber} | ${o.createdAt.toISOString().slice(0, 10)} | ${o.user.name} | ${item?.product.name} (${item?.product.category?.name}) | Qty: ${item?.quantity} | Harga: ${item?.price} | Ongkir: ${o.shippingFee} | Total: ${o.total} | ${o.status}`);
  }
}

main()
  .catch(e => {
    console.error('Audit failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
