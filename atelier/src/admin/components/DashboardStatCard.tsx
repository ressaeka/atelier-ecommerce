import type { AdminKpiCard } from '../data/adminDashboardMockData';

interface DashboardStatCardProps {
  card: AdminKpiCard;
}

export default function DashboardStatCard({ card }: DashboardStatCardProps) {
  const trendColor =
    card.comparisonTrend === 'up'
      ? 'text-[#3D8B5C]'
      : card.comparisonTrend === 'down'
        ? 'text-[#A05050]'
        : 'text-[#8A847B]';

  return (
    <article className="rounded-2xl border border-[#E8E4DC] bg-white p-5 shadow-[0_1px_2px_rgba(26,26,26,0.03)] transition-shadow hover:shadow-[0_8px_24px_rgba(26,26,26,0.04)] sm:p-6">
      <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-[#8A847B]">
        {card.label}
      </p>

      <p className="mt-3 font-editorial text-[28px] leading-none tracking-tight text-[#1A1A1A] sm:text-[32px]">
        {card.value}
      </p>

      <p className={`mt-3 text-[12px] font-medium ${trendColor}`}>
        {card.comparison}
      </p>
    </article>
  );
}
