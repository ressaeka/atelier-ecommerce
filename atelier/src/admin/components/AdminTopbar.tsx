import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, ChevronDown, Menu, Search } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

interface AdminTopbarProps {
  onOpenMobileSidebar: () => void;
}

export default function AdminTopbar({
  onOpenMobileSidebar,
}: AdminTopbarProps) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  const initial = user?.name
    ? user.name.charAt(0).toUpperCase()
    : 'A';

  useEffect(() => {
    if (!profileOpen) return;

    const onClickOutside = (e: MouseEvent) => {
      if (
        profileRef.current &&
        !profileRef.current.contains(e.target as Node)
      ) {
        setProfileOpen(false);
      }
    };

    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, [profileOpen]);

  const handleLogout = async () => {
    setProfileOpen(false);
    // AuthContext clears tokens + user state immediately
    await logout();
    // Admin portal logout → dedicated admin login (never /wishlist)
    navigate('/login/admin', { replace: true });
  };

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

        {/* Search */}
        <div className="relative flex-1 max-w-xl">
          <Search
            size={16}
            className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[#A39E95]"
          />
          <input
            type="search"
            placeholder="Cari produk, pesanan, atau pelanggan..."
            className="h-10 w-full rounded-xl border border-[#EDEAE3] bg-[#FAFAF8] pl-10 pr-4 text-[13px] text-[#1A1A1A] placeholder:text-[#A39E95] transition-colors focus:border-[#B7C9D9] focus:bg-white focus:outline-none"
          />
        </div>

        <div className="ml-auto flex items-center gap-2 sm:gap-3">
          {/* Notification */}
          <button
            type="button"
            className="relative rounded-xl border border-transparent p-2.5 text-[#4A4A4A] transition-colors hover:bg-[#F3F1EC] hover:text-[#1A1A1A]"
            aria-label="Notifikasi"
          >
            <Bell size={18} strokeWidth={1.75} />
            <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-[#C47B6A] ring-2 ring-white" />
          </button>

          {/* Profile dropdown */}
          <div className="relative" ref={profileRef}>
            <button
              type="button"
              onClick={() => setProfileOpen((v) => !v)}
              className="flex items-center gap-2 rounded-xl border border-[#EDEAE3] bg-white py-1.5 pl-1.5 pr-2.5 transition-colors hover:bg-[#FAFAF8]"
              aria-label="Menu profil admin"
              aria-expanded={profileOpen}
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#1A1A1A] text-[12px] font-medium text-white">
                {initial}
              </div>
              <span className="hidden text-[13px] font-medium text-[#1A1A1A] sm:block">
                Admin
              </span>
              <ChevronDown
                size={14}
                className={`text-[#6B6B6B] transition-transform duration-200 ${
                  profileOpen ? 'rotate-180' : ''
                }`}
              />
            </button>

            {profileOpen && (
              <>
                <button
                  type="button"
                  className="fixed inset-0 z-40 cursor-default"
                  onClick={() => setProfileOpen(false)}
                  aria-label="Tutup menu profil"
                />
                <div className="absolute right-0 z-50 mt-2 w-56 rounded-xl border border-[#EDEAE3] bg-white p-2 shadow-xl">
                  <div className="border-b border-[#F0EDE7] px-3 py-2.5">
                    <p className="truncate text-[13px] font-semibold text-[#1A1A1A]">
                      {user?.name ?? 'Admin'}
                    </p>
                    <p className="truncate text-[11px] text-[#8A847B]">
                      {user?.email ?? 'Administrator'}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setProfileOpen(false);
                      navigate('/admin/settings');
                    }}
                    className="mt-1 w-full rounded-lg px-3 py-2 text-left text-[13px] text-[#4A4A4A] transition-colors hover:bg-[#F3F1EC] hover:text-[#1A1A1A]"
                  >
                    Pengaturan
                  </button>
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="mt-1 w-full rounded-lg px-3 py-2 text-left text-[13px] text-[#A05050] transition-colors hover:bg-[#FBF0F0]"
                  >
                    Keluar
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
