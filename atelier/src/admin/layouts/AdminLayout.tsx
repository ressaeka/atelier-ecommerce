import React, { useCallback, useEffect, useState } from 'react';
import AdminSidebar from '../components/AdminSidebar';
import AdminTopbar from '../components/AdminTopbar';

interface AdminLayoutProps {
  children: React.ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  const closeMobile = useCallback(() => setMobileOpen(false), []);

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileOpen]);

  useEffect(() => {
    if (!mobileOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeMobile();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [mobileOpen, closeMobile]);

  return (
    <div className="min-h-screen bg-[#FAF8F5] font-sans text-[#2A201D] antialiased">
      <AdminSidebar mobileOpen={mobileOpen} onCloseMobile={closeMobile} />

      <div className="flex min-h-screen flex-col lg:pl-[248px]">
        <AdminTopbar onOpenMobileSidebar={() => setMobileOpen(true)} />

        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-10 lg:py-8">
          <div className="mx-auto w-full max-w-[1640px]">{children}</div>
        </main>
      </div>
    </div>
  );
}
