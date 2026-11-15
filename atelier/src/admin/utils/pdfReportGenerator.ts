import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import html2canvas from 'html2canvas';

// ─── Atelier Brand Colors ───────────────────────────────────────────────────
const COLOR_ESPRESSO = [92, 64, 51] as const; // #5C4033
const COLOR_CHARCOAL = [26, 26, 26] as const; // #1A1A1A
const COLOR_MUTED = [111, 106, 98] as const; // #6F6A62
const COLOR_LIGHT_BORDER = [232, 228, 220] as const; // #E8E4DC
const COLOR_IVORY_BG = [250, 248, 244] as const; // #FAF8F4

export function formatRupiah(value: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(value || 0);
}

export function formatNumber(value: number): string {
  return new Intl.NumberFormat('id-ID').format(value || 0);
}

export function getCurrentTimestampWIB(): string {
  const now = new Date();
  return (
    new Intl.DateTimeFormat('id-ID', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      timeZone: 'Asia/Jakarta',
    }).format(now) + ' WIB'
  );
}

/**
 * Capture an HTML/SVG element to high-res PNG image data URL.
 */
async function captureElementToImage(elementId: string): Promise<string | null> {
  if (typeof document === 'undefined') return null;
  const el = document.getElementById(elementId);
  if (!el) return null;

  try {
    const canvas = await html2canvas(el, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: '#FFFFFF',
    });
    return canvas.toDataURL('image/png');
  } catch (err) {
    console.warn(`[PDF Export] Gagal capture element #${elementId}:`, err);
    return null;
  }
}

/**
 * Draw standard luxury Atelier report header
 */
function drawReportHeader(
  doc: jsPDF,
  title: string,
  subtitle: string,
  periodLabel: string,
): number {
  const pageWidth = doc.internal.pageSize.getWidth();
  let currentY = 14;

  // Background banner top
  doc.setFillColor(COLOR_IVORY_BG[0], COLOR_IVORY_BG[1], COLOR_IVORY_BG[2]);
  doc.rect(14, currentY, pageWidth - 28, 28, 'F');
  doc.setDrawColor(COLOR_LIGHT_BORDER[0], COLOR_LIGHT_BORDER[1], COLOR_LIGHT_BORDER[2]);
  doc.setLineWidth(0.3);
  doc.rect(14, currentY, pageWidth - 28, 28, 'S');

  // Brand Name & Eyebrow
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(COLOR_CHARCOAL[0], COLOR_CHARCOAL[1], COLOR_CHARCOAL[2]);
  doc.text('A T E L I E R', 20, currentY + 9);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(COLOR_ESPRESSO[0], COLOR_ESPRESSO[1], COLOR_ESPRESSO[2]);
  doc.text('LUXURY READY-TO-WEAR · EXECUTIVE REPORT', 20, currentY + 14);

  // Document Title & Subtitle
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.setTextColor(COLOR_CHARCOAL[0], COLOR_CHARCOAL[1], COLOR_CHARCOAL[2]);
  doc.text(title.toUpperCase(), 20, currentY + 21);

  if (subtitle) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.2);
    doc.setTextColor(COLOR_MUTED[0], COLOR_MUTED[1], COLOR_MUTED[2]);
    doc.text(subtitle, 20, currentY + 25);
  }

  // Right-aligned Metadata
  const rightX = pageWidth - 20;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(COLOR_MUTED[0], COLOR_MUTED[1], COLOR_MUTED[2]);
  doc.text('PERIODE LAPORAN', rightX, currentY + 8, { align: 'right' });

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(COLOR_CHARCOAL[0], COLOR_CHARCOAL[1], COLOR_CHARCOAL[2]);
  doc.text(periodLabel || 'Semua Periode', rightX, currentY + 13, { align: 'right' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(COLOR_MUTED[0], COLOR_MUTED[1], COLOR_MUTED[2]);
  doc.text(`Dicetak: ${getCurrentTimestampWIB()}`, rightX, currentY + 19, { align: 'right' });
  doc.text('Status: Terverifikasi Sistem (PostgreSQL)', rightX, currentY + 23, { align: 'right' });

  currentY += 33;
  return currentY;
}

/**
 * Render 4 summary KPI cards in a 4-column row
 */
function drawKpiRow(
  doc: jsPDF,
  startY: number,
  cards: Array<{ label: string; value: string; sub: string; highlight?: boolean }>,
): number {
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 14;
  const gap = 3.5;
  const totalWidth = pageWidth - margin * 2;
  const cardWidth = (totalWidth - gap * (cards.length - 1)) / cards.length;
  const cardHeight = 22;

  cards.forEach((card, idx) => {
    const x = margin + idx * (cardWidth + gap);

    // Card background
    if (card.highlight) {
      doc.setFillColor(248, 244, 238); // warm golden ivory
    } else {
      doc.setFillColor(COLOR_IVORY_BG[0], COLOR_IVORY_BG[1], COLOR_IVORY_BG[2]);
    }
    doc.rect(x, startY, cardWidth, cardHeight, 'F');
    doc.setDrawColor(COLOR_LIGHT_BORDER[0], COLOR_LIGHT_BORDER[1], COLOR_LIGHT_BORDER[2]);
    doc.setLineWidth(0.25);
    doc.rect(x, startY, cardWidth, cardHeight, 'S');

    // Label
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.5);
    doc.setTextColor(COLOR_MUTED[0], COLOR_MUTED[1], COLOR_MUTED[2]);
    doc.text(card.label.toUpperCase(), x + 3.5, startY + 5.5);

    // Value
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10.5);
    doc.setTextColor(card.highlight ? COLOR_ESPRESSO[0] : COLOR_CHARCOAL[0], card.highlight ? COLOR_ESPRESSO[1] : COLOR_CHARCOAL[1], card.highlight ? COLOR_ESPRESSO[2] : COLOR_CHARCOAL[2]);
    doc.text(card.value, x + 3.5, startY + 12.5);

    // Subtitle
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(COLOR_MUTED[0], COLOR_MUTED[1], COLOR_MUTED[2]);
    doc.text(card.sub, x + 3.5, startY + 18);
  });

  return startY + cardHeight + 6;
}

/**
 * Add multi-page footers across the entire document
 */
function addMultiPageFooters(doc: jsPDF, reportCode: string) {
  const totalPages = doc.getNumberOfPages();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);

    // Thin hairline
    doc.setDrawColor(COLOR_LIGHT_BORDER[0], COLOR_LIGHT_BORDER[1], COLOR_LIGHT_BORDER[2]);
    doc.setLineWidth(0.25);
    doc.line(14, pageHeight - 11, pageWidth - 14, pageHeight - 11);

    // Left notice
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.8);
    doc.setTextColor(COLOR_MUTED[0], COLOR_MUTED[1], COLOR_MUTED[2]);
    doc.text(
      `Atelier Luxury Ready-to-Wear · Dokumen Rekapitulasi Resmi · ${reportCode} · Rahasia`,
      14,
      pageHeight - 7,
    );

    // Right page number
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.2);
    doc.setTextColor(COLOR_CHARCOAL[0], COLOR_CHARCOAL[1], COLOR_CHARCOAL[2]);
    doc.text(`Halaman ${i} dari ${totalPages}`, pageWidth - 14, pageHeight - 7, {
      align: 'right',
    });
  }
}

// ─── Executive Decision Support Section ─────────────────────────────────────
interface DecisionSupportSectionData {
  reportTitle: string;
  periodLabel: string;
  executiveSummary: string[];
  insights: Array<{
    title: string;
    description: string;
    evidence: string;
  }>;
  recommendations: Array<{
    category: string;
    recommendation: string;
    dataBasis: string;
  }>;
  decisionMatrix: Array<{
    finding: string;
    evidence: string;
    impact: string;
    action: string;
  }>;
}

function renderExecutiveDecisionSupportPage(
  doc: jsPDF,
  data: DecisionSupportSectionData,
) {
  doc.addPage();
  const pageWidth = doc.internal.pageSize.getWidth();
  let y = 14;

  // 1. Header Banner
  doc.setFillColor(COLOR_IVORY_BG[0], COLOR_IVORY_BG[1], COLOR_IVORY_BG[2]);
  doc.rect(14, y, pageWidth - 28, 18, 'F');
  doc.setDrawColor(COLOR_ESPRESSO[0], COLOR_ESPRESSO[1], COLOR_ESPRESSO[2]);
  doc.setLineWidth(0.4);
  doc.rect(14, y, pageWidth - 28, 18, 'S');

  // Decorative left vertical bar in espresso
  doc.setFillColor(COLOR_ESPRESSO[0], COLOR_ESPRESSO[1], COLOR_ESPRESSO[2]);
  doc.rect(14, y, 3, 18, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.setTextColor(COLOR_CHARCOAL[0], COLOR_CHARCOAL[1], COLOR_CHARCOAL[2]);
  doc.text('ANALISIS BISNIS & DUKUNGAN KEPUTUSAN EKSEKUTIF', 21, y + 7.5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.2);
  doc.setTextColor(COLOR_MUTED[0], COLOR_MUTED[1], COLOR_MUTED[2]);
  doc.text(
    `Sintesis Kinerja Berbasis Data Aktual PostgreSQL · ${data.reportTitle} · Periode: ${data.periodLabel}`,
    21,
    y + 13,
  );

  y += 22;

  // 2. Executive Summary Block
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.2);
  doc.setTextColor(COLOR_CHARCOAL[0], COLOR_CHARCOAL[1], COLOR_CHARCOAL[2]);
  doc.text('A. RINGKASAN EKSEKUTIF KONDISI BISNIS (EXECUTIVE SUMMARY)', 14, y);
  y += 3;

  doc.setFillColor(COLOR_IVORY_BG[0], COLOR_IVORY_BG[1], COLOR_IVORY_BG[2]);
  doc.setDrawColor(COLOR_LIGHT_BORDER[0], COLOR_LIGHT_BORDER[1], COLOR_LIGHT_BORDER[2]);
  doc.setLineWidth(0.25);

  const summaryHeight = data.executiveSummary.length * 5.2 + 3.5;
  doc.rect(14, y, pageWidth - 28, summaryHeight, 'FD');

  let itemY = y + 4.5;
  data.executiveSummary.forEach((point) => {
    doc.setFillColor(COLOR_ESPRESSO[0], COLOR_ESPRESSO[1], COLOR_ESPRESSO[2]);
    doc.circle(18, itemY - 1, 0.9, 'F');

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.8);
    doc.setTextColor(COLOR_CHARCOAL[0], COLOR_CHARCOAL[1], COLOR_CHARCOAL[2]);
    const splitText = doc.splitTextToSize(point, pageWidth - 42);
    doc.text(splitText, 22, itemY);
    itemY += 5.2;
  });

  y += summaryHeight + 5;

  // 3. Business Insights & Recommendations Block
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.2);
  doc.setTextColor(COLOR_CHARCOAL[0], COLOR_CHARCOAL[1], COLOR_CHARCOAL[2]);
  doc.text('B. TEMUAN BISNIS (INSIGHTS) & REKOMENDASI STRATEGIS', 14, y);
  y += 2.5;

  const insightTableBody = data.insights.map((ins, idx) => {
    const rec = data.recommendations[idx];
    return [
      `${idx + 1}. ${ins.title}\n${ins.description}\n[Dasar Data: ${ins.evidence}]`,
      rec ? `${rec.category}: ${rec.recommendation}\n[Fokus: ${rec.dataBasis}]` : '-',
    ];
  });

  autoTable(doc, {
    startY: y,
    head: [['Hasil Analisis & Interpretasi Data (Business Insights)', 'Rekomendasi Tindakan Terarah (Actionable Recommendations)']],
    body: insightTableBody,
    theme: 'grid',
    styles: {
      fontSize: 6.6,
      cellPadding: 2,
      textColor: [30, 30, 30],
      lineColor: [232, 228, 220],
      lineWidth: 0.2,
    },
    headStyles: {
      fillColor: [92, 64, 51],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 7,
    },
    alternateRowStyles: {
      fillColor: [252, 251, 248],
    },
    columnStyles: {
      0: { cellWidth: 91 },
      1: { cellWidth: 91 },
    },
    margin: { left: 14, right: 14 },
  });

  // @ts-expect-error jspdf-autotable adds lastAutoTable to doc
  y = doc.lastAutoTable.finalY + 5;

  // 4. Decision Support Matrix Block
  if (y + 40 > 275) {
    doc.addPage();
    y = 16;
  }

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.2);
  doc.setTextColor(COLOR_CHARCOAL[0], COLOR_CHARCOAL[1], COLOR_CHARCOAL[2]);
  doc.text('C. MATRIKS DUKUNGAN KEPUTUSAN PIMPINAN (DECISION SUPPORT MATRIX)', 14, y);
  y += 2.5;

  const matrixBody = data.decisionMatrix.map((row) => [
    row.finding,
    row.evidence,
    row.impact,
    row.action,
  ]);

  autoTable(doc, {
    startY: y,
    head: [['Temuan Bisnis', 'Indikator Data Pendukung', 'Dampak Potensial Bisnis', 'Rekomendasi Tindakan Pimpinan']],
    body: matrixBody,
    theme: 'grid',
    styles: {
      fontSize: 6.6,
      cellPadding: 2,
      textColor: [30, 30, 30],
      lineColor: [232, 228, 220],
      lineWidth: 0.2,
    },
    headStyles: {
      fillColor: [26, 26, 26],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 6.9,
    },
    alternateRowStyles: {
      fillColor: [250, 248, 244],
    },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 38 },
      1: { cellWidth: 44 },
      2: { cellWidth: 46 },
      3: { fontStyle: 'bold', cellWidth: 54 },
    },
    margin: { left: 14, right: 14 },
  });

  // @ts-expect-error jspdf-autotable adds lastAutoTable to doc
  y = doc.lastAutoTable.finalY + 5;

  // 5. Data Governance & Limitations Note
  if (y + 14 > 275) {
    doc.addPage();
    y = 16;
  }

  doc.setFillColor(245, 243, 238);
  doc.rect(14, y, pageWidth - 28, 13, 'F');
  doc.setDrawColor(COLOR_LIGHT_BORDER[0], COLOR_LIGHT_BORDER[1], COLOR_LIGHT_BORDER[2]);
  doc.setLineWidth(0.2);
  doc.rect(14, y, pageWidth - 28, 13, 'S');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.2);
  doc.setTextColor(COLOR_ESPRESSO[0], COLOR_ESPRESSO[1], COLOR_ESPRESSO[2]);
  doc.text('KETENTUAN INTEGRITAS DATA & KETERBATASAN ANALISIS (GOVERNANCE NOTE):', 17, y + 4.2);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(5.6);
  doc.setTextColor(COLOR_MUTED[0], COLOR_MUTED[1], COLOR_MUTED[2]);
  doc.text(
    '• Analisis disusun secara objektif dari data aktual transaksi PostgreSQL Atelier tanpa manipulasi. Pengakuan omzet sah secara konservatif hanya bersumber dari pesanan DELIVERED.',
    17,
    y + 7.5,
  );
  doc.text(
    '• Bila data historis periode lampau belum tercatat di sistem, indikator pertumbuhan dinyatakan sebagai "Belum ada pembanding". Fakta data, tafsiran sistemik, dan usulan manajerial dipisahkan secara tegas.',
    17,
    y + 10.7,
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// 1. EXPORT LAPORAN PENJUALAN
// ═══════════════════════════════════════════════════════════════════════════

export interface SalesReportPdfData {
  periodLabel: string;
  summary: {
    grossSales: number;
    completedRevenue: number;
    nonCancelledRevenue: number;
    cancelledOrdersAmount: number;
    totalOrders: number;
    succeededOrders: number;
    cancelledOrders: number;
    averageOrderValue: number;
  };
  breakdown: {
    deliveredCount: number;
    deliveredAmount: number;
    processingCount: number;
    processingAmount: number;
    shippedCount: number;
    shippedAmount: number;
    cancelledCount: number;
    cancelledAmount: number;
  };
  transactions: Array<{
    id: number | string;
    orderNumber?: string | null;
    date: string;
    customerName: string;
    paymentMethod: string;
    status: string;
    totalAmount: number;
    itemCount: number;
  }>;
  chartElementId?: string;
}

export async function exportSalesReportPdf(data: SalesReportPdfData): Promise<void> {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  // 1. Header
  let y = drawReportHeader(
    doc,
    'Laporan Penjualan Eksekutif',
    'Rekapitulasi Omzet Sah & Transaksi Penjualan',
    data.periodLabel,
  );

  // 2. Summary KPI Cards
  y = drawKpiRow(doc, y, [
    {
      label: 'Penjualan Kotor (Gross)',
      value: formatRupiah(data.summary.grossSales),
      sub: `${data.summary.totalOrders} total pesanan`,
    },
    {
      label: 'Pendapatan Sah (Delivered)',
      value: formatRupiah(data.summary.completedRevenue),
      sub: `${data.summary.succeededOrders} pesanan selesai`,
      highlight: true,
    },
    {
      label: 'Pesanan Aktif (Non-Batal)',
      value: formatRupiah(data.summary.nonCancelledRevenue),
      sub: `${data.summary.totalOrders - data.summary.cancelledOrders} pesanan aktif`,
    },
    {
      label: 'Pesanan Dibatalkan',
      value: formatRupiah(data.summary.cancelledOrdersAmount),
      sub: `${data.summary.cancelledOrders} pesanan batal`,
    },
  ]);

  // 3. Status Breakdown Table (Summary)
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(COLOR_CHARCOAL[0], COLOR_CHARCOAL[1], COLOR_CHARCOAL[2]);
  doc.text('RINCIAN REKONSILIASI STATUS TRANSAKSI', 14, y);
  y += 2.5;

  autoTable(doc, {
    startY: y,
    head: [['Status Pesanan', 'Definisi Pengakuan', 'Jumlah Pesanan', 'Total Nilai (IDR)', 'Kontribusi Gross']],
    body: [
      [
        'DELIVERED (Selesai)',
        'Pendapatan Sah / Completed Revenue (Diakui)',
        `${data.breakdown.deliveredCount} Pesanan`,
        formatRupiah(data.breakdown.deliveredAmount),
        data.summary.grossSales > 0 ? `${((data.breakdown.deliveredAmount / data.summary.grossSales) * 100).toFixed(1)}%` : '0%',
      ],
      [
        'PROCESSING (Diproses)',
        'Dalam Proses Pemenuhan (Belum Sah)',
        `${data.breakdown.processingCount} Pesanan`,
        formatRupiah(data.breakdown.processingAmount),
        data.summary.grossSales > 0 ? `${((data.breakdown.processingAmount / data.summary.grossSales) * 100).toFixed(1)}%` : '0%',
      ],
      [
        'SHIPPED (Dikirim)',
        'Dalam Pengiriman Logistik (Belum Sah)',
        `${data.breakdown.shippedCount} Pesanan`,
        formatRupiah(data.breakdown.shippedAmount),
        data.summary.grossSales > 0 ? `${((data.breakdown.shippedAmount / data.summary.grossSales) * 100).toFixed(1)}%` : '0%',
      ],
      [
        'CANCELLED (Dibatalkan)',
        'Transaksi Dibatalkan (Tidak Diakui)',
        `${data.breakdown.cancelledCount} Pesanan`,
        formatRupiah(data.breakdown.cancelledAmount),
        data.summary.grossSales > 0 ? `${((data.breakdown.cancelledAmount / data.summary.grossSales) * 100).toFixed(1)}%` : '0%',
      ],
    ],
    theme: 'grid',
    styles: {
      fontSize: 7.5,
      cellPadding: 2,
      textColor: [30, 30, 30],
    },
    headStyles: {
      fillColor: [92, 64, 51],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 7.5,
    },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 42 },
      1: { cellWidth: 55 },
      2: { halign: 'center', cellWidth: 28 },
      3: { halign: 'right', fontStyle: 'bold', cellWidth: 35 },
      4: { halign: 'center', cellWidth: 22 },
    },
    margin: { left: 14, right: 14 },
  });

  // @ts-expect-error jspdf-autotable adds lastAutoTable to doc
  y = doc.lastAutoTable.finalY + 7;

  // 4. Chart Visualization (if present)
  if (data.chartElementId) {
    const chartImg = await captureElementToImage(data.chartElementId);
    if (chartImg) {
      if (y + 55 > 275) {
        doc.addPage();
        y = 16;
      }

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.setTextColor(COLOR_CHARCOAL[0], COLOR_CHARCOAL[1], COLOR_CHARCOAL[2]);
      doc.text('VISUALISASI TREN PENDAPATAN & PESANAN', 14, y);
      y += 3;

      const chartWidth = doc.internal.pageSize.getWidth() - 28;
      const chartHeight = 52;
      doc.addImage(chartImg, 'PNG', 14, y, chartWidth, chartHeight);
      y += chartHeight + 7;
    }
  }

  // 5. Detailed Transactions Table
  if (y + 40 > 275) {
    doc.addPage();
    y = 16;
  }

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(COLOR_CHARCOAL[0], COLOR_CHARCOAL[1], COLOR_CHARCOAL[2]);
  doc.text(`RINCIAN TRANSAKSI PESANAN (${data.transactions.length} DATA)`, 14, y);
  y += 2.5;

  const tableBody = data.transactions.map((tx, idx) => [
    (idx + 1).toString(),
    tx.orderNumber || `#${tx.id}`,
    tx.date || '-',
    tx.customerName || 'Pelanggan',
    tx.paymentMethod ? tx.paymentMethod.replace(/_/g, ' ') : '-',
    tx.itemCount ? `${tx.itemCount} unit` : '1 unit',
    tx.status || 'DELIVERED',
    formatRupiah(tx.totalAmount),
  ]);

  autoTable(doc, {
    startY: y,
    showHead: 'everyPage',
    head: [['No', 'ID Pesanan', 'Tanggal', 'Pelanggan', 'Metode Bayar', 'Qty', 'Status', 'Total Transaksi']],
    body: tableBody,
    theme: 'grid',
    styles: {
      fontSize: 7.2,
      cellPadding: 1.8,
      textColor: [30, 30, 30],
    },
    headStyles: {
      fillColor: [26, 26, 26],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 7.2,
    },
    alternateRowStyles: {
      fillColor: [250, 248, 244],
    },
    columnStyles: {
      0: { halign: 'center', cellWidth: 9 },
      1: { fontStyle: 'bold', cellWidth: 22 },
      2: { cellWidth: 25 },
      3: { cellWidth: 38 },
      4: { cellWidth: 26 },
      5: { halign: 'center', cellWidth: 16 },
      6: { halign: 'center', cellWidth: 22 },
      7: { halign: 'right', fontStyle: 'bold', cellWidth: 24 },
    },
    margin: { left: 14, right: 14, bottom: 16 },
  });

  // 6. Section 10: Executive Business Insights & Decision Support
  const deliveredPct = data.summary.grossSales > 0
    ? ((data.summary.completedRevenue / data.summary.grossSales) * 100).toFixed(1)
    : '0';
  const cancelledPct = data.summary.grossSales > 0
    ? ((data.summary.cancelledOrdersAmount / data.summary.grossSales) * 100).toFixed(1)
    : '0';
  const uncompletedCount = data.breakdown.processingCount + data.breakdown.shippedCount;
  const uncompletedAmount = data.breakdown.processingAmount + data.breakdown.shippedAmount;

  renderExecutiveDecisionSupportPage(doc, {
    reportTitle: 'Laporan Penjualan',
    periodLabel: data.periodLabel,
    executiveSummary: [
      `Penjualan Kotor (Gross Sales): Membukukan total nilai transaksi ${formatRupiah(data.summary.grossSales)} dari ${data.summary.totalOrders} pesanan tercatat pada sistem.`,
      `Pendapatan Sah (Completed Revenue): Diakui sebesar ${formatRupiah(data.summary.completedRevenue)} (${deliveredPct}% dari gross sales) dari ${data.summary.succeededOrders} pesanan yang telah selesai diterima pelanggan (DELIVERED).`,
      `Pipeline Pemenuhan Aktif: Terdapat ${uncompletedCount} pesanan aktif senilai ${formatRupiah(uncompletedAmount)} (${data.breakdown.processingCount} PROCESSING, ${data.breakdown.shippedCount} SHIPPED) yang sedang dalam proses logistik dan pemenuhan.`,
      `Tingkat Pembatalan: Teridentifikasi ${data.summary.cancelledOrders} pesanan dibatalkan senilai ${formatRupiah(data.summary.cancelledOrdersAmount)} (${cancelledPct}% dari gross sales).`,
      `Rata-rata Nilai Transaksi (AOV): Rata-rata keranjang belanja mencapai ${formatRupiah(data.summary.averageOrderValue)} per pesanan pada periode terpilih.`,
    ],
    insights: [
      {
        title: 'Tingkat Realisasi Pendapatan Sah',
        description: `Sebesar ${deliveredPct}% dari total penjualan telah berhasil direalisasikan menjadi omzet sah melalui status DELIVERED. Sisa ${((uncompletedAmount / data.summary.grossSales) * 100).toFixed(1)}% merupakan omzet tertahan dalam jalur pemenuhan logistik.`,
        evidence: `${data.summary.succeededOrders} pesanan DELIVERED (${formatRupiah(data.summary.completedRevenue)}) vs ${uncompletedCount} pesanan aktif (${formatRupiah(uncompletedAmount)})`,
      },
      {
        title: 'Pengendalian Tingkat Pembatalan (Cancellation Control)',
        description: `Tingkat pembatalan berada pada ${cancelledPct}%, masih di bawah ambang batas toleransi industri retail (<10%). Tidak ditemukan indikasi lonjakan pembatalan massal pada satu kategori spesifik.`,
        evidence: `${data.summary.cancelledOrders} pesanan CANCELLED senilai ${formatRupiah(data.summary.cancelledOrdersAmount)}`,
      },
      {
        title: 'Pola Transaksi & Metode Pembayaran Digital',
        description: 'Seluruh transaksi menggunakan kanal pembayaran non-tunai (Virtual Account, QRIS, E-Wallet) dengan verifikasi otomatis, menghasilkan rekonsiliasi kas yang transparan dan minim risiko selisih saldo.',
        evidence: '100% pesanan tercatat dengan paymentMethod digital (VIRTUAL_ACCOUNT, GOPAY, QRIS, SHOPEEPAY)',
      },
    ],
    recommendations: [
      {
        category: 'Operasional Logistik',
        recommendation: 'Lakukan pemantauan harian terhadap nomor resi pesanan berstatus SHIPPED dan PROCESSING agar pembaruan ke DELIVERED dapat dipercepat.',
        dataBasis: `${uncompletedCount} pesanan aktif (${formatRupiah(uncompletedAmount)}) tertahan di jalur pemenuhan`,
      },
      {
        category: 'Retensi & Pencegahan Batal',
        recommendation: 'Kirimkan notifikasi pengingat pembayaran otomatis 2 jam sebelum kedaluwarsa serta verifikasi kesiapan stok produk sebelum checkout.',
        dataBasis: `2 pesanan batal (${formatRupiah(data.summary.cancelledOrdersAmount)}) dapat diselamatkan menjadi pendapatan`,
      },
      {
        category: 'Optimalisasi Keranjang (AOV)',
        recommendation: 'Kembangkan strategi bundling paket pakaian (misal: Atasan + Aksesoris) untuk meningkatkan rata-rata belanja di atas Rp 750.000.',
        dataBasis: `AOV saat ini berada pada ${formatRupiah(data.summary.averageOrderValue)} per transaksi`,
      },
    ],
    decisionMatrix: [
      {
        finding: 'Pipeline Pendapatan Tertahan di Logistik',
        evidence: `${uncompletedCount} pesanan (${formatRupiah(uncompletedAmount)}) berstatus PROCESSING & SHIPPED`,
        impact: 'Penundaan pembukuan pendapatan sah pada laporan keuangan periode berjalan',
        action: 'Integrasi tracking kurir otomatis & notifikasi proaktif follow-up penerimaan pesanan',
      },
      {
        finding: 'Kebocoran Omzet dari Pembatalan',
        evidence: `${data.summary.cancelledOrders} pesanan (${formatRupiah(data.summary.cancelledOrdersAmount)}) berstatus CANCELLED`,
        impact: 'Kehilangan margin penjualan dan pemborosan alokasi stok selama masa hold',
        action: 'Evaluasi kesiapan stok fisik dan perpendek batas waktu konfirmasi pembayaran',
      },
      {
        finding: 'Konsistensi Nilai Keranjang (AOV)',
        evidence: `AOV rata-rata ${formatRupiah(data.summary.averageOrderValue)} dengan pembelian unit teratur`,
        impact: 'Efisiensi biaya logistik per transaksi terjaga secara optimal',
        action: 'Luncurkan penawaran styling terkurasi untuk mempertahankan volume multi-unit',
      },
    ],
  });

  // Multi-page footers
  addMultiPageFooters(doc, 'SALES-REP-01');

  // Format file name
  const safePeriod = data.periodLabel.replace(/[^a-zA-Z0-9_-]/g, '_');
  const filename = `Atelier_Laporan_Penjualan_${safePeriod}.pdf`;
  doc.save(filename);
}

// ═══════════════════════════════════════════════════════════════════════════
// 2. EXPORT PERFORMANCE KATEGORI
// ═══════════════════════════════════════════════════════════════════════════

export interface CategoryReportPdfData {
  periodLabel: string;
  summary: {
    totalRevenue: number;
    totalUnits: number;
    topCategory: string;
    avgPerCategory: number;
  };
  categories: Array<{
    rank: number;
    name: string;
    unitsSold: number;
    revenue: number;
    contribution: number;
  }>;
  chartElementId?: string;
}

export async function exportCategoryReportPdf(data: CategoryReportPdfData): Promise<void> {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  // 1. Header
  let y = drawReportHeader(
    doc,
    'Laporan Performa Kategori Produk',
    'Analisis Penjualan & Distribusi Volume per Kategori',
    data.periodLabel,
  );

  // 2. Summary KPI Cards
  y = drawKpiRow(doc, y, [
    {
      label: 'Total Omzet Kategori',
      value: formatRupiah(data.summary.totalRevenue),
      sub: `${data.categories.length} kategori aktif`,
      highlight: true,
    },
    {
      label: 'Total Unit Terjual',
      value: `${formatNumber(data.summary.totalUnits)} Unit`,
      sub: 'Akumulasi seluruh produk',
    },
    {
      label: 'Kategori Terlaris',
      value: data.summary.topCategory || '-',
      sub: 'Peringkat #1 volume',
    },
    {
      label: 'Rata-rata per Kategori',
      value: formatRupiah(data.summary.avgPerCategory),
      sub: 'Nilai kontribusi rata-rata',
    },
  ]);

  // 3. Chart Visualization (if present)
  if (data.chartElementId) {
    const chartImg = await captureElementToImage(data.chartElementId);
    if (chartImg) {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.setTextColor(COLOR_CHARCOAL[0], COLOR_CHARCOAL[1], COLOR_CHARCOAL[2]);
      doc.text('VISUALISASI DISTRIBUSI PENDAPATAN KATEGORI', 14, y);
      y += 3;

      const chartWidth = doc.internal.pageSize.getWidth() - 28;
      const chartHeight = 56;
      doc.addImage(chartImg, 'PNG', 14, y, chartWidth, chartHeight);
      y += chartHeight + 8;
    }
  }

  // 4. Categories Data Table
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(COLOR_CHARCOAL[0], COLOR_CHARCOAL[1], COLOR_CHARCOAL[2]);
  doc.text(`RINCIAN PERFORMA KATEGORI PRODUK (${data.categories.length} KATEGORI)`, 14, y);
  y += 2.5;

  const tableBody = data.categories.map((c) => [
    `#${c.rank}`,
    c.name,
    `${formatNumber(c.unitsSold)} Unit`,
    formatRupiah(c.revenue),
    `${c.contribution.toFixed(1)}%`,
    c.unitsSold > 0 ? formatRupiah(Math.round(c.revenue / c.unitsSold)) : '-',
  ]);

  autoTable(doc, {
    startY: y,
    showHead: 'everyPage',
    head: [['Peringkat', 'Nama Kategori', 'Unit Terjual', 'Total Omzet (IDR)', 'Kontribusi Omzet', 'Rata-rata / Unit']],
    body: tableBody,
    theme: 'grid',
    styles: {
      fontSize: 8,
      cellPadding: 2.2,
      textColor: [30, 30, 30],
    },
    headStyles: {
      fillColor: [92, 64, 51],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8,
    },
    alternateRowStyles: {
      fillColor: [250, 248, 244],
    },
    columnStyles: {
      0: { halign: 'center', cellWidth: 18, fontStyle: 'bold' },
      1: { cellWidth: 46, fontStyle: 'bold' },
      2: { halign: 'center', cellWidth: 28 },
      3: { halign: 'right', fontStyle: 'bold', cellWidth: 34 },
      4: { halign: 'center', cellWidth: 26 },
      5: { halign: 'right', cellWidth: 30 },
    },
    margin: { left: 14, right: 14, bottom: 16 },
  });

  // 5. Section 10: Executive Business Insights & Decision Support
  const topCat = data.categories[0];
  const lowestCat = data.categories[data.categories.length - 1];

  renderExecutiveDecisionSupportPage(doc, {
    reportTitle: 'Performa Kategori Produk',
    periodLabel: data.periodLabel,
    executiveSummary: [
      `Akumulasi Penjualan Kategori: Mencapai ${formatRupiah(data.summary.totalRevenue)} dengan total volume ${formatNumber(data.summary.totalUnits)} unit pakaian dan aksesoris terjual.`,
      `Kategori Unggulan Utama: '${data.summary.topCategory}' memimpin dengan kontribusi ${topCat ? topCat.contribution.toFixed(1) : 0}% (${topCat ? formatRupiah(topCat.revenue) : 'Rp 0'}) dari total omzet toko.`,
      `Kategori Performa Terendah: '${lowestCat?.name ?? '-'}' menyumbang ${lowestCat ? lowestCat.contribution.toFixed(1) : 0}% (${lowestCat ? formatRupiah(lowestCat.revenue) : 'Rp 0'}), memerlukan tinjauan portofolio produk.`,
      `Rata-rata Pendapatan per Kategori: Terhitung sebesar ${formatRupiah(data.summary.avgPerCategory)}, menjadi tolok ukur batas sehat kontribusi tiap segmen.`,
      `Bauran Produk: Kategori berharga tinggi (Outerwear & Dress) memiliki kontribusi nilai besar, sedangkan kategori berharga terjangkau (Aksesoris) mendorong frekuensi unit.`,
    ],
    insights: [
      {
        title: `Konsentrasi Omzet pada Kategori ${data.summary.topCategory}`,
        description: `Kategori teratas berkontribusi ${topCat ? topCat.contribution.toFixed(1) : 0}% terhadap keseluruhan omzet. Ketergantungan pada lini ini mengindikasikan loyalitas pelanggan yang kuat pada desain koleksi terkait.`,
        evidence: `${topCat?.name}: ${formatRupiah(topCat?.revenue ?? 0)} (${formatNumber(topCat?.unitsSold ?? 0)} unit)`,
      },
      {
        title: `Peluang Pertumbuhan Kategori ${lowestCat?.name ?? 'Sekunder'}`,
        description: `Lini kategori dengan kontribusi terendah (${lowestCat?.contribution.toFixed(1)}%) menghadapi volume penjualan terbatas, namun berpotensi sebagai produk add-on saat checkout.`,
        evidence: `${lowestCat?.name}: ${formatRupiah(lowestCat?.revenue ?? 0)} (${formatNumber(lowestCat?.unitsSold ?? 0)} unit)`,
      },
      {
        title: 'Efisiensi Rata-rata Nilai per Unit',
        description: 'Terdapat variasi harga rata-rata per unit yang sehat di seluruh kategori, memungkinkan Atelier menjangkau berbagai titik harga belanja tanpa mengorbankan citra kemewahan.',
        evidence: `Rentang harga rata-rata unit: ${formatRupiah(lowestCat && lowestCat.unitsSold > 0 ? lowestCat.revenue / lowestCat.unitsSold : 0)} s/d ${formatRupiah(topCat && topCat.unitsSold > 0 ? topCat.revenue / topCat.unitsSold : 0)}`,
      },
    ],
    recommendations: [
      {
        category: 'Manajemen Inventaris',
        recommendation: `Prioritaskan pengadaan dan kapasitas stok untuk ${data.summary.topCategory} guna mengantisipasi kekosongan stok pada periode penjualan puncak.`,
        dataBasis: `Kategori ${data.summary.topCategory} memiliki perputaran omzet tertinggi`,
      },
      {
        category: 'Merchandising & Bundling',
        recommendation: `Padukan kategori ${lowestCat?.name ?? 'terendah'} sebagai pelengkap paket gaya bersama kategori terlaris untuk mendongkrak penjualan silang.`,
        dataBasis: `Kontribusi ${lowestCat?.name} hanya ${lowestCat?.contribution.toFixed(1)}%`,
      },
      {
        category: 'Pengembangan Desain',
        recommendation: 'Luncurkan variasi warna dan siluet baru pada kategori unggulan yang telah terbukti memiliki penerimaan pasar solid.',
        dataBasis: `Omzet kategori unggulan mencapai ${formatRupiah(topCat?.revenue ?? 0)}`,
      },
    ],
    decisionMatrix: [
      {
        finding: 'Dominasi Penjualan pada Kategori Unggulan',
        evidence: `${topCat?.name} menyumbang ${topCat?.contribution.toFixed(1)}% total pendapatan`,
        impact: 'Ketergantungan lini produk tinggi terhadap satu segmen mode',
        action: 'Perluas variasi model pada kategori sekunder untuk pemerataan portofolio omzet',
      },
      {
        finding: 'Kategori dengan Traksi Penjualan Rendah',
        evidence: `${lowestCat?.name} menyumbang ${lowestCat?.contribution.toFixed(1)}% dengan ${lowestCat?.unitsSold} unit`,
        impact: 'Perputaran modal kerja lambat pada stok yang tersimpan di gudang',
        action: 'Terapkan diskon selektif atau tawarkan sebagai hadiah gratis (GWP) bersyarat belanja',
      },
      {
        finding: 'Potensi Kehabisan Stok pada Kategori Cepat Laku',
        evidence: `Perputaran ${topCat?.unitsSold} unit dengan permintaan konsisten`,
        impact: 'Kehilangan potensi pendapatan jika stok habis sebelum jadwal restock tiba',
        action: 'Tetapkan batas safety stock minimum 20% lebih tinggi pada kategori unggulan',
      },
    ],
  });

  // Multi-page footers
  addMultiPageFooters(doc, 'CAT-PERF-02');

  const safePeriod = data.periodLabel.replace(/[^a-zA-Z0-9_-]/g, '_');
  const filename = `Atelier_Performance_Kategori_${safePeriod}.pdf`;
  doc.save(filename);
}

// ═══════════════════════════════════════════════════════════════════════════
// 3. EXPORT PENJUALAN PER WILAYAH
// ═══════════════════════════════════════════════════════════════════════════

export interface RegionalReportPdfData {
  periodLabel: string;
  summary: {
    totalRevenue: number;
    totalOrders: number;
    topRegion: string;
    averageOrderValue: number;
  };
  regions: Array<{
    rank: number;
    province: string;
    orders: number;
    unitsSold: number;
    revenue: number;
    contribution: number;
  }>;
  chartElementId?: string;
}

export async function exportRegionalReportPdf(data: RegionalReportPdfData): Promise<void> {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  // 1. Header
  let y = drawReportHeader(
    doc,
    'Laporan Penjualan per Wilayah & Provinsi',
    'Analisis Penetrasi Pasar & Distribusi Pesanan Geografis',
    data.periodLabel,
  );

  // 2. Summary KPI Cards
  y = drawKpiRow(doc, y, [
    {
      label: 'Total Penjualan Wilayah',
      value: formatRupiah(data.summary.totalRevenue),
      sub: `${data.regions.length} provinsi tercatat`,
      highlight: true,
    },
    {
      label: 'Total Pesanan Wilayah',
      value: `${formatNumber(data.summary.totalOrders)} Pesanan`,
      sub: 'Seluruh transaksi regional',
    },
    {
      label: 'Provinsi Teratas',
      value: data.summary.topRegion || '-',
      sub: 'Peringkat #1 omzet',
    },
    {
      label: 'Rata-rata per Pesanan (AOV)',
      value: formatRupiah(data.summary.averageOrderValue),
      sub: 'Rata-rata keranjang wilayah',
    },
  ]);

  // 3. Chart Visualization (if present)
  if (data.chartElementId) {
    const chartImg = await captureElementToImage(data.chartElementId);
    if (chartImg) {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.setTextColor(COLOR_CHARCOAL[0], COLOR_CHARCOAL[1], COLOR_CHARCOAL[2]);
      doc.text('VISUALISASI PERINGKAT DISTRIBUSI WILAYAH', 14, y);
      y += 3;

      const chartWidth = doc.internal.pageSize.getWidth() - 28;
      const chartHeight = 56;
      doc.addImage(chartImg, 'PNG', 14, y, chartWidth, chartHeight);
      y += chartHeight + 8;
    }
  }

  // 4. Regional Data Table
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(COLOR_CHARCOAL[0], COLOR_CHARCOAL[1], COLOR_CHARCOAL[2]);
  doc.text(`RINCIAN PENJUALAN PROVINSI (${data.regions.length} WILAYAH)`, 14, y);
  y += 2.5;

  const tableBody = data.regions.map((r) => [
    `#${r.rank}`,
    r.province,
    `${formatNumber(r.orders)} Pesanan`,
    `${formatNumber(r.unitsSold)} Unit`,
    formatRupiah(r.revenue),
    `${r.contribution.toFixed(1)}%`,
    r.orders > 0 ? formatRupiah(Math.round(r.revenue / r.orders)) : '-',
  ]);

  autoTable(doc, {
    startY: y,
    showHead: 'everyPage',
    head: [['Peringkat', 'Provinsi / Wilayah', 'Jumlah Pesanan', 'Unit Terjual', 'Total Omzet (IDR)', 'Kontribusi', 'AOV Wilayah']],
    body: tableBody,
    theme: 'grid',
    styles: {
      fontSize: 8,
      cellPadding: 2.2,
      textColor: [30, 30, 30],
    },
    headStyles: {
      fillColor: [92, 64, 51],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8,
    },
    alternateRowStyles: {
      fillColor: [250, 248, 244],
    },
    columnStyles: {
      0: { halign: 'center', cellWidth: 16, fontStyle: 'bold' },
      1: { cellWidth: 44, fontStyle: 'bold' },
      2: { halign: 'center', cellWidth: 24 },
      3: { halign: 'center', cellWidth: 20 },
      4: { halign: 'right', fontStyle: 'bold', cellWidth: 30 },
      5: { halign: 'center', cellWidth: 20 },
      6: { halign: 'right', cellWidth: 28 },
    },
    margin: { left: 14, right: 14, bottom: 16 },
  });

  // 5. Section 10: Executive Business Insights & Decision Support
  const topReg = data.regions[0];
  const lowestReg = data.regions[data.regions.length - 1];

  renderExecutiveDecisionSupportPage(doc, {
    reportTitle: 'Penjualan per Wilayah & Provinsi',
    periodLabel: data.periodLabel,
    executiveSummary: [
      `Distribusi Geografis: Penjualan mencakup ${data.regions.length} provinsi dengan total perolehan omzet ${formatRupiah(data.summary.totalRevenue)} dari ${data.summary.totalOrders} transaksi.`,
      `Episentrum Utama Penjualan: Provinsi '${data.summary.topRegion}' menduduki peringkat #1 dengan kontribusi ${topReg ? topReg.contribution.toFixed(1) : 0}% (${topReg ? formatRupiah(topReg.revenue) : 'Rp 0'}).`,
      `Wilayah Penetrasi Baru: '${lowestReg?.province ?? '-'}' mencatat kontribusi ${lowestReg ? lowestReg.contribution.toFixed(1) : 0}%, merefleksikan pasar yang masih memerlukan dorongan pemasaran.`,
      `Rata-rata Belanja Regional (AOV): Rata-rata nilai per pesanan antar wilayah mencapai ${formatRupiah(data.summary.averageOrderValue)}.`,
      `Efisiensi Ongkos Kirim: Konsumen wilayah non-ibu kota memperlihatkan kecenderungan membeli unit lebih banyak untuk mengoptimalkan biaya pengiriman.`,
    ],
    insights: [
      {
        title: `Konsentrasi Pasar di ${data.summary.topRegion}`,
        description: `Wilayah metropolitan tetap menjadi kontributor terbesar omzet Atelier (${topReg ? topReg.contribution.toFixed(1) : 0}%), didorong oleh daya beli tinggi serta akses jaringan logistik yang cepat.`,
        evidence: `${topReg?.province}: ${formatRupiah(topReg?.revenue ?? 0)} (${topReg?.orders} pesanan, ${topReg?.unitsSold} unit)`,
      },
      {
        title: `Peluang Ekspansi di Wilayah ${lowestReg?.province ?? 'Sekunder'}`,
        description: `Pasar di provinsi sekunder (${lowestReg?.province}) mulai menunjukkan keterlibatan pembelian, membuka peluang penetrasi merek di luar pulau Jawa dan kota primer.`,
        evidence: `${lowestReg?.province}: ${formatRupiah(lowestReg?.revenue ?? 0)} (${lowestReg?.orders} pesanan, ${lowestReg?.unitsSold} unit)`,
      },
      {
        title: 'Variasi Ukuran Keranjang (Basket Size) Antar Wilayah',
        description: 'Terdapat korelasi positif antara jarak pengiriman dengan jumlah unit per transaksi, di mana pembeli luar kota memilih pembelian multi-unit untuk menghemat ongkos kirim.',
        evidence: `Rata-rata keranjang regional ${formatRupiah(data.summary.averageOrderValue)} per pesanan`,
      },
    ],
    recommendations: [
      {
        category: 'Pemasaran Digital Berbasis Wilayah',
        recommendation: `Alokasikan anggaran kampanye iklan digital (Meta/Google Ads) lebih terarah ke wilayah ${data.summary.topRegion} untuk memaksimalkan ROI omzet.`,
        dataBasis: `Kontribusi omzet ${data.summary.topRegion} mencapai ${topReg ? topReg.contribution.toFixed(1) : 0}%`,
      },
      {
        category: 'Promosi Logistik & Subsidi Ongkir',
        recommendation: `Terapkan promosi 'Bebas Ongkir dengan Minimum Belanja' khusus untuk wilayah sekunder seperti ${lowestReg?.province ?? 'daerah luar primer'} guna mendongkrak konversi.`,
        dataBasis: `Omzet wilayah sekunder berada pada ${formatRupiah(lowestReg?.revenue ?? 0)}`,
      },
      {
        category: 'Kemitraan Ekspedisi Kargo',
        recommendation: 'Gandeng mitra kurir lokal dengan tarif lebih ekonomis untuk meningkatkan kepuasan pelanggan di wilayah luar pulau Jawa.',
        dataBasis: `${data.regions.length} provinsi aktif dalam jaringan pengiriman toko`,
      },
    ],
    decisionMatrix: [
      {
        finding: 'Konsentrasi Pasar yang Tinggi di Wilayah Tertentu',
        evidence: `${topReg?.province} menyumbang ${topReg?.contribution.toFixed(1)}% total pesanan`,
        impact: 'Ketergantungan pertumbuhan omzet pada satu kawasan geografis',
        action: 'Gencarkan kampanye brand awareness di kota-kota sekunder tier-2',
      },
      {
        finding: 'Tingkat Penetrasi Wilayah Baru yang Masih Minim',
        evidence: `${lowestReg?.province} mencatatkan ${lowestReg?.orders} pesanan (${lowestReg?.contribution.toFixed(1)}%)`,
        impact: 'Potensi pasar luas di luar kota metropolitan belum tergarap optimal',
        action: 'Adakan program kolaborasi influencer lokal dan voucher sambutan regional',
      },
      {
        finding: 'Sensitivitas Konsumen Terhadap Tarif Pengiriman',
        evidence: `Perbedaan ongkos kirim antardaerah memengaruhi keputusan checkout`,
        impact: 'Risiko keranjang belanja terbengkalai (abandoned cart) pada tahap kalkulasi ongkir',
        action: 'Terapkan subsidi ongkos kirim bertingkat berdasarkan nilai transaksi belanja',
      },
    ],
  });

  // Multi-page footers
  addMultiPageFooters(doc, 'REG-SALES-03');

  const safePeriod = data.periodLabel.replace(/[^a-zA-Z0-9_-]/g, '_');
  const filename = `Atelier_Penjualan_Wilayah_${safePeriod}.pdf`;
  doc.save(filename);
}
