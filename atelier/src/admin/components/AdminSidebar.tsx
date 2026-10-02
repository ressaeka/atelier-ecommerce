import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Users,
  BarChart3,
  Settings,
  Store,
  ChevronDown,
  X,
} from 'lucide-react';

interface AdminSidebarProps {
  mobileOpen: boolean;
  onCloseMobile: () => void;
}

const navItems = [
  { to: '/admin', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/admin/products', label: 'Produk', icon: Package, end: false },
  { to: '/admin/orders', label: 'Pesanan', icon: ShoppingCart, end: false },
  { to: '/admin/customers', label: 'Pelanggan', icon: Users, end: false },
];

const reportSubItems = [
  { to: '/admin/reports', label: 'Penjualan' },
  { to: '/admin/reports/products', label: 'Produk Terlaris' },
  { to: '/admin/reports/customers', label: 'Pelanggan' },
  { to: '/admin/reports/expenses', label: 'Pengeluaran' },
];

export default function AdminSidebar({
  mobileOpen,
  onCloseMobile,
}: AdminSidebarProps) {
  const [reportsOpen, setReportsOpen] = useState(false);

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    [
      'group flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-[13px] font-medium transition-all duration-200',
      isActive
        ? 'bg-[#EEF4F9] text-[#2F5D86]'
        : 'text-[#4A4A4A] hover:bg-[#F3F1EC] hover:text-[#1A1A1A]',
    ].join(' ');

  const content = (
    <div className="flex h-full flex-col bg-white">
      {/* Brand */}
      <div className="border-b border-[#EDEAE3] px-6 pb-6 pt-7">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-editorial text-[19px] font-semibold uppercase tracking-[0.22em] text-[#1A1A1A]">
                ATELIER
              </span>
              <span className="mt-1 inline-block h-1.5 w-1.5 rounded-full bg-[#A33A2B]" />
            </div>
            <p className="mt-1.5 font-editorial text-[11px] italic text-[#8A847B]">
              Fashion for Your Story
            </p>
          </div>
          <button
            type="button"
            onClick={onCloseMobile}
            className="rounded-lg p-1.5 text-[#6B6B6B] transition-colors hover:bg-[#F3F1EC] hover:text-[#1A1A1A] lg:hidden"
            aria-label="Tutup sidebar"
          >
            <X size={18} />
          </button>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-4 py-6">
        <p className="mb-3 px-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-[#B0AAA0]">
          Menu
        </p>

        <ul className="space-y-1">
          {navItems.map((item) => (
            <li key={item.to}>
              <NavLink
                to={item.to}
                end={item.end}
                onClick={onCloseMobile}
                className={linkClass}
              >
                <item.icon size={17} strokeWidth={1.75} className="shrink-0" />
                <span>{item.label}</span>
              </NavLink>
            </li>
          ))}

          {/* Laporan submenu */}
          <li>
            <button
              type="button"
              onClick={() => setReportsOpen((v) => !v)}
              className={[
                'flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-[13px] font-medium transition-all duration-200',
                reportsOpen
                  ? 'bg-[#EEF4F9] text-[#2F5D86]'
                  : 'text-[#4A4A4A] hover:bg-[#F3F1EC] hover:text-[#1A1A1A]',
              ].join(' ')}
              aria-expanded={reportsOpen}
            >
              <BarChart3 size={17} strokeWidth={1.75} className="shrink-0" />
              <span className="flex-1 text-left">Laporan</span>
              <ChevronDown
                size={15}
                className={`shrink-0 transition-transform duration-200 ${
                  reportsOpen ? 'rotate-180' : ''
                }`}
              />
            </button>

            {reportsOpen && (
              <ul className="mt-1 space-y-0.5 pl-11 pr-2">
                {reportSubItems.map((sub) => (
                  <li key={sub.to}>
                    <NavLink
                      to={sub.to}
                      onClick={onCloseMobile}
                      className={({ isActive }) =>
                        [
                          'block rounded-lg px-3 py-2 text-[12.5px] transition-colors duration-200',
                          isActive
                            ? 'bg-[#F5F8FB] font-medium text-[#2F5D86]'
                            : 'text-[#6B6B6B] hover:bg-[#F3F1EC] hover:text-[#1A1A1A]',
                        ].join(' ')
                      }
                    >
                      {sub.label}
                    </NavLink>
                  </li>
                ))}
              </ul>
            )}
          </li>

          <li className="pt-1">
            <NavLink
              to="/admin/settings"
              onClick={onCloseMobile}
              className={linkClass}
            >
              <Settings size={17} strokeWidth={1.75} className="shrink-0" />
              <span>Pengaturan</span>
            </NavLink>
          </li>
        </ul>

        <div className="mx-2 my-4 h-px bg-[#EDEAE3]" />

        <NavLink
          to="/"
          onClick={onCloseMobile}
          className={linkClass}
          title="Lihat toko pelanggan"
        >
          <Store size={17} strokeWidth={1.75} className="shrink-0" />
          <span>Lihat Toko</span>
        </NavLink>
      </nav>

      {/* Profile */}
      <div className="border-t border-[#EDEAE3] px-5 py-5">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#1A1A1A] text-[13px] font-medium text-white">
            A
          </div>
          <div className="min-w-0">
            <p className="truncate text-[13px] font-semibold text-[#1A1A1A]">
              Admin
            </p>
            <p className="truncate text-[11px] text-[#8A847B]">
              Administrator
            </p>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-[260px] border-r border-[#EDEAE3] shadow-[1px_0_0_0_rgba(0,0,0,0.02)] lg:block">
        {content}
      </aside>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-black/35 backdrop-blur-[2px]"
            onClick={onCloseMobile}
            aria-label="Tutup sidebar"
          />
          <div className="absolute inset-y-0 left-0 w-[270px] shadow-2xl">
            {content}
          </div>
        </div>
      )}
    </>
  );
}
