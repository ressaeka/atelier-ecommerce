import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Package,
  Tags,
  ShoppingCart,
  Users,
  BarChart3,
  Trophy,
  PieChart,
  MapPin,
  X,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

interface AdminSidebarProps {
  mobileOpen: boolean;
  onCloseMobile: () => void;
}

interface NavChild {
  to: string;
  label: string;
  icon?: LucideIcon;
  end?: boolean;
}

interface NavSection {
  id: string;
  label?: string;
  icon?: LucideIcon;
  to?: string;
  end?: boolean;
  children?: NavChild[];
}

/**
 * Sidebar structure:
 * ATELIER
 * Dashboard
 * CATALOG → Products, Categories
 * SALES → Orders, Customers
 * LAPORAN → Penjualan, Produk Terlaris, Pelanggan
 * Account section (Profile / Logout)
 */
const navSections: NavSection[] = [
  {
    id: 'dashboard',
    to: '/admin',
    label: 'Dashboard',
    icon: LayoutDashboard,
    end: true,
  },
  {
    id: 'catalog',
    label: 'Katalog',
    children: [
      { to: '/admin/products', label: 'Produk', icon: Package },
      { to: '/admin/categories', label: 'Kategori', icon: Tags },
    ],
  },
  {
    id: 'sales',
    label: 'Penjualan',
    children: [
      { to: '/admin/orders', label: 'Pesanan', icon: ShoppingCart },
      { to: '/admin/customers', label: 'Pelanggan', icon: Users },
    ],
  },
  {
    id: 'reports',
    label: 'Laporan',
    children: [
      { to: '/admin/reports', label: 'Laporan Penjualan', icon: BarChart3, end: true },
      { to: '/admin/reports/products', label: 'Produk Terlaris', icon: Trophy },
      { to: '/admin/reports/customers', label: 'Laporan Pelanggan', icon: Users },
      { to: '/admin/reports/categories', label: 'Performa Kategori', icon: PieChart },
      { to: '/admin/reports/regions', label: 'Penjualan per Wilayah', icon: MapPin },
    ],
  },
];

const linkClass = ({ isActive }: { isActive: boolean }) =>
  [
    'relative flex h-[42px] items-center gap-3 whitespace-nowrap rounded-xl px-3.5 text-[14.5px] transition-all duration-150',
    isActive
      ? 'bg-[#F4EFEA] font-semibold text-[#5B3F36] before:absolute before:inset-y-2 before:left-0 before:w-[3px] before:rounded-full before:bg-[#5B3F36]'
      : 'font-medium text-[#3F3B36] hover:bg-[#FAF8F4] hover:text-[#1A1A1A]',
  ].join(' ');

function isSectionActive(section: NavSection, pathname: string): boolean {
  if (section.to) {
    if (section.end) return pathname === section.to;
    return pathname === section.to || pathname.startsWith(`${section.to}/`);
  }
  if (!section.children?.length) return false;
  return section.children.some((child) => {
    if (child.end) return pathname === child.to;
    return pathname === child.to || pathname.startsWith(`${child.to}/`);
  });
}

export default function AdminSidebar({
  mobileOpen,
  onCloseMobile,
}: AdminSidebarProps) {
  const location = useLocation();

  const content = (
    <div className="flex h-full flex-col bg-white">
      {/* Brand */}
      <div className="flex h-16 items-center justify-between px-6">
        <span className="font-editorial text-[20px] font-semibold uppercase tracking-[0.26em] text-[#5C4033]">
          ATELIER
        </span>
        <button
          type="button"
          onClick={onCloseMobile}
          className="rounded-lg p-1.5 text-[#6F6A62] transition-colors hover:bg-[#F4EFE8] hover:text-[#1A1A1A] lg:hidden"
          aria-label="Tutup sidebar"
        >
          <X size={18} />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3.5 py-3">
        <ul className="space-y-5">
          {navSections.map((section) => {
            const sectionActive = isSectionActive(section, location.pathname);

            if (section.to) {
              return (
                <li key={section.id}>
                  <NavLink
                    to={section.to}
                    end={section.end}
                    onClick={onCloseMobile}
                    className={linkClass}
                  >
                    {section.icon && (
                      <section.icon
                        size={18}
                        strokeWidth={1.75}
                        className="shrink-0"
                      />
                    )}
                    <span>{section.label}</span>
                  </NavLink>
                </li>
              );
            }

            return (
              <li key={section.id}>
                <p
                  className={`mb-2 px-3 text-[11.5px] font-medium ${
                    sectionActive ? 'text-[#5B3F36]' : 'text-[#8B7F79]'
                  }`}
                >
                  {section.label}
                </p>
                <ul className="space-y-1">
                  {section.children?.map((child) => (
                    <li key={child.to}>
                      <NavLink
                        to={child.to}
                        end={child.end}
                        onClick={onCloseMobile}
                        className={linkClass}
                      >
                        {child.icon && (
                          <child.icon
                            size={18}
                            strokeWidth={1.75}
                            className="shrink-0"
                          />
                        )}
                        <span className="whitespace-nowrap">{child.label}</span>
                      </NavLink>
                    </li>
                  ))}
                </ul>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );

  return (
    <>
      {/* Desktop */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-[248px] border-r border-[#ECE7DE] lg:block">
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
