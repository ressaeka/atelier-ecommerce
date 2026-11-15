import { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ChevronDown, LogOut, UserRound } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

interface AdminAccountMenuProps {
  /**
   * sidebar  → block at bottom, menu opens upward
   * topbar   → compact pill, menu opens downward
   */
  variant?: 'sidebar' | 'topbar';
  className?: string;
  /** Close mobile sidebar after navigation/logout */
  onNavigate?: () => void;
}

/**
 * Shared account menu: avatar + name + email from AuthContext.
 * Items: Profile → /admin/profile · Logout → /login/admin
 */
export default function AdminAccountMenu({
  variant = 'sidebar',
  className = '',
  onNavigate,
}: AdminAccountMenuProps) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  const name = user?.name?.trim() || 'Admin';
  const email = user?.email?.trim() || 'Administrator';
  const initial = name.charAt(0).toUpperCase();
  const isTopbar = variant === 'topbar';

  useEffect(() => {
    if (!open) return;
    const onClickOutside = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, [open]);

  useEffect(() => {
    setOpen(false);
  }, [location.pathname]);

  const handleProfile = () => {
    setOpen(false);
    onNavigate?.();
    navigate('/admin/profile');
  };

  const handleLogout = async () => {
    setOpen(false);
    onNavigate?.();
    await logout();
    navigate('/login/admin', { replace: true });
  };

  const menuPanelClass = isTopbar
    ? 'absolute right-0 z-50 mt-2 w-60 overflow-hidden rounded-xl border border-[#EDEAE3] bg-white p-1.5 shadow-xl'
    : 'absolute bottom-full left-0 right-0 z-50 mb-2 overflow-hidden rounded-xl border border-[#EDEAE3] bg-white p-1.5 shadow-xl';

  const menuItemClass =
    'flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-[13px] font-medium transition-colors';

  if (isTopbar) {
    return (
      <div ref={rootRef} className={`relative ${className}`}>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="flex items-center gap-2.5 rounded-xl px-2 py-1 transition-colors hover:bg-[#FAF8F4]"
          aria-label="Account menu"
          aria-expanded={open}
        >
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#5C4033] text-[12px] font-semibold text-white">
            {initial}
          </div>
          <span className="hidden max-w-[120px] truncate text-[13.5px] font-medium text-[#1A1A1A] sm:block">
            {name}
          </span>
          <ChevronDown
            size={14}
            className={`shrink-0 text-[#6F6A62] transition-transform duration-200 ${
              open ? 'rotate-180' : ''
            }`}
          />
        </button>

        {open && (
          <>
            <button
              type="button"
              className="fixed inset-0 z-40 cursor-default"
              onClick={() => setOpen(false)}
              aria-label="Tutup menu akun"
            />
            <div className={menuPanelClass}>
              <div className="border-b border-[#ECE7DE] px-3 py-2.5">
                <p className="truncate text-[13px] font-semibold text-[#1A1A1A]">
                  {name}
                </p>
                <p className="truncate text-[11.5px] text-[#6F6A62]">{email}</p>
              </div>
              <button
                type="button"
                onClick={handleProfile}
                className={`${menuItemClass} mt-1 text-[#3F3B36] hover:bg-[#F4EFE8] hover:text-[#1A1A1A]`}
              >
                <UserRound size={15} strokeWidth={1.75} className="shrink-0" />
                Profile
              </button>
              <button
                type="button"
                onClick={() => {
                  void handleLogout();
                }}
                className={`${menuItemClass} mt-0.5 text-[#B4382E] hover:bg-[#FBECEA]`}
              >
                <LogOut size={15} strokeWidth={1.75} className="shrink-0" />
                Logout
              </button>
            </div>
          </>
        )}
      </div>
    );
  }

  /* sidebar variant — menu opens upward */
  return (
    <div ref={rootRef} className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-3 rounded-2xl border border-[#ECE7DE] bg-white px-3 py-2.5 text-left transition-colors hover:bg-[#FAF8F4]"
        aria-label="Account menu"
        aria-expanded={open}
      >
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#5C4033] text-[13px] font-semibold text-white">
          {initial}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[13.5px] font-semibold leading-tight text-[#1A1A1A]">
            {name}
          </p>
          <p
            className="mt-0.5 truncate text-[12px] leading-tight text-[#6F6A62]"
            title={email}
          >
            {email}
          </p>
        </div>
        <ChevronDown
          size={14}
          className={`shrink-0 text-[#6F6A62] transition-transform duration-200 ${
            open ? 'rotate-180' : ''
          }`}
        />
      </button>

      {open && (
        <div className={menuPanelClass}>
          <button
            type="button"
            onClick={handleProfile}
            className={`${menuItemClass} text-[#3F3B36] hover:bg-[#F4EFE8] hover:text-[#1A1A1A]`}
          >
            <UserRound size={15} strokeWidth={1.75} className="shrink-0" />
            Profile
          </button>
          <button
            type="button"
            onClick={() => {
              void handleLogout();
            }}
            className={`${menuItemClass} mt-0.5 text-[#B4382E] hover:bg-[#FBECEA]`}
          >
            <LogOut size={15} strokeWidth={1.75} className="shrink-0" />
            Logout
          </button>
        </div>
      )}
    </div>
  );
}
