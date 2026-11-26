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
  isLoading?: boolean;
}

export const SEVERITY_URGENCY: Record<AnalyticsInsightSeverity, number> = {
  negative: 0,
  warning: 1,
  positive: 2,
  info: 3,
};

const SEVERITY_ORDER: AnalyticsInsightSeverity[] = [
  'negative',
  'warning',
  'positive',
  'info',
];

interface SeverityConfig {
  label: string;
  badgeBg: string;
  badgeText: string;
  badgeBorder: string;
  cardBorder: string;
  cardHoverBorder: string;
  cardBg: string;
  cardHoverBg: string;
  iconBg: string;
  iconText: string;
  chipBg: string;
  chipText: string;
  chipBorder: string;
  chipDot: string;
}

const SEVERITY_CONFIG: Record<AnalyticsInsightSeverity, SeverityConfig> = {
  negative: {
    label: 'Urgent',
    badgeBg: 'bg-[#FDF2F0]',
    badgeText: 'text-[#9C2A20]',
    badgeBorder: 'border-[#F5C2BC]',
    cardBorder: 'border-[#F5D6D2]',
    cardHoverBorder: 'hover:border-[#E8A59E]',
    cardBg: 'bg-[#FFFBFB]',
    cardHoverBg: 'hover:bg-[#FDF2F0]/60',
    iconBg: 'bg-[#FBECEA]',
    iconText: 'text-[#B4382E]',
    chipBg: 'bg-[#FDF2F0]',
    chipText: 'text-[#9C2A20]',
    chipBorder: 'border-[#F5C2BC]',
    chipDot: 'bg-[#B4382E]',
  },
  warning: {
    label: 'Perlu Perhatian',
    badgeBg: 'bg-[#FEF7EC]',
    badgeText: 'text-[#8A5012]',
    badgeBorder: 'border-[#F3D7A6]',
    cardBorder: 'border-[#F2DEC0]',
    cardHoverBorder: 'hover:border-[#E4C38E]',
    cardBg: 'bg-[#FFFCF7]',
    cardHoverBg: 'hover:bg-[#FEF7EC]/60',
    iconBg: 'bg-[#FBF1E1]',
    iconText: 'text-[#9A5B14]',
    chipBg: 'bg-[#FEF7EC]',
    chipText: 'text-[#8A5012]',
    chipBorder: 'border-[#F3D7A6]',
    chipDot: 'bg-[#9A5B14]',
  },
  positive: {
    label: 'Positif',
    badgeBg: 'bg-[#F0F8F3]',
    badgeText: 'text-[#1E5937]',
    badgeBorder: 'border-[#BFDFCD]',
    cardBorder: 'border-[#CDE6D7]',
    cardHoverBorder: 'hover:border-[#A4CEB5]',
    cardBg: 'bg-[#FCFDFC]',
    cardHoverBg: 'hover:bg-[#F0F8F3]/60',
    iconBg: 'bg-[#E7F3EC]',
    iconText: 'text-[#2F7A4F]',
    chipBg: 'bg-[#F0F8F3]',
    chipText: 'text-[#1E5937]',
    chipBorder: 'border-[#BFDFCD]',
    chipDot: 'bg-[#2F7A4F]',
  },
  info: {
    label: 'Informasi',
    badgeBg: 'bg-[#F7F4EE]',
    badgeText: 'text-[#5C4033]',
    badgeBorder: 'border-[#E2DDD3]',
    cardBorder: 'border-[#ECE7DE]',
    cardHoverBorder: 'hover:border-[#D5CEBF]',
    cardBg: 'bg-[#FFFFFF]',
    cardHoverBg: 'hover:bg-[#FAF8F4]',
    iconBg: 'bg-[#F4EFE8]',
    iconText: 'text-[#5C4033]',
    chipBg: 'bg-[#F7F4EE]',
    chipText: 'text-[#5C4033]',
    chipBorder: 'border-[#E2DDD3]',
    chipDot: 'bg-[#5C4033]',
  },
};

export function getInsightTargetRoute(
  insight: AnalyticsBusinessInsight,
): string {
  switch (insight.type) {
    case 'low_stock':
      return '/admin/products';
    case 'top_category':
      return '/admin/reports/categories';
    case 'revenue_trend':
    case 'no_data':
    default:
      return '/admin/reports';
  }
}

export function renderInsightIcon(
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
  isLoading = false,
}: AnalyticsInsightsCardProps) {
  // Stable sort by SEVERITY_URGENCY (highest urgency at top; preserving original order on tie)
  const sortedInsights = useMemo(() => {
    return [...insights]
      .map((item, index) => ({ item, index }))
      .sort((a, b) => {
        const diff =
          (SEVERITY_URGENCY[a.item.severity] ?? 99) -
          (SEVERITY_URGENCY[b.item.severity] ?? 99);
        return diff !== 0 ? diff : a.index - b.index;
      })
      .map(({ item }) => item);
  }, [insights]);

  // Aggregate count per severity for quick decision-support chips
  const severityCounts = useMemo(() => {
    const counts: Record<AnalyticsInsightSeverity, number> = {
      negative: 0,
      warning: 0,
      positive: 0,
      info: 0,
    };
    for (const item of insights) {
      if (counts[item.severity] !== undefined) {
        counts[item.severity]++;
      }
    }
    return counts;
  }, [insights]);

  const hasInsights = sortedInsights.length > 0;

  return (
    <section
      aria-labelledby="business-insights-title"
      className="flex h-full min-h-[348px] flex-col rounded-2xl border border-[#ECE7DE] bg-white p-5 sm:p-6 shadow-[0_1px_3px_rgba(26,22,18,0.04)]"
    >
      {/* ─── Header ────────────────────────────────────────────── */}
      <CardHeader
        id="business-insights-title"
        icon={Lightbulb}
        title="Business Insights"
        scope="Prioritas tindakan"
        subtitle="Diurutkan berdasarkan urgensi"
        rightSlot={
          hasInsights ? (
            <span
              className="flex h-6 min-w-6 items-center justify-center rounded-full bg-[#F4EFE8] px-2.5 font-sans text-[11.5px] font-semibold tabular-nums text-[#5C4033]"
              aria-label={`${sortedInsights.length} total insight`}
            >
              {sortedInsights.length}
            </span>
          ) : null
        }
        className="mb-3.5"
      />

      {/* ─── Severity Summary Chips (Only > 0) ──────────────────── */}
      {hasInsights && !isLoading && (
        <div
          className="mb-3.5 flex flex-wrap items-center gap-1.5"
          aria-label="Ringkasan urgensi insight"
        >
          {SEVERITY_ORDER.map((sev) => {
            const count = severityCounts[sev];
            if (count <= 0) return null;
            const cfg = SEVERITY_CONFIG[sev];
            return (
              <span
                key={sev}
                className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[11px] font-medium leading-none ${cfg.chipBg} ${cfg.chipText} ${cfg.chipBorder}`}
              >
                <span
                  className={`h-1.5 w-1.5 rounded-full ${cfg.chipDot}`}
                  aria-hidden="true"
                />
                <span>
                  {count} {cfg.label}
                </span>
              </span>
            );
          })}
        </div>
      )}

      {/* ─── Content States ────────────────────────────────────── */}
      {isLoading ? (
        /* Loading Skeleton */
        <div
          className="flex flex-1 flex-col gap-2.5"
          role="status"
          aria-label="Memuat insight bisnis"
        >
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="flex min-h-[56px] animate-pulse items-center gap-3 rounded-xl border border-[#ECE7DE] bg-[#FAF8F4]/80 p-3 sm:p-3.5"
            >
              <div className="h-9 w-9 shrink-0 rounded-full bg-[#E8E4DC]" />
              <div className="min-w-0 flex-1 space-y-2">
                <div className="h-3.5 w-1/3 rounded bg-[#E8E4DC]" />
                <div className="h-3 w-4/5 rounded bg-[#E8E4DC]" />
              </div>
              <div className="h-5 w-14 rounded-md bg-[#E8E4DC]" />
            </div>
          ))}
          <span className="sr-only">Sedang memuat data insight...</span>
        </div>
      ) : !hasInsights ? (
        /* Empty State */
        <div className="flex flex-1 flex-col items-center justify-center rounded-xl border border-dashed border-[#ECE7DE] bg-[#FAF8F4] p-6 text-center">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#F4EFE8] text-[#8C827A]">
            <Lightbulb
              className="h-5 w-5 text-[#8C827A]"
              strokeWidth={1.5}
              aria-hidden="true"
            />
          </div>
          <p className="mt-3 text-[13.5px] font-medium text-[#1A1A1A]">
            Belum ada insight bisnis
          </p>
          <p className="mt-1 max-w-[280px] text-[12px] leading-relaxed text-[#6F6A62]">
            Seluruh metrik dan indikator berada dalam ambang batas normal untuk
            periode ini.
          </p>
        </div>
      ) : (
        /* Insight List with Internal Scroll */
        <div className="flex min-h-0 flex-1 flex-col">
          <div className="min-h-0 flex-1 overflow-y-auto pr-0.5">
            <ul role="list" className="flex flex-col gap-2.5">
              {sortedInsights.map((item) => {
                const config = SEVERITY_CONFIG[item.severity] ?? SEVERITY_CONFIG.info;
                const targetRoute = getInsightTargetRoute(item);

                return (
                  <li key={item.id}>
                    <Link
                      to={targetRoute}
                      aria-label={`Prioritas ${config.label}: ${item.title}. ${item.description}`}
                      className={`group flex min-h-[56px] items-center gap-3 sm:gap-3.5 rounded-xl border p-3 sm:p-3.5 transition-all duration-150 motion-reduce:transition-none focus:outline-none focus-visible:ring-2 focus-visible:ring-[#5C4033] focus-visible:ring-offset-2 ${config.cardBorder} ${config.cardHoverBorder} ${config.cardBg} ${config.cardHoverBg}`}
                    >
                      {/* Left: Icon */}
                      <div
                        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${config.iconBg} ${config.iconText} shadow-[0_1px_2px_rgba(26,22,18,0.04)]`}
                        aria-hidden="true"
                      >
                        {renderInsightIcon(item, 'h-4 w-4')}
                      </div>

                      {/* Center: Title & Description */}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="truncate text-[13.5px] font-semibold leading-snug text-[#1A1A1A]">
                            {item.title}
                          </h3>
                          {item.supportingValue !== undefined &&
                            item.supportingValue !== null &&
                            item.supportingValue !== '' && (
                              <span
                                className="inline-flex shrink-0 items-center rounded bg-[#F4EFE8] px-1.5 py-0.5 text-[10.5px] font-medium tabular-nums text-[#5C4033]"
                                title={`Nilai pendukung: ${item.supportingValue}`}
                              >
                                {item.supportingValue}
                              </span>
                            )}
                        </div>
                        <p className="mt-0.5 line-clamp-2 text-[12px] leading-relaxed text-[#555048]">
                          {item.description}
                        </p>
                      </div>

                      {/* Right: Severity Badge & Chevron */}
                      <div className="flex shrink-0 items-center gap-2">
                        <span
                          className={`inline-flex items-center rounded-md border px-2 py-0.5 text-[10.5px] font-medium leading-none ${config.badgeBg} ${config.badgeText} ${config.badgeBorder}`}
                        >
                          {config.label}
                        </span>
                        <ChevronRight
                          className="h-4 w-4 text-[#8C827A] transition-transform duration-150 motion-reduce:transform-none motion-safe:group-hover:translate-x-0.5 group-hover:text-[#1A1A1A]"
                          aria-hidden="true"
                        />
                      </div>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>

          {sortedInsights.length > 5 && (
            <div className="mt-2.5 border-t border-[#ECE7DE]/70 pt-2 text-center text-[11px] text-[#8C827A]">
              Menampilkan {sortedInsights.length} insight · Gulir untuk melihat semua
            </div>
          )}
        </div>
      )}
    </section>
  );
}
