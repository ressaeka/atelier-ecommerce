import { Link } from 'react-router-dom';
import { FileSpreadsheet } from 'lucide-react';
import type { AdminReportPromo } from '../data/adminDashboardMockData';

interface ReportPromoCardProps {
  promo: AdminReportPromo;
}

export default function ReportPromoCard({ promo }: ReportPromoCardProps) {
  return (
    <section className="flex h-auto flex-col rounded-2xl border border-[#D9E3EC] bg-gradient-to-br from-[#F4F8FB] via-white to-[#FAFAF8] p-5 shadow-[0_1px_2px_rgba(26,26,26,0.03)] sm:p-6">
      <div>
        <div className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-[#E8F1F8] text-[#4A7BA8]">
          <FileSpreadsheet size={20} strokeWidth={1.75} />
        </div>

        <h2 className="font-editorial text-[17px] font-medium tracking-tight text-[#1A1A1A]">
          {promo.title}
        </h2>

        <p className="mt-2.5 text-[12.5px] leading-relaxed text-[#6B6B6B]">
          {promo.description}
        </p>
      </div>

      <Link
        to="/admin/reports"
        className="mt-5 block w-full rounded-xl bg-[#1A1A1A] px-4 py-2.5 text-center text-[11px] font-semibold uppercase tracking-[0.12em] text-white transition-colors hover:bg-[#333]"
      >
        {promo.ctaLabel}
      </Link>
    </section>
  );
}
