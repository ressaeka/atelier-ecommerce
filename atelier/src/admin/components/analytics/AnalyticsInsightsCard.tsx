import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  AlertTriangle,
  ChevronRight,
  Info,
  Lightbulb,
  PackageSearch,
  Star,
  TrendingDown,
  TrendingUp,
} from 'lucide-react';
import type {
  AnalyticsBusinessInsight,
  AnalyticsInsightSeverity,
} from '../../types/analytics';
import { CardHeader } from '../ui/AdminPrimitives';

interface AnalyticsInsightsCardProps {
  insights: AnalyticsBusinessInsight[];
}

const SEVERITY_URGENCY: Record<AnalyticsInsightSeverity, number> = {
  negative: 0,
  warning: 1,
  positive: 2,
  info: 3,
};

function getInsightStyles(severity: AnalyticsInsightSeverity) {
  switch (severity) {
    case 'positive':
      return {
        bg: 'border border-[#CDE6D7] bg-[#E7F3EC]/80 hover:bg-[#E7F3EC]',
        iconBg: 'bg-white text-[#2F7A4F] shadow-[0_1px_2px_rgba(26,22,18,0.05)]',
      };
    case 'negative':
      return {
        bg: 'border border-[#F5D6D2] bg-[#FBECEA]/85 hover:bg-[#FBECEA]',
        iconBg: 'bg-white text-[#B4382E] shadow-[0_1px_2px_rgba(26,22,18,0.05)]',
      };
    case 'warning':
      return {
        bg: 'border border-[#F2DEC0] bg-[#FBF1E1]/85 hover:bg-[#FBF1E1]',
        iconBg: 'bg-white text-[#9A5B14] shadow-[0_1px_2px_rgba(26,22,18,0.05)]',
      };
    case 'info':
    default:
      return {
        bg: 'border border-[#ECE7DE] bg-[#FAF8F4] hover:bg-[#F4EFE8]',
        iconBg: 'bg-white text-[#5C4033] shadow-[0_1px_2px_rgba(26,22,18,0.05)]',
      };
  }
}

function getInsightTargetRoute(insight: AnalyticsBusinessInsight): string {
  switch (insight.type) {
    case 'low_stock':
      return '/admin/products';
    case 'top_category':
      return '/admin/reports/products';
    case 'revenue_trend':
    case 'no_data':
    default:
      return '/admin/reports';
  }
}

function renderInsightIcon(
  insight: AnalyticsBusinessInsight,
  className: string,
) {
  if (insight.type === 'revenue_trend') {
    if (insight.severity === 'negative') {
      return <TrendingDown className={className} aria-hidden="true" />;
    }
    return <TrendingUp className={className} aria-hidden="true" />;
  }
  if (insight.type === 'low_stock') {
    return insight.severity === 'warning' ? (
      <AlertTriangle className={className} aria-hidden="true" />
    ) : (
      <PackageSearch className={className} aria-hidden="true" />
    );
  }
  if (insight.type === 'top_category') {
    return <Star className={className} aria-hidden="true" />;
  }
  return <Info className={className} aria-hidden="true" />;
}

export default function AnalyticsInsightsCard({
  insights,
}: AnalyticsInsightsCardProps) {
  const sortedInsights = useMemo(
    () =>
      [...insights].sort(
        (a, b) =>
          (SEVERITY_URGENCY[a.severity] ?? 99) -
          (SEVERITY_URGENCY[b.severity] ?? 99),
      ),
    [insights],
  );

  return (
    <section
      aria-labelledby="business-insights-title"
      className="flex h-full min-h-[348px] flex-col rounded-2xl border border-[#ECE7DE] bg-white p-6 shadow-[0_1px_3px_rgba(26,22,18,0.04)]"
    >
      <CardHeader
        id="business-insights-title"
        icon={Lightbulb}
        title="Business Insights"
        scope="Prioritas tindakan"
        subtitle="Diurutkan berdasarkan urgensi"
        rightSlot={
          sortedInsights.length > 0 ? (
            <span
              className="flex h-6 min-w-6 items-center justify-center rounded-full bg-[#F4EFE8] px-2 font-sans text-[12px] font-bold tabular-nums text-[#5C4033]"
              aria-label={`${sortedInsights.length} insight bisnis`}
            >
              {sortedInsights.length}
            </span>
          ) : null
        }
      />

      {sortedInsights.length === 0 ? (
        <div className="flex flex-1 items-center justify-center rounded-xl border border-dashed border-[#ECE7DE] bg-[#FAF8F4] p-6 text-center text-[12.5px] text-[#6F6A62]">
          Belum ada insight bisnis untuk periode ini.
        </div>
      ) : (
        <div className="flex flex-1 flex-col justify-between gap-2.5">
          {sortedInsights.map((item) => {
            const style = getInsightStyles(item.severity);
            const targetRoute = getInsightTargetRoute(item);

            return (
              <Link
                key={item.id}
                to={targetRoute}
                className={`group flex items-center gap-3.5 rounded-xl px-4 py-3 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#5C4033]/40 ${style.bg}`}
              >
                <div
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${style.iconBg}`}
                >
                  {renderInsightIcon(item, 'h-4 w-4')}
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="text-[14px] font-semibold leading-snug text-[#1A1A1A]">
                    {item.title}
                  </h3>
                  <p className="mt-0.5 text-[12.5px] leading-relaxed text-[#3F3B36]">
                    {item.description}
                  </p>
                </div>
                <ChevronRight
                  className="h-4 w-4 shrink-0 text-[#6F6A62] transition-transform group-hover:translate-x-0.5"
                  aria-hidden="true"
                />
              </Link>
            );
          })}
        </div>
      )}
    </section>
  );
}
