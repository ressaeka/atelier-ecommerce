import { ArrowRight, BarChart3, Award, Users } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { AdminReportPromo } from '../data/adminDashboardMockData';

interface ReportPromoCardProps {
  promo: AdminReportPromo;
}

const REPORT_SHORTCUTS = [
  {
    label: 'Laporan Penjualan',
    to: '/admin/reports',
    icon: BarChart3,
  },
  {
    label: 'Produk Terlaris',
    to: '/admin/reports/products',
    icon: Award,
  },
  {
    label: 'Laporan Pelanggan',
    to: '/admin/reports/customers',
    icon: Users,
  },
] as const;

export default function ReportPromoCard({ promo }: ReportPromoCardProps) {
  return (
    <section className="rounded-2xl bg-gradient-to-br from-[#5C4033] to-[#3D2920] p-5 text-white shadow-[0_4px_16px_rgba(61,41,32,0.14)]">
      <h2 className="font-editorial text-[18px] font-semibold leading-tight tracking-tight text-white">
        {promo.title}
      </h2>

      <p className="mt-1 text-[12px] leading-relaxed text-white/85">
        {promo.description}
      </p>

      <div className="mt-3 flex flex-wrap gap-1.5">
        {REPORT_SHORTCUTS.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.to}
              to={item.to}
              className="inline-flex min-h-[32px] items-center gap-1.5 rounded-lg border border-white/20 bg-white/10 px-2.5 py-1 text-[11.5px] font-medium text-white transition-colors hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
            >
              <Icon className="h-3.5 w-3.5 text-white/85" aria-hidden="true" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>

      <Link
        to="/admin/reports"
        className="group mt-3.5 inline-flex min-h-[40px] items-center gap-2 rounded-xl bg-white px-4 py-2 text-[13px] font-semibold text-[#5C4033] shadow-sm transition-colors hover:bg-[#FAF8F4] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
      >
        {promo.ctaLabel}
        <ArrowRight
          size={14}
          className="transition-transform group-hover:translate-x-0.5"
          aria-hidden="true"
        />
      </Link>
    </section>
  );
}
