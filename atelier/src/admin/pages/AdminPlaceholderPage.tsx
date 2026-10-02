import { Link } from 'react-router-dom';
import { ArrowLeft, Construction } from 'lucide-react';

interface AdminPlaceholderPageProps {
  title: string;
  description?: string;
}

export default function AdminPlaceholderPage({
  title,
  description,
}: AdminPlaceholderPageProps) {
  return (
    <div className="flex min-h-[55vh] flex-col items-center justify-center rounded-2xl border border-dashed border-[#D9D4CB] bg-white/60 px-6 py-16 text-center">
      <div className="mb-5 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-[#EEF4F9] text-[#4A7BA8]">
        <Construction size={24} strokeWidth={1.6} />
      </div>

      <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#8A847B]">
        Admin
      </p>
      <h1 className="mt-2 font-editorial text-[28px] font-medium tracking-tight text-[#1A1A1A]">
        {title}
      </h1>
      <p className="mt-3 max-w-md text-[13px] leading-relaxed text-[#6B6B6B]">
        {description ??
          'Halaman ini disiapkan untuk modul admin berikutnya. Dashboard sudah aktif di sini.'}
      </p>

      <Link
        to="/admin"
        className="mt-8 inline-flex items-center gap-2 rounded-xl border border-[#1A1A1A] px-5 py-2.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#1A1A1A] transition-colors hover:bg-[#1A1A1A] hover:text-white"
      >
        <ArrowLeft size={14} />
        Kembali ke Dashboard
      </Link>
    </div>
  );
}
