import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

/**
 * Storefront account dropdown.
 * Profile → /profile (USER) or /admin/profile (ADMIN).
 * Logout → existing AuthContext.logout.
 */
export default function ProfileDropdown() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const initial = user?.name ? user.name.charAt(0).toUpperCase() : 'U';

  /** Role separation via existing AuthContext user.role. */
  const isAdminAccount = user?.role === 'ADMIN';
  const profilePath = isAdminAccount ? '/admin/profile' : '/profile';

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true);
      setIsDropdownOpen(false);

      const wasAdmin = user?.role === 'ADMIN';

      await logout();

      setIsLogoutModalOpen(false);

      if (wasAdmin) {
        navigate('/login/admin', { replace: true });
      } else {
        navigate('/', { replace: true });
      }
    } catch {
      setIsLogoutModalOpen(false);
      if (user?.role === 'ADMIN') {
        navigate('/login/admin', { replace: true });
      } else {
        navigate('/', { replace: true });
      }
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <div className="relative inline-block text-left">
      {/* PROFILE TRIGGER */}
      {user ? (
        <button
          type="button"
          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          className="flex items-center gap-1.5 focus:outline-none cursor-pointer py-1"
          aria-label="Menu profil pengguna"
        >
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-zinc-900 text-white flex items-center justify-center text-sm font-medium">
            {initial}
          </div>

          <svg
            className="w-3.5 h-3.5 text-gray-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </button>
      ) : (
        <button
          type="button"
          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          className="flex items-center justify-center w-10 h-10 text-[#1A1A1A] hover:text-[#6B6B6B] transition-colors duration-200 cursor-pointer"
          aria-label="Akun saya"
          title="Masuk / Daftar"
        >
          <div className="w-8 h-8 rounded-full border border-gray-400/80 text-gray-700 flex items-center justify-center text-xs font-semibold">
            <svg
              className="w-4 h-4 text-gray-700"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="1.5"
                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-5 7h14a7 7 0 00-7-7z"
              />
            </svg>
          </div>
        </button>
      )}

      {/* DROPDOWN */}
      {isDropdownOpen && (
        <>
          <div
            className="fixed inset-0 z-30"
            onClick={() => setIsDropdownOpen(false)}
          />

          {user ? (
            <div className="absolute right-0 mt-2 w-72 bg-white border border-gray-200 shadow-xl z-40 p-5 text-left animate-fadeIn">
              <div className="flex items-center gap-1.5 text-[11px] font-bold tracking-widest text-amber-800 uppercase mb-1">
                <span>✦</span>
                {isAdminAccount ? 'PORTAL ADMINISTRASI' : 'MEMBER ATELIER'}
              </div>

              <p
                className="text-xl text-gray-900 font-normal leading-snug"
                style={{ fontFamily: "'Libre Bodoni', Georgia, serif" }}
              >
                {isAdminAccount ? 'Admin' : user.name}
              </p>

              <p className="text-sm text-gray-500 mb-4">
                {user.email}
              </p>

              <hr className="border-gray-100 -mx-5 my-2" />

              <div className="pt-1 space-y-0.5">
                {/* Profile → own account page */}
                <Link
                  to={profilePath}
                  onClick={() => setIsDropdownOpen(false)}
                  className="w-full flex items-center gap-3 py-2 px-2 text-sm text-gray-800 hover:bg-gray-50 transition-colors text-left"
                >
                  <svg
                    className="w-4 h-4 text-gray-600 shrink-0"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="1.5"
                      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-5 7h14a7 7 0 00-7-7z"
                    />
                  </svg>

                  Profile
                </Link>

                {isAdminAccount && (
                  <Link
                    to="/admin"
                    onClick={() => setIsDropdownOpen(false)}
                    className="w-full flex items-center gap-3 py-2 px-2 text-sm text-gray-800 hover:bg-gray-50 transition-colors text-left"
                  >
                    <svg
                      className="w-4 h-4 text-gray-600 shrink-0"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="1.5"
                        d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"
                      />
                    </svg>

                    Dashboard Admin
                  </Link>
                )}

                {!isAdminAccount && (
                  <Link
                    to="/addresses"
                    onClick={() => setIsDropdownOpen(false)}
                    className="w-full flex items-center gap-3 py-2 px-2 text-sm text-gray-800 hover:bg-gray-50 transition-colors text-left"
                  >
                    <svg
                      className="w-4 h-4 text-gray-600 shrink-0"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="1.5"
                        d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="1.5"
                        d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                    </svg>

                    Alamat Pengiriman
                  </Link>
                )}

                <button
                  type="button"
                  onClick={() => {
                    setIsDropdownOpen(false);
                    setIsLogoutModalOpen(true);
                  }}
                  className="w-full flex items-center gap-3 py-2 px-2 text-sm text-red-600 hover:bg-red-50/70 transition-colors text-left cursor-pointer"
                >
                  <svg
                    className="w-4 h-4 text-red-600 shrink-0"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="1.5"
                      d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3v1"
                    />
                  </svg>

                  Keluar
                </button>
              </div>
            </div>
          ) : (
            <div className="absolute right-0 mt-2 w-72 bg-white border border-gray-200 shadow-xl z-40 p-5 text-left animate-fadeIn">
              <div className="flex items-center gap-1.5 text-[11px] font-bold tracking-widest text-amber-800 uppercase mb-1">
                <span>✦</span>
                ATELIER JAKARTA
              </div>

              <p
                className="text-lg text-gray-900 font-normal mb-1"
                style={{ fontFamily: "'Libre Bodoni', Georgia, serif" }}
              >
                Selamat datang di ATELIER
              </p>

              <p className="text-xs text-gray-500 mb-4 leading-relaxed">
                Masuk untuk mengakses koleksi tersimpan atau buat keanggotaan baru.
              </p>

              <div className="flex flex-col gap-2 pt-1">
                <Link
                  to="/login"
                  onClick={() => setIsDropdownOpen(false)}
                  className="w-full bg-[#1A1A1A] text-white text-[11px] tracking-[0.14em] uppercase font-medium py-2.5 text-center hover:bg-[#333] transition-colors"
                >
                  MASUK (LOGIN)
                </Link>

                <Link
                  to="/register"
                  onClick={() => setIsDropdownOpen(false)}
                  className="w-full border border-[#CECBC3] text-[#1A1A1A] text-[11px] tracking-[0.14em] uppercase font-medium py-2.5 text-center hover:border-[#1A1A1A] transition-colors"
                >
                  DAFTAR (REGISTER)
                </Link>
              </div>
            </div>
          )}
        </>
      )}

      {/* LOGOUT CONFIRMATION MODAL */}
      {isLogoutModalOpen && user && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-[2px] animate-fadeIn">
          <div className="bg-[#FAF9F5] w-full max-w-md p-7 sm:p-8 relative shadow-2xl border border-gray-200/60 text-left">
            <button
              type="button"
              onClick={() => setIsLogoutModalOpen(false)}
              disabled={isLoggingOut}
              className="absolute top-5 right-5 text-gray-500 hover:text-black transition-colors disabled:opacity-50"
              aria-label="Tutup konfirmasi logout"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="1.5"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>

            <div className="mb-6 pr-8">
              <span className="text-[10px] font-bold tracking-[0.2em] text-red-700 uppercase block mb-2">
                KONFIRMASI KELUAR
              </span>

              <h3
                className="text-2xl text-gray-900 leading-tight mb-2"
                style={{ fontFamily: "'Libre Bodoni', Georgia, serif" }}
              >
                Yakin ingin keluar?
              </h3>

              <p className="text-sm text-gray-600 leading-relaxed">
                {isAdminAccount
                  ? 'Sesi portal administrasi akan diakhiri. Anda perlu login kembali melalui Portal Administrasi.'
                  : 'Sesi akun Anda akan diakhiri. Anda perlu masuk kembali untuk mengakses fitur anggota ATELIER.'}
              </p>
            </div>

            <div className="flex items-center gap-3 p-4 bg-[#EFECE6] border border-gray-200/70 mb-6">
              <div className="w-10 h-10 rounded-full bg-zinc-900 text-white flex items-center justify-center text-sm font-medium shrink-0">
                {initial}
              </div>

              <div className="min-w-0">
                <p className="text-sm font-semibold text-gray-900 truncate">
                  {user.name}
                </p>

                <p className="text-xs text-gray-500 truncate">
                  {user.email}
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsLogoutModalOpen(false)}
                disabled={isLoggingOut}
                className="px-6 py-3 text-xs font-bold tracking-widest text-gray-600 hover:text-black uppercase transition-colors disabled:opacity-50"
              >
                BATAL
              </button>

              <button
                type="button"
                disabled={isLoggingOut}
                onClick={handleLogout}
                className="bg-zinc-900 hover:bg-black text-white px-7 py-3 text-xs font-bold tracking-widest uppercase transition-colors disabled:opacity-60 flex items-center gap-2"
              >
                {isLoggingOut ? (
                  <>
                    <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    KELUAR...
                  </>
                ) : (
                  'LOG OUT'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
