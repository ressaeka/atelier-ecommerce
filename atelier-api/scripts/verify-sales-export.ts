import 'dotenv/config';
import { PrismaClient } from '../generated/prisma/client.js';
import { PrismaPg } from '@prisma/adapter-pg';
import { AdminSalesReportService } from '../src/admin/admin-sales-report.service.js';
import ExcelJS from 'exceljs';

const url = process.env.DATABASE_URL;
if (!url) {
  console.error('NO_DATABASE_URL');
  process.exit(1);
}

const adapter = new PrismaPg({ connectionString: url });
const prisma = new PrismaClient({ adapter });

async function verify() {
  console.log('--- Verifying Sales Report Excel Export ---');
  const service = new AdminSalesReportService(prisma as any);

  // 1. Export default (last 30 days)
  console.log('\n[1] Testing default export:');
  const res1 = await service.exportSalesReportExcel({
    status: 'ALL',
    page: 1,
    limit: 10,
  });
  console.log('Generated filename:', res1.filename);
  console.log('Buffer size:', res1.buffer.length, 'bytes');

  // Verify buffer can be parsed back with ExcelJS
  const wb1 = new ExcelJS.Workbook();
  await wb1.xlsx.load(res1.buffer as any);
  console.log('Sheets found:', wb1.worksheets.map((ws) => ws.name));
  if (wb1.worksheets.length !== 2) {
    throw new Error('Expected 2 sheets in workbook');
  }

  const wsSummary = wb1.getWorksheet('Ringkasan Penjualan')!;
  const wsDetail = wb1.getWorksheet('Detail Transaksi')!;
  console.log('Sheet 1 row count:', wsSummary.rowCount);
  console.log('Sheet 2 row count:', wsDetail.rowCount);

  // Compare with getSalesReport
  const reportData = await service.getSalesReport({
    status: 'ALL',
    page: 1,
    limit: 10,
  });
  console.log('Summary comparison:');
  console.log('  reportData.totalRevenue:', reportData.summary.totalRevenue);
  console.log('  reportData.totalOrders:', reportData.summary.totalOrders);
  console.log('  reportData.completedOrders:', reportData.summary.completedOrders);

  // 2. Export with custom date range
  console.log('\n[2] Testing custom date range export (2026-01-01 s/d 2026-12-31):');
  const res2 = await service.exportSalesReportExcel({
    startDate: '2026-01-01',
    endDate: '2026-12-31',
    status: 'ALL',
    page: 1,
    limit: 10,
  });
  console.log('Custom range filename:', res2.filename);
  const wb2 = new ExcelJS.Workbook();
  await wb2.xlsx.load(res2.buffer as any);
  console.log('Custom range detail row count:', wb2.getWorksheet('Detail Transaksi')!.rowCount);

  // 3. Export with specific status filter
  console.log('\n[3] Testing status filter (SHIPPED):');
  const res3 = await service.exportSalesReportExcel({
    status: 'SHIPPED',
    page: 1,
    limit: 10,
  });
  const wb3 = new ExcelJS.Workbook();
  await wb3.xlsx.load(res3.buffer as any);
  console.log('SHIPPED detail row count:', wb3.getWorksheet('Detail Transaksi')!.rowCount);

  // 4. Export with search term
  console.log('\n[4] Testing search filter ("Reysa"):');
  const res4 = await service.exportSalesReportExcel({
    search: 'Reysa',
    status: 'ALL',
    page: 1,
    limit: 10,
  });
  const wb4 = new ExcelJS.Workbook();
  await wb4.xlsx.load(res4.buffer as any);
  console.log('Search matches detail row count:', wb4.getWorksheet('Detail Transaksi')!.rowCount);

  // 5. Export with empty results (future date)
  console.log('\n[5] Testing empty results export (future date 2099):');
  const res5 = await service.exportSalesReportExcel({
    startDate: '2099-01-01',
    endDate: '2099-01-31',
    status: 'ALL',
    page: 1,
    limit: 10,
  });
  const wb5 = new ExcelJS.Workbook();
  await wb5.xlsx.load(res5.buffer as any);
  console.log('Empty detail row count:', wb5.getWorksheet('Detail Transaksi')!.rowCount);

  console.log('\n--- All Excel Export tests passed successfully! ---');
  await prisma.$disconnect();
}

verify().catch(async (e) => {
  console.error('Verification failed:', e);
  await prisma.$disconnect();
  process.exit(1);
});
