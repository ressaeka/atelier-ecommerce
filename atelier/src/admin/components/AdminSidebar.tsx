import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Package,
  Tags,
  ShoppingCart,
  Users,
  BarChart3,
  Trophy,
  X,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import AdminAccountMenu from './AdminAccountMenu';

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
    label: 'KATALOG',
    children: [
      { to: '/admin/products', label: 'Produk', icon: Package },
      { to: '/admin/categories', label: 'Kategori', icon: Tags },
    ],
  },
  {
    id: 'sales',
    label: 'PENJUALAN',
    children: [
      { to: '/admin/orders', label: 'Pesanan', icon: ShoppingCart },
      { to: '/admin/customers', label: 'Pelanggan', icon: Users },
    ],
  },
  {
    id: 'reports',
    label: 'LAPORAN',
    children: [
      { to: '/admin/reports', label: 'Penjualan', icon: BarChart3, end: true },
      { to: '/admin/reports/products', label: 'Produk Terlaris', icon: Trophy },
      { to: '/admin/reports/customers', label: 'Pelanggan', icon: Users },
    ],
  },
];

const linkClass = ({ isActive }: { isActive: boolean }) =>
  [
    'group flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-[13px] font-medium transition-all duration-200',
    isActive
      ? 'bg-[#EEF4F9] text-[#2F5D86]'
      : 'text-[#4A4A4A] hover:bg-[#F3F1EC] hover:text-[#1A1A1A]',
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
                        size={17}
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
                  className={`mb-2 px-2 text-[10px] font-semibold uppercase tracking-[0.18em] ${
                    sectionActive ? 'text-[#2F5D86]' : 'text-[#B0AAA0]'
                  }`}
                >
                  {section.label}
                </p>
                <ul className="space-y-0.5">
                  {section.children?.map((child) => (
                    <li key={child.to}>
                      <NavLink
                        to={child.to}
                        end={child.end}
                        onClick={onCloseMobile}
                        className={({ isActive }) =>
                          [
                            'flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-[13px] font-medium transition-all duration-200',
                            isActive
                              ? 'bg-[#EEF4F9] text-[#2F5D86]'
                              : 'text-[#4A4A4A] hover:bg-[#F3F1EC] hover:text-[#1A1A1A]',
                          ].join(' ')
                        }
                      >
                        {child.icon && (
                          <child.icon
                            size={16}
                            strokeWidth={1.75}
                            className="shrink-0"
                          />
                        )}
                        <span>{child.label}</span>
                      </NavLink>
                    </li>
                  ))}
                </ul>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Account section — Profile / Logout */}
      <div className="border-t border-[#EDEAE3] px-3 py-3">
        <AdminAccountMenu variant="sidebar" onNavigate={onCloseMobile} />
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
