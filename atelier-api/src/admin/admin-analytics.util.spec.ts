import {
  buildKpiMetric,
  formatDayMonthLabel,
  formatMonthYearLabel,
  formatWibYmd,
  generateZeroFilledTrendBuckets,
  parseAnalyticsPeriodWib,
} from './admin-analytics.util.js';

describe('admin-analytics.util', () => {
  describe('formatWibYmd & WIB midnight boundary', () => {
    it('formats UTC timestamps around WIB midnight accurately', () => {
      // 2026-11-12 23:59:59.999 WIB
      expect(formatWibYmd(new Date('2026-11-12T16:59:59.999Z'))).toBe(
        '2026-11-12',
      );
      // 2026-11-13 00:00:00.000 WIB
      expect(formatWibYmd(new Date('2026-11-12T17:00:00.000Z'))).toBe(
        '2026-11-13',
      );
    });
  });

  describe('parseAnalyticsPeriodWib', () => {
    const ref = new Date('2026-11-13T04:45:00.000Z'); // 2026-11-13 11:45 WIB

    it('computes 7d preset and 7-day comparison period', () => {
      const p = parseAnalyticsPeriodWib('7d', undefined, undefined, ref);
      expect(p.startYmd).toBe('2026-11-07');
      expect(p.endYmd).toBe('2026-11-13');
      expect(p.daysCount).toBe(7);
      expect(p.granularity).toBe('daily');
      expect(p.previousStartYmd).toBe('2026-10-31');
      expect(p.previousEndYmd).toBe('2026-11-06');
      expect(p.previousDaysCount).toBe(7);
    });

    it('computes 30d preset across month boundary', () => {
      const p = parseAnalyticsPeriodWib('30d', undefined, undefined, ref);
      expect(p.startYmd).toBe('2026-10-15');
      expect(p.endYmd).toBe('2026-11-13');
      expect(p.daysCount).toBe(30);
      expect(p.granularity).toBe('daily');
      expect(p.previousStartYmd).toBe('2026-09-15');
      expect(p.previousEndYmd).toBe('2026-10-14');
    });

    it('computes 1y preset as symmetric calendar-aligned periods across year boundary', () => {
      const p = parseAnalyticsPeriodWib('1y', undefined, undefined, ref);
      expect(p.startYmd).toBe('2025-12-01');
      expect(p.endYmd).toBe('2026-11-13');
      expect(p.daysCount).toBe(348);
      expect(p.granularity).toBe('monthly');
      expect(p.previousStartYmd).toBe('2024-12-01');
      expect(p.previousEndYmd).toBe('2025-11-13');
      expect(p.previousDaysCount).toBe(348);
    });

    it('computes 1y preset accurately on year boundary (Jan 15)', () => {
      const janRef = new Date('2026-01-15T05:00:00.000Z'); // 2026-01-15 12:00 WIB
      const p = parseAnalyticsPeriodWib('1y', undefined, undefined, janRef);
      expect(p.startYmd).toBe('2025-02-01');
      expect(p.endYmd).toBe('2026-01-15');
      expect(p.previousStartYmd).toBe('2024-02-01');
      expect(p.previousEndYmd).toBe('2025-01-15');
      expect(p.daysCount).toBe(349);
      expect(p.previousDaysCount).toBe(350); // 2024 includes Feb 29
    });

    it('computes 1y preset accurately in leap-year February (Feb 15, 2024)', () => {
      const leapFebRef = new Date('2024-02-15T05:00:00.000Z');
      const p = parseAnalyticsPeriodWib('1y', undefined, undefined, leapFebRef);
      expect(p.startYmd).toBe('2023-03-01');
      expect(p.endYmd).toBe('2024-02-15');
      expect(p.previousStartYmd).toBe('2022-03-01');
      expect(p.previousEndYmd).toBe('2023-02-15');
      expect(p.daysCount).toBe(352);
      expect(p.previousDaysCount).toBe(352);
    });

    it('clamps Feb 29 to Feb 28 in previous non-leap year for 1y preset', () => {
      const leapDayRef = new Date('2024-02-29T05:00:00.000Z');
      const p = parseAnalyticsPeriodWib('1y', undefined, undefined, leapDayRef);
      expect(p.startYmd).toBe('2023-03-01');
      expect(p.endYmd).toBe('2024-02-29');
      expect(p.previousStartYmd).toBe('2022-03-01');
      expect(p.previousEndYmd).toBe('2023-02-28');
      expect(p.daysCount).toBe(366);
      expect(p.previousDaysCount).toBe(365);
    });

    it('computes 1y preset accurately on last day of month (Oct 31)', () => {
      const monthEndRef = new Date('2026-10-31T10:00:00.000Z');
      const p = parseAnalyticsPeriodWib(
        '1y',
        undefined,
        undefined,
        monthEndRef,
      );
      expect(p.startYmd).toBe('2025-11-01');
      expect(p.endYmd).toBe('2026-10-31');
      expect(p.previousStartYmd).toBe('2024-11-01');
      expect(p.previousEndYmd).toBe('2025-10-31');
      expect(p.daysCount).toBe(365);
      expect(p.previousDaysCount).toBe(365);
    });

    it('uses daily granularity for custom <= 60 days and monthly for custom > 60 days', () => {
      const shortCustom = parseAnalyticsPeriodWib(
        'custom',
        '2026-10-01',
        '2026-10-10',
        ref,
      );
      expect(shortCustom.granularity).toBe('daily');
      expect(shortCustom.daysCount).toBe(10);
      expect(shortCustom.previousStartYmd).toBe('2026-09-21');
      expect(shortCustom.previousEndYmd).toBe('2026-09-30');

      const longCustom = parseAnalyticsPeriodWib(
        'custom',
        '2026-01-01',
        '2026-03-31',
        ref,
      );
      expect(longCustom.granularity).toBe('monthly');
      expect(longCustom.daysCount).toBe(90);
    });
  });

  describe('generateZeroFilledTrendBuckets', () => {
    it('zero-fills daily buckets across month and year boundaries', () => {
      const buckets = generateZeroFilledTrendBuckets(
        '2025-12-30',
        '2026-01-02',
        'daily',
      );
      expect(Array.from(buckets.keys())).toEqual([
        '2025-12-30',
        '2025-12-31',
        '2026-01-01',
        '2026-01-02',
      ]);
      expect(buckets.get('2026-01-01')?.label).toBe('1 Jan');
    });

    it('zero-fills 12 monthly buckets across year boundary', () => {
      const buckets = generateZeroFilledTrendBuckets(
        '2025-12-01',
        '2026-11-13',
        'monthly',
      );
      expect(buckets.size).toBe(12);
      expect(Array.from(buckets.keys())[0]).toBe('2025-12');
      expect(Array.from(buckets.keys())[11]).toBe('2026-11');
      expect(formatMonthYearLabel('2025-12')).toBe('Des 2025');
      expect(formatDayMonthLabel('2026-11-13')).toBe('13 Nov');
    });
  });

  describe('buildKpiMetric', () => {
    it('handles previousValue = 0 without NaN or Infinity', () => {
      expect(buildKpiMetric(500000, 0)).toEqual({
        currentValue: 500000,
        previousValue: 0,
        percentageChange: null,
        trend: 'NEUTRAL',
        comparisonAvailable: false,
      });
    });

    it('computes UP, DOWN, and NEUTRAL trends accurately', () => {
      expect(buildKpiMetric(150, 100)).toEqual({
        currentValue: 150,
        previousValue: 100,
        percentageChange: 50,
        trend: 'UP',
        comparisonAvailable: true,
      });
      expect(buildKpiMetric(75, 100)).toEqual({
        currentValue: 75,
        previousValue: 100,
        percentageChange: -25,
        trend: 'DOWN',
        comparisonAvailable: true,
      });
      expect(buildKpiMetric(100, 100)).toEqual({
        currentValue: 100,
        previousValue: 100,
        percentageChange: 0,
        trend: 'NEUTRAL',
        comparisonAvailable: true,
      });
    });
  });
});
