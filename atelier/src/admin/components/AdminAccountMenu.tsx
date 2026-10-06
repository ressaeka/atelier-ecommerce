import { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ChevronDown, ChevronUp, LogOut, UserRound } from 'lucide-react';
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
          className="flex items-center gap-2 rounded-xl border border-[#EDEAE3] bg-white py-1.5 pl-1.5 pr-2.5 transition-colors hover:bg-[#FAFAF8]"
          aria-label="Account menu"
          aria-expanded={open}
        >
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#1A1A1A] text-[12px] font-medium text-white">
            {initial}
          </div>
          <span className="hidden max-w-[120px] truncate text-[13px] font-medium text-[#1A1A1A] sm:block">
            {name}
          </span>
          <ChevronDown
            size={14}
            className={`shrink-0 text-[#6B6B6B] transition-transform duration-200 ${
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
              <div className="border-b border-[#F0EDE7] px-3 py-2.5">
                <p className="truncate text-[13px] font-semibold text-[#1A1A1A]">
                  {name}
                </p>
                <p className="truncate text-[11px] text-[#8A847B]">{email}</p>
              </div>
              <button
                type="button"
                onClick={handleProfile}
                className={`${menuItemClass} mt-1 text-[#4A4A4A] hover:bg-[#F3F1EC] hover:text-[#1A1A1A]`}
              >
                <UserRound size={15} strokeWidth={1.75} className="shrink-0" />
                Profile
              </button>
              <button
                type="button"
                onClick={() => {
                  void handleLogout();
                }}
                className={`${menuItemClass} mt-0.5 text-[#A05050] hover:bg-[#FBF0F0]`}
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
        className="flex w-full items-center gap-3 rounded-xl px-2 py-2 text-left transition-colors hover:bg-[#F3F1EC]"
        aria-label="Account menu"
        aria-expanded={open}
      >
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#1A1A1A] text-[13px] font-medium text-white">
          {initial}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[13px] font-semibold text-[#1A1A1A]">
            {name}
          </p>
          <p className="truncate text-[11px] text-[#8A847B]">{email}</p>
        </div>
        <ChevronUp
          size={14}
          className={`shrink-0 text-[#8A847B] transition-transform duration-200 ${
            open ? 'rotate-180' : ''
          }`}
        />
      </button>

      {open && (
        <div className={menuPanelClass}>
          <button
            type="button"
            onClick={handleProfile}
            className={`${menuItemClass} text-[#4A4A4A] hover:bg-[#F3F1EC] hover:text-[#1A1A1A]`}
          >
            <UserRound size={15} strokeWidth={1.75} className="shrink-0" />
            Profile
          </button>
          <button
            type="button"
            onClick={() => {
              void handleLogout();
            }}
            className={`${menuItemClass} mt-0.5 text-[#A05050] hover:bg-[#FBF0F0]`}
          >
            <LogOut size={15} strokeWidth={1.75} className="shrink-0" />
            Logout
          </button>
        </div>
      )}
    </div>
  );
}
