import { Injectable } from '@nestjs/common';
import ExcelJS from 'exceljs';
import { PrismaService } from '../prisma/prisma.service.js';
import { OrderStatus, Prisma } from '../../generated/prisma/client.js';
import type { SalesReportQueryDto } from './dto/sales-report-query.dto.js';

const BUSINESS_TZ_OFFSET_MS = 7 * 60 * 60 * 1000; // WIB (UTC+7)
const BUSINESS_TZ = 'Asia/Jakarta';

export const REVENUE_STATUSES: OrderStatus[] = [
  OrderStatus.PAID,
  OrderStatus.PROCESSING,
  OrderStatus.SHIPPED,
  OrderStatus.DELIVERED,
];

const STATUS_LABELS: Record<OrderStatus, string> = {
  PAID: 'Dibayar',
  PROCESSING: 'Diproses',
  SHIPPED: 'Dikirim',
  DELIVERED: 'Selesai',
  PENDING: 'Menunggu Pembayaran',
  CANCELLED: 'Dibatalkan',
  EXPIRED: 'Kedaluwarsa',
};

function formatWibDateTime(date: Date): string {
  const shifted = new Date(date.getTime() + BUSINESS_TZ_OFFSET_MS);
  const y = shifted.getUTCFullYear();
  const m = String(shifted.getUTCMonth() + 1).padStart(2, '0');
  const d = String(shifted.getUTCDate()).padStart(2, '0');
  const hh = String(shifted.getUTCHours()).padStart(2, '0');
  const mm = String(shifted.getUTCMinutes()).padStart(2, '0');
  const ss = String(shifted.getUTCSeconds()).padStart(2, '0');
  return `${y}-${m}-${d} ${hh}:${mm}:${ss} WIB`;
}

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
    // Default 30 hari ke belakang dari endYmd
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

  // 00:00:00.000 WIB
  const start = new Date(Date.UTC(sy, sm - 1, sd) - BUSINESS_TZ_OFFSET_MS);
  // 00:00:00.000 WIB hari berikutnya (untuk < operator)
  const end = new Date(Date.UTC(ey, em - 1, ed + 1) - BUSINESS_TZ_OFFSET_MS);

  return { start, end, startYmd, endYmd };
}

function formatWibYmd(date: Date): string {
  const shifted = new Date(date.getTime() + BUSINESS_TZ_OFFSET_MS);
  const y = shifted.getUTCFullYear();
  const m = String(shifted.getUTCMonth() + 1).padStart(2, '0');
  const d = String(shifted.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

@Injectable()
export class AdminSalesReportService {
  constructor(private readonly prisma: PrismaService) {}

  async getSalesReport(query: SalesReportQueryDto) {
    const { startDate, endDate, status, search, page, limit } = query;
    const { start, end, startYmd, endYmd } = parseWibDateToUtcRange(
      startDate,
      endDate,
    );

    // Filter dasar tanggal periode
    const dateFilter: Prisma.DateTimeFilter = {
      gte: start,
      lt: end,
    };

    // Filter status jika dipilih status tertentu
    const statusWhere: Prisma.OrderWhereInput =
      status && status !== 'ALL' ? { status: status } : {};

    // Filter search penerima atau nomor pesanan
    let searchWhere: Prisma.OrderWhereInput = {};
    if (search) {
      const parsedId = Number(search.replace(/[^0-9]/g, ''));
      const orConditions: Prisma.OrderWhereInput[] = [
        { recipientName: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } },
      ];
      if (!Number.isNaN(parsedId) && parsedId > 0) {
        orConditions.push({ id: parsedId });
      }
      searchWhere = { OR: orConditions };
    }

    const reportTableWhere: Prisma.OrderWhereInput = {
      createdAt: dateFilter,
      ...statusWhere,
      ...searchWhere,
    };

    // 1. Agregasi Omzet & Statistik Periode
    // Omzet dihitung dari pesanan yang sah (PAID, PROCESSING, SHIPPED, DELIVERED)
    const revenueWhere: Prisma.OrderWhereInput = {
      createdAt: dateFilter,
      status: { in: REVENUE_STATUSES },
    };

    const [
      revenueAggregate,
      totalOrdersCount,
      completedOrdersCount,
      revenueItemsAggregate,
      statusGroupResults,
    ] = await Promise.all([
      // Total omzet dari pesanan valid dalam rentang tanggal
      this.prisma.order.aggregate({
        where: revenueWhere,
        _sum: { total: true },
      }),

      // Total seluruh pesanan dalam rentang tanggal (semua status)
      this.prisma.order.count({
        where: { createdAt: dateFilter },
      }),

      // Jumlah pesanan yang menghasilkan omzet dalam rentang tanggal
      this.prisma.order.count({
        where: revenueWhere,
      }),

      // Total quantity item terjual dari pesanan yang sah (omzet)
      this.prisma.orderItem.aggregate({
        where: {
          order: revenueWhere,
        },
        _sum: { quantity: true },
      }),

      // Distribusi status pesanan dalam rentang tanggal
      this.prisma.order.groupBy({
        by: ['status'],
        where: { createdAt: dateFilter },
        _count: { _all: true },
      }),
    ]);

    const totalRevenue = revenueAggregate._sum.total ?? 0;
    const totalItemsSold = revenueItemsAggregate._sum.quantity ?? 0;
    const averageOrderValue =
      completedOrdersCount > 0
        ? Math.round(totalRevenue / completedOrdersCount)
        : 0;

    // Status distribution map
    const statusDistribution: Record<OrderStatus, number> = {
      PENDING: 0,
      PAID: 0,
      PROCESSING: 0,
      SHIPPED: 0,
      DELIVERED: 0,
      CANCELLED: 0,
      EXPIRED: 0,
    };
    for (const group of statusGroupResults) {
      statusDistribution[group.status] = group._count._all;
    }

    // 2. Trend Harian (Hanya buat point harian per hari di rentang tanggal, maks 90 hari)
    // Hitung hari antara startYmd dan endYmd
    const [sy, sm, sd] = startYmd.split('-').map(Number);
    const [ey, em, ed] = endYmd.split('-').map(Number);
    const startDateUtc = Date.UTC(sy, sm - 1, sd);
    const endDateUtc = Date.UTC(ey, em - 1, ed);
    const dayDiff = Math.round(
      (endDateUtc - startDateUtc) / (24 * 60 * 60 * 1000),
    );

    const dailyTrendMap = new Map<
      string,
      { date: string; revenue: number; orderCount: number }
    >();

    for (let i = 0; i <= dayDiff; i++) {
      const curDate = new Date(startDateUtc + i * 24 * 60 * 60 * 1000);
      const y = curDate.getUTCFullYear();
      const m = String(curDate.getUTCMonth() + 1).padStart(2, '0');
      const d = String(curDate.getUTCDate()).padStart(2, '0');
      const ymd = `${y}-${m}-${d}`;
      dailyTrendMap.set(ymd, { date: ymd, revenue: 0, orderCount: 0 });
    }

    // Ambil pesanan dalam periode untuk rekap harian trend
    const periodOrdersForTrend = await this.prisma.order.findMany({
      where: { createdAt: dateFilter },
      select: {
        createdAt: true,
        total: true,
        status: true,
      },
    });

    for (const ord of periodOrdersForTrend) {
      const ymd = formatWibYmd(ord.createdAt);
      const entry = dailyTrendMap.get(ymd);
      if (entry) {
        entry.orderCount += 1;
        if (REVENUE_STATUSES.includes(ord.status)) {
          entry.revenue += ord.total;
        }
      }
    }

    const dailyTrends = Array.from(dailyTrendMap.values());

    // 3. Data Transaksi Tabel dengan Pagination
    const skip = (page - 1) * limit;

    const [tableOrders, tableTotalCount] = await Promise.all([
      this.prisma.order.findMany({
        where: reportTableWhere,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          items: {
            include: {
              product: {
                select: { id: true, name: true, image: true },
              },
              variant: {
                select: { id: true, color: true, size: true },
              },
            },
          },
          payments: {
            orderBy: { attempt: 'desc' },
            take: 1,
            select: {
              id: true,
              paymentMethod: true,
              status: true,
              createdAt: true,
            },
          },
        },
      }),
      this.prisma.order.count({
        where: reportTableWhere,
      }),
    ]);

    const formattedTransactions = tableOrders.map((order) => {
      const latestPayment = order.payments[0] ?? null;
      return {
        id: order.id,
        orderNumber: `#ORD-${order.id}`,
        createdAt: order.createdAt.toISOString(),
        dateWib: formatWibYmd(order.createdAt),
        recipientName: order.recipientName,
        phone: order.phone,
        city: order.city,
        province: order.province,
        subtotal: order.subtotal,
        shippingFee: order.shippingFee,
        total: order.total,
        status: order.status,
        isRevenue: REVENUE_STATUSES.includes(order.status),
        paymentMethod: latestPayment?.paymentMethod ?? null,
        paymentStatus: latestPayment?.status ?? null,
        itemsCount: order.items.reduce((acc, it) => acc + it.quantity, 0),
        items: order.items.map((it) => ({
          id: it.id,
          productId: it.productId,
          productName: it.product.name,
          quantity: it.quantity,
          price: it.price,
          subtotal: it.subtotal,
          variant: it.variant
            ? [it.variant.color, it.variant.size].filter(Boolean).join(' / ')
            : null,
        })),
      };
    });

    return {
      period: {
        startDate: startYmd,
        endDate: endYmd,
        timezone: BUSINESS_TZ,
      },
      summary: {
        totalRevenue,
        totalOrders: totalOrdersCount,
        completedOrders: completedOrdersCount,
        totalItemsSold,
        averageOrderValue,
      },
      statusDistribution,
      dailyTrends,
      transactions: {
        data: formattedTransactions,
        meta: {
          page,
          limit,
          total: tableTotalCount,
          totalPages: Math.ceil(tableTotalCount / limit) || 1,
        },
      },
    };
  }

  /**
   * Export Laporan Penjualan ke Excel (.xlsx) dengan 2 sheet:
   * Sheet 1: Ringkasan Penjualan (KPI, distribusi status)
   * Sheet 2: Detail Transaksi (seluruh pesanan yang cocok dengan filter)
   */
  async exportSalesReportExcel(query: SalesReportQueryDto): Promise<{
    buffer: Buffer;
    filename: string;
  }> {
    const { startDate, endDate, status, search } = query;
    const { start, end, startYmd, endYmd } = parseWibDateToUtcRange(
      startDate,
      endDate,
    );

    const dateFilter: Prisma.DateTimeFilter = {
      gte: start,
      lt: end,
    };

    const statusWhere: Prisma.OrderWhereInput =
      status && status !== 'ALL' ? { status } : {};

    let searchWhere: Prisma.OrderWhereInput = {};
    if (search) {
      const parsedId = Number(search.replace(/[^0-9]/g, ''));
      const orConditions: Prisma.OrderWhereInput[] = [
        { recipientName: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } },
      ];
      if (!Number.isNaN(parsedId) && parsedId > 0) {
        orConditions.push({ id: parsedId });
      }
      searchWhere = { OR: orConditions };
    }

    const reportTableWhere: Prisma.OrderWhereInput = {
      createdAt: dateFilter,
      ...statusWhere,
      ...searchWhere,
    };

    const revenueWhere: Prisma.OrderWhereInput = {
      createdAt: dateFilter,
      status: { in: REVENUE_STATUSES },
    };

    // 1. Ambil seluruh data yang dibutuhkan
    const [
      revenueAggregate,
      totalOrdersCount,
      completedOrdersCount,
      revenueItemsAggregate,
      statusGroupResults,
      allOrders,
    ] = await Promise.all([
      this.prisma.order.aggregate({
        where: revenueWhere,
        _sum: { total: true },
      }),
      this.prisma.order.count({
        where: { createdAt: dateFilter },
      }),
      this.prisma.order.count({
        where: revenueWhere,
      }),
      this.prisma.orderItem.aggregate({
        where: { order: revenueWhere },
        _sum: { quantity: true },
      }),
      this.prisma.order.groupBy({
        by: ['status'],
        where: { createdAt: dateFilter },
        _count: { _all: true },
      }),
      this.prisma.order.findMany({
        where: reportTableWhere,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: { id: true, name: true, email: true, phone: true },
          },
          payments: {
            orderBy: { attempt: 'desc' },
            take: 1,
            select: { paymentMethod: true, status: true },
          },
          items: {
            select: { quantity: true },
          },
        },
      }),
    ]);

    const totalRevenue = revenueAggregate._sum.total ?? 0;
    const totalItemsSold = revenueItemsAggregate._sum.quantity ?? 0;
    const averageOrderValue =
      completedOrdersCount > 0
        ? Math.round(totalRevenue / completedOrdersCount)
        : 0;

    const statusDistribution: Record<OrderStatus, number> = {
      PENDING: 0,
      PAID: 0,
      PROCESSING: 0,
      SHIPPED: 0,
      DELIVERED: 0,
      CANCELLED: 0,
      EXPIRED: 0,
    };
    for (const group of statusGroupResults) {
      statusDistribution[group.status] = group._count._all;
    }

    // 2. Susun Workbook ExcelJS
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Atelier Ecommerce';
    workbook.lastModifiedBy = 'Atelier Admin';
    workbook.created = new Date();
    workbook.modified = new Date();

    const navyFill: ExcelJS.Fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF2F5D86' },
    };
    const charcoalFill: ExcelJS.Fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF333333' },
    };
    const thinBorder: Partial<ExcelJS.Borders> = {
      top: { style: 'thin', color: { argb: 'FFE0E0E0' } },
      left: { style: 'thin', color: { argb: 'FFE0E0E0' } },
      bottom: { style: 'thin', color: { argb: 'FFE0E0E0' } },
      right: { style: 'thin', color: { argb: 'FFE0E0E0' } },
    };

    // ── SHEET 1: RINGKASAN PENJUALAN ─────────────────────────────
    const wsSummary = workbook.addWorksheet('Ringkasan Penjualan', {
      views: [{ showGridLines: true }],
    });

    wsSummary.columns = [
      { width: 30 }, // A
      { width: 24 }, // B
      { width: 22 }, // C
      { width: 18 }, // D
      { width: 16 }, // E
    ];

    // Header Laporan
    wsSummary.addRow(['ATELIER ECOMMERCE']).font = {
      name: 'Calibri',
      size: 14,
      bold: true,
      color: { argb: 'FF1A1A1A' },
    };
    wsSummary.addRow(['LAPORAN PENJUALAN TOKO']).font = {
      name: 'Calibri',
      size: 16,
      bold: true,
      color: { argb: 'FF2F5D86' },
    };
    wsSummary.addRow([
      `Periode: ${startYmd} s/d ${endYmd} (Asia/Jakarta, WIB)`,
    ]).font = {
      name: 'Calibri',
      size: 10,
      italic: true,
      color: { argb: 'FF555555' },
    };
    wsSummary.addRow([
      `Waktu Ekspor: ${formatWibDateTime(new Date())}`,
    ]).font = {
      name: 'Calibri',
      size: 10,
      italic: true,
      color: { argb: 'FF777777' },
    };
    wsSummary.addRow([]); // Blank line

    // Tabel KPI Ringkasan
    const kpiHeaderRow = wsSummary.addRow([
      'Indikator Bisnis',
      'Nilai',
      'Keterangan',
    ]);
    kpiHeaderRow.font = { name: 'Calibri', bold: true, color: { argb: 'FFFFFFFF' } };
    kpiHeaderRow.eachCell((cell, colNumber) => {
      if (colNumber <= 3) {
        cell.fill = navyFill;
        cell.alignment = { vertical: 'middle' };
      }
    });

    const kpiData = [
      [
        'Total Omzet Sah',
        totalRevenue,
        'Akumulasi pesanan sah: PAID, PROCESSING, SHIPPED, DELIVERED',
        '"Rp"#,##0',
      ],
      [
        'Jumlah Pesanan Sah',
        completedOrdersCount,
        'Pesanan yang diakui sebagai omzet sah',
        '#,##0 "pesanan"',
      ],
      [
        'Total Seluruh Pesanan Masuk',
        totalOrdersCount,
        'Semua pesanan dalam rentang tanggal (termasuk pending/batal)',
        '#,##0 "pesanan"',
      ],
      [
        'Rata-rata Nilai Pesanan (AOV)',
        averageOrderValue,
        'Rata-rata omzet per pesanan sah',
        '"Rp"#,##0',
      ],
      [
        'Total Unit Produk Terjual',
        totalItemsSold,
        'Kuantitas produk dari pesanan sah',
        '#,##0 "unit"',
      ],
    ];

    for (const [label, val, note, fmt] of kpiData) {
      const r = wsSummary.addRow([label, val, note]);
      r.getCell(1).font = { bold: true };
      r.getCell(2).numFmt = fmt as string;
      r.getCell(2).font = { bold: true };
      r.getCell(3).font = { color: { argb: 'FF555555' } };
      for (let c = 1; c <= 3; c++) {
        r.getCell(c).border = thinBorder;
      }
    }

    wsSummary.addRow([]); // Blank line

    // Tabel Distribusi Status Pesanan
    const statusHeaderRow = wsSummary.addRow([
      'Status Pesanan',
      'Kode Internal',
      'Klasifikasi Omzet',
      'Jumlah Pesanan',
      'Persentase',
    ]);
    statusHeaderRow.font = {
      name: 'Calibri',
      bold: true,
      color: { argb: 'FFFFFFFF' },
    };
    statusHeaderRow.eachCell((cell, colNumber) => {
      if (colNumber <= 5) {
        cell.fill = charcoalFill;
        cell.alignment = { vertical: 'middle' };
      }
    });

    const statuses: Array<{
      status: OrderStatus;
      isRevenue: boolean;
    }> = [
      { status: OrderStatus.PAID, isRevenue: true },
      { status: OrderStatus.PROCESSING, isRevenue: true },
      { status: OrderStatus.SHIPPED, isRevenue: true },
      { status: OrderStatus.DELIVERED, isRevenue: true },
      { status: OrderStatus.PENDING, isRevenue: false },
      { status: OrderStatus.CANCELLED, isRevenue: false },
      { status: OrderStatus.EXPIRED, isRevenue: false },
    ];

    for (const item of statuses) {
      const count = statusDistribution[item.status];
      const pct = totalOrdersCount > 0 ? count / totalOrdersCount : 0;
      const r = wsSummary.addRow([
        STATUS_LABELS[item.status],
        item.status,
        item.isRevenue ? 'Omzet Sah' : 'Bukan Omzet',
        count,
        pct,
      ]);

      r.getCell(1).font = { bold: item.isRevenue };
      r.getCell(3).font = {
        color: { argb: item.isRevenue ? 'FF1E7E34' : 'FF6C757D' },
        bold: item.isRevenue,
      };
      r.getCell(4).numFmt = '#,##0';
      r.getCell(5).numFmt = '0.0%';

      for (let c = 1; c <= 5; c++) {
        r.getCell(c).border = thinBorder;
      }
    }

    // Total status row
    const totalStatusRow = wsSummary.addRow([
      'Total Seluruh Status',
      '—',
      '—',
      totalOrdersCount,
      totalOrdersCount > 0 ? 1 : 0,
    ]);
    totalStatusRow.font = { bold: true };
    totalStatusRow.getCell(4).numFmt = '#,##0';
    totalStatusRow.getCell(5).numFmt = '0.0%';
    for (let c = 1; c <= 5; c++) {
      totalStatusRow.getCell(c).border = {
        top: { style: 'double', color: { argb: 'FF888888' } },
        bottom: { style: 'thin', color: { argb: 'FF888888' } },
      };
    }

    // ── SHEET 2: DETAIL TRANSAKSI ────────────────────────────────
    const wsDetail = workbook.addWorksheet('Detail Transaksi', {
      views: [{ state: 'frozen', ySplit: 1, showGridLines: true }],
    });

    wsDetail.columns = [
      { header: 'No.', width: 8 },
      { header: 'ID Pesanan', width: 16 },
      { header: 'Tanggal Pesanan (WIB)', width: 24 },
      { header: 'Nama Pelanggan', width: 26 },
      { header: 'Email Pelanggan', width: 28 },
      { header: 'Nomor Telepon', width: 18 },
      { header: 'Kota & Provinsi', width: 24 },
      { header: 'Status Pesanan', width: 20 },
      { header: 'Klasifikasi Omzet', width: 18 },
      { header: 'Metode Pembayaran', width: 22 },
      { header: 'Jumlah Item', width: 14 },
      { header: 'Subtotal (Rp)', width: 18 },
      { header: 'Ongkos Kirim (Rp)', width: 16 },
      { header: 'Total Transaksi (Rp)', width: 20 },
    ];

    const detailHeaderRow = wsDetail.getRow(1);
    detailHeaderRow.font = {
      name: 'Calibri',
      bold: true,
      color: { argb: 'FFFFFFFF' },
    };
    detailHeaderRow.height = 26;
    detailHeaderRow.eachCell((cell) => {
      cell.fill = navyFill;
      cell.alignment = { vertical: 'middle', horizontal: 'center' };
    });

    wsDetail.autoFilter = 'A1:N1';

    let rowIdx = 1;
    let sumSubtotal = 0;
    let sumShipping = 0;
    let sumTotal = 0;
    let sumItems = 0;

    for (const order of allOrders) {
      rowIdx += 1;
      const latestPayment = order.payments[0] ?? null;
      const isRev = REVENUE_STATUSES.includes(order.status);
      const itemsCount = order.items.reduce((acc, it) => acc + it.quantity, 0);

      sumSubtotal += order.subtotal;
      sumShipping += order.shippingFee;
      sumTotal += order.total;
      sumItems += itemsCount;

      const customerName = order.user?.name ?? order.recipientName;
      const customerEmail = order.user?.email ?? '—';
      const customerPhone = order.phone ?? order.user?.phone ?? '—';
      const location =
        [order.city, order.province].filter(Boolean).join(', ') || '—';

      const row = wsDetail.addRow([
        rowIdx - 1,
        `#ORD-${order.id}`,
        formatWibDateTime(order.createdAt),
        customerName,
        customerEmail,
        customerPhone,
        location,
        STATUS_LABELS[order.status],
        isRev ? 'Omzet Sah' : 'Bukan Omzet',
        latestPayment?.paymentMethod ?? '—',
        itemsCount,
        order.subtotal,
        order.shippingFee,
        order.total,
      ]);

      // Alignments & formats
      row.getCell(1).alignment = { horizontal: 'center' };
      row.getCell(2).alignment = { horizontal: 'center' };
      row.getCell(3).alignment = { horizontal: 'center' };
      row.getCell(8).alignment = { horizontal: 'center' };
      row.getCell(9).alignment = { horizontal: 'center' };
      row.getCell(10).alignment = { horizontal: 'center' };
      row.getCell(11).alignment = { horizontal: 'right' };
      row.getCell(12).alignment = { horizontal: 'right' };
      row.getCell(13).alignment = { horizontal: 'right' };
      row.getCell(14).alignment = { horizontal: 'right' };

      row.getCell(9).font = {
        color: { argb: isRev ? 'FF1E7E34' : 'FF6C757D' },
        bold: isRev,
      };

      row.getCell(11).numFmt = '#,##0';
      row.getCell(12).numFmt = '"Rp"#,##0';
      row.getCell(13).numFmt = '"Rp"#,##0';
      row.getCell(14).numFmt = '"Rp"#,##0';

      for (let c = 1; c <= 14; c++) {
        row.getCell(c).border = thinBorder;
      }
    }

    if (allOrders.length === 0) {
      const emptyRow = wsDetail.addRow([
        '',
        'Tidak ada transaksi yang cocok dengan filter yang dipilih.',
      ]);
      emptyRow.font = { italic: true, color: { argb: 'FF888888' } };
    } else {
      // Summary footer row
      const summaryRow = wsDetail.addRow([
        'Total',
        `(${allOrders.length} Pesanan)`,
        '',
        '',
        '',
        '',
        '',
        '',
        '',
        '',
        sumItems,
        sumSubtotal,
        sumShipping,
        sumTotal,
      ]);
      summaryRow.font = { bold: true };
      summaryRow.getCell(1).alignment = { horizontal: 'center' };
      summaryRow.getCell(11).numFmt = '#,##0';
      summaryRow.getCell(12).numFmt = '"Rp"#,##0';
      summaryRow.getCell(13).numFmt = '"Rp"#,##0';
      summaryRow.getCell(14).numFmt = '"Rp"#,##0';

      for (let c = 1; c <= 14; c++) {
        summaryRow.getCell(c).border = {
          top: { style: 'double', color: { argb: 'FF888888' } },
          bottom: { style: 'thin', color: { argb: 'FF888888' } },
        };
      }
    }

    const buffer = await workbook.xlsx.writeBuffer();
    const filename = `atelier-laporan-penjualan-${startYmd}-${endYmd}.xlsx`;

    return {
      buffer: Buffer.from(buffer),
      filename,
    };
  }
}
