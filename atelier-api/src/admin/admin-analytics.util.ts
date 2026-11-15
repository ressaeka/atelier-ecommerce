import { BUSINESS_TIMEZONE, BUSINESS_TZ_OFFSET_MS } from './admin.constants.js';
import type {
  AnalyticsGranularity,
  AnalyticsKpiMetric,
  AnalyticsPreset,
  AnalyticsSalesTrendPoint,
} from './admin-analytics.types.js';

export const LOW_STOCK_THRESHOLD = 5;

const MONTH_NAMES_ID = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'Mei',
  'Jun',
  'Jul',
  'Agu',
  'Sep',
  'Okt',
  'Nov',
  'Des',
];

export function formatWibYmd(date: Date): string {
  const shifted = new Date(date.getTime() + BUSINESS_TZ_OFFSET_MS);
  const y = shifted.getUTCFullYear();
  const m = String(shifted.getUTCMonth() + 1).padStart(2, '0');
  const d = String(shifted.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function formatDayMonthLabel(ymd: string): string {
  const parts = ymd.split('-');
  if (parts.length < 3) return ymd;
  const day = parseInt(parts[2], 10);
  const monthIdx = parseInt(parts[1], 10) - 1;
  const monthName = MONTH_NAMES_ID[monthIdx] ?? parts[1];
  return `${day} ${monthName}`;
}

export function formatMonthYearLabel(ym: string): string {
  const parts = ym.split('-');
  if (parts.length < 2) return ym;
  const year = parts[0];
  const monthIdx = parseInt(parts[1], 10) - 1;
  const monthName = MONTH_NAMES_ID[monthIdx] ?? parts[1];
  return `${monthName} ${year}`;
}

export function wibStartOfDayUtc(ymd: string): Date {
  const [y, m, d] = ymd.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d) - BUSINESS_TZ_OFFSET_MS);
}

export function wibEndExclusiveUtc(ymd: string): Date {
  const [y, m, d] = ymd.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d + 1) - BUSINESS_TZ_OFFSET_MS);
}

export function addDaysToYmd(ymd: string, deltaDays: number): string {
  const [y, m, d] = ymd.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d + deltaDays));
  const yy = dt.getUTCFullYear();
  const mm = String(dt.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(dt.getUTCDate()).padStart(2, '0');
  return `${yy}-${mm}-${dd}`;
}

export interface ParsedAnalyticsPeriod {
  preset: AnalyticsPreset;
  granularity: AnalyticsGranularity;
  start: Date;
  end: Date;
  startYmd: string;
  endYmd: string;
  daysCount: number;
  previousStart: Date;
  previousEnd: Date;
  previousStartYmd: string;
  previousEndYmd: string;
  previousDaysCount: number;
  timezone: string;
}

export function parseAnalyticsPeriodWib(
  preset: AnalyticsPreset = '30d',
  customStartDate?: string,
  customEndDate?: string,
  nowReference: Date = new Date(),
): ParsedAnalyticsPeriod {
  const todayYmd = formatWibYmd(nowReference);

  let startYmd: string;
  let endYmd: string;
  let granularity: AnalyticsGranularity;
  let previousStart: Date;
  let previousEnd: Date;
  let previousStartYmd: string;
  let previousEndYmd: string;

  if (preset === 'custom' && customStartDate && customEndDate) {
    startYmd = customStartDate;
    endYmd = customEndDate;
    const start = wibStartOfDayUtc(startYmd);
    const end = wibEndExclusiveUtc(endYmd);
    const durationMs = end.getTime() - start.getTime();
    const daysCount = Math.round(durationMs / (24 * 60 * 60 * 1000));
    granularity = daysCount > 60 ? 'monthly' : 'daily';

    previousEnd = new Date(start.getTime());
    previousStart = new Date(start.getTime() - durationMs);
    previousStartYmd = formatWibYmd(previousStart);
    previousEndYmd = formatWibYmd(new Date(previousEnd.getTime() - 1));

    return {
      preset,
      granularity,
      start,
      end,
      startYmd,
      endYmd,
      daysCount,
      previousStart,
      previousEnd,
      previousStartYmd,
      previousEndYmd,
      previousDaysCount: daysCount,
      timezone: BUSINESS_TIMEZONE,
    };
  }

  if (preset === '1y') {
    endYmd = todayYmd;
    const [ey, em] = endYmd.split('-').map(Number);
    // 12 bulan terakhir: dari tanggal 1 pada 11 bulan yang lalu s/d hari ini
    const startMonthDate = new Date(Date.UTC(ey, em - 1 - 11, 1));
    startYmd = `${startMonthDate.getUTCFullYear()}-${String(
      startMonthDate.getUTCMonth() + 1,
    ).padStart(2, '0')}-01`;
    granularity = 'monthly';

    const start = wibStartOfDayUtc(startYmd);
    const end = wibEndExclusiveUtc(endYmd);
    const daysCount = Math.round(
      (end.getTime() - start.getTime()) / (24 * 60 * 60 * 1000),
    );

    // 12 bulan sebelumnya: tanggal 1 pada bulan yang sama tahun sebelumnya s/d tanggal kalender yang setara dengan hari ini (clamped ke akhir bulan untuk kasus 29 Feb -> 28 Feb)
    const prevStartMonthDate = new Date(
      Date.UTC(
        startMonthDate.getUTCFullYear(),
        startMonthDate.getUTCMonth() - 12,
        1,
      ),
    );
    previousStartYmd = `${prevStartMonthDate.getUTCFullYear()}-${String(
      prevStartMonthDate.getUTCMonth() + 1,
    ).padStart(2, '0')}-01`;

    const [, , ed] = endYmd.split('-').map(Number);
    const prevEndYear = ey - 1;
    const prevEndMonth = em;
    const daysInPrevEndMonth = new Date(
      Date.UTC(prevEndYear, prevEndMonth, 0),
    ).getUTCDate();
    const prevEndDay = Math.min(ed, daysInPrevEndMonth);
    previousEndYmd = `${prevEndYear}-${String(prevEndMonth).padStart(2, '0')}-${String(
      prevEndDay,
    ).padStart(2, '0')}`;

    previousStart = wibStartOfDayUtc(previousStartYmd);
    previousEnd = wibEndExclusiveUtc(previousEndYmd);
    const previousDaysCount = Math.round(
      (previousEnd.getTime() - previousStart.getTime()) / (24 * 60 * 60 * 1000),
    );

    return {
      preset: '1y',
      granularity,
      start,
      end,
      startYmd,
      endYmd,
      daysCount,
      previousStart,
      previousEnd,
      previousStartYmd,
      previousEndYmd,
      previousDaysCount,
      timezone: BUSINESS_TIMEZONE,
    };
  }

  // '7d' atau '30d'
  const effectivePreset: AnalyticsPreset = preset === '7d' ? '7d' : '30d';
  const spanDays = effectivePreset === '7d' ? 7 : 30;
  endYmd = todayYmd;
  startYmd = addDaysToYmd(endYmd, -(spanDays - 1));
  granularity = 'daily';

  const start = wibStartOfDayUtc(startYmd);
  const end = wibEndExclusiveUtc(endYmd);
  const durationMs = end.getTime() - start.getTime();

  previousEnd = new Date(start.getTime());
  previousStart = new Date(start.getTime() - durationMs);
  previousStartYmd = formatWibYmd(previousStart);
  previousEndYmd = formatWibYmd(new Date(previousEnd.getTime() - 1));

  return {
    preset: effectivePreset,
    granularity,
    start,
    end,
    startYmd,
    endYmd,
    daysCount: spanDays,
    previousStart,
    previousEnd,
    previousStartYmd,
    previousEndYmd,
    previousDaysCount: spanDays,
    timezone: BUSINESS_TIMEZONE,
  };
}

export function generateZeroFilledTrendBuckets(
  startYmd: string,
  endYmd: string,
  granularity: AnalyticsGranularity,
): Map<string, AnalyticsSalesTrendPoint> {
  const map = new Map<string, AnalyticsSalesTrendPoint>();

  if (granularity === 'monthly') {
    const [sy, sm] = startYmd.split('-').map(Number);
    const [ey, em] = endYmd.split('-').map(Number);

    let curY = sy;
    let curM = sm;

    while (curY < ey || (curY === ey && curM <= em)) {
      const ymKey = `${curY}-${String(curM).padStart(2, '0')}`;
      map.set(ymKey, {
        date: ymKey,
        label: formatMonthYearLabel(ymKey),
        revenue: 0,
        orders: 0,
      });

      curM++;
      if (curM > 12) {
        curM = 1;
        curY++;
      }
    }
  } else {
    const [sy, sm, sd] = startYmd.split('-').map(Number);
    const [ey, em, ed] = endYmd.split('-').map(Number);

    const startUtc = Date.UTC(sy, sm - 1, sd);
    const endUtc = Date.UTC(ey, em - 1, ed);
    const dayDiff = Math.round((endUtc - startUtc) / (24 * 60 * 60 * 1000));

    for (let i = 0; i <= dayDiff; i++) {
      const cur = new Date(startUtc + i * 24 * 60 * 60 * 1000);
      const y = cur.getUTCFullYear();
      const m = String(cur.getUTCMonth() + 1).padStart(2, '0');
      const d = String(cur.getUTCDate()).padStart(2, '0');
      const ymd = `${y}-${m}-${d}`;
      map.set(ymd, {
        date: ymd,
        label: formatDayMonthLabel(ymd),
        revenue: 0,
        orders: 0,
      });
    }
  }

  return map;
}

export function buildKpiMetric(
  currentValue: number,
  previousValue: number,
): AnalyticsKpiMetric {
  if (previousValue === 0) {
    return {
      currentValue,
      previousValue,
      percentageChange: null,
      trend: 'NEUTRAL',
      comparisonAvailable: false,
    };
  }

  const rawPct = ((currentValue - previousValue) / previousValue) * 100;
  const percentageChange = Math.round(rawPct * 10) / 10;
  const trend =
    percentageChange > 0 ? 'UP' : percentageChange < 0 ? 'DOWN' : 'NEUTRAL';

  return {
    currentValue,
    previousValue,
    percentageChange,
    trend,
    comparisonAvailable: true,
  };
}
