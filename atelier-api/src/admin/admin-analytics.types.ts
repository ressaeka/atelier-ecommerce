export type AnalyticsPreset = '7d' | '30d' | '1y' | 'custom';
export type AnalyticsGranularity = 'daily' | 'monthly';
export type AnalyticsTrendDirection = 'UP' | 'DOWN' | 'NEUTRAL';
export type AnalyticsInsightSeverity =
  'positive' | 'negative' | 'warning' | 'info';

export interface AnalyticsKpiMetric {
  currentValue: number;
  previousValue: number;
  percentageChange: number | null;
  trend: AnalyticsTrendDirection;
  comparisonAvailable: boolean;
}

export interface AnalyticsSalesTrendPoint {
  date: string; // YYYY-MM-DD (daily) or YYYY-MM (monthly)
  label: string;
  revenue: number;
  orders: number;
}

export interface AnalyticsTopProduct {
  rank: number;
  productId: number;
  name: string;
  image: string | null;
  unitsSold: number;
  revenue: number;
  revenueContributionPct: number;
}

export interface AnalyticsCategoryPerformance {
  rank: number;
  categoryId: number | null;
  name: string;
  revenue: number;
  unitsSold: number;
  percentageContribution: number;
}

export interface AnalyticsRegionalSales {
  rank: number;
  province: string;
  orders: number;
  revenue: number;
  unitsSold: number;
  percentageContribution: number;
}

export interface AnalyticsBusinessInsight {
  id: string;
  type: 'revenue_trend' | 'low_stock' | 'top_category' | 'no_data';
  title: string;
  description: string;
  severity: AnalyticsInsightSeverity;
  supportingValue?: number | string | null;
}

export interface AnalyticsOverviewResponse {
  period: {
    preset: AnalyticsPreset;
    startDate: string;
    endDate: string;
    granularity: AnalyticsGranularity;
    daysCount: number;
    timezone: string;
  };
  comparisonPeriod: {
    startDate: string;
    endDate: string;
    daysCount: number;
  };
  kpis: {
    revenue: AnalyticsKpiMetric;
    orders: AnalyticsKpiMetric;
    customers: AnalyticsKpiMetric;
    productsSold: AnalyticsKpiMetric;
  };
  salesTrend: AnalyticsSalesTrendPoint[];
  topProducts: AnalyticsTopProduct[];
  categoryPerformance: AnalyticsCategoryPerformance[];
  regionalSales: AnalyticsRegionalSales[];
  businessInsights: AnalyticsBusinessInsight[];
}
