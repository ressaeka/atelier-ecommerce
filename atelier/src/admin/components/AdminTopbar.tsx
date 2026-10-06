import { Menu, Search } from 'lucide-react';
import AdminAccountMenu from './AdminAccountMenu';

interface AdminTopbarProps {
  onOpenMobileSidebar: () => void;
}

/**
 * Admin topbar: mobile hamburger + page-aligned search + account menu.
 * Account data (name/email/avatar) comes from AuthContext via AdminAccountMenu.
 */
export default function AdminTopbar({
  onOpenMobileSidebar,
}: AdminTopbarProps) {
  return (
    <header className="sticky top-0 z-30 border-b border-[#EDEAE3] bg-white/90 backdrop-blur-md">
      <div className="flex h-[68px] items-center gap-3 px-4 sm:px-6 lg:px-8">
        <button
          type="button"
          onClick={onOpenMobileSidebar}
          className="rounded-lg border border-[#EDEAE3] p-2 text-[#1A1A1A] transition-colors hover:bg-[#F3F1EC] lg:hidden"
          aria-label="Buka menu sidebar"
        >
          <Menu size={18} />
        </button>

        {/* Search — visual only for now; per-page search lives in each admin page */}
        <div className="relative hidden min-w-0 flex-1 sm:block lg:max-w-md">
          <Search
            size={16}
            className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[#A39E95]"
          />
          <input
            type="search"
            placeholder="Search products, orders, customers..."
            className="h-10 w-full rounded-xl border border-[#EDEAE3] bg-[#FAFAF8] pl-10 pr-4 text-[13px] text-[#1A1A1A] placeholder:text-[#A39E95] transition-colors focus:border-[#B7C9D9] focus:bg-white focus:outline-none"
            aria-label="Search admin"
          />
        </div>

        <div className="ml-auto flex items-center gap-2 sm:gap-3">
          {/* Account: avatar + real name + Profile/Logout */}
          <AdminAccountMenu variant="topbar" />
        </div>
      </div>
    </header>
  );
}
