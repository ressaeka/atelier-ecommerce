import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import AdminLayout from '../layouts/AdminLayout';

/**
 * Guard akses /admin.
 *
 * - Bukan security boundary (backend tetap otorisasi).
 * - UX only: cegah user non-ADMIN membuka UI admin.
 * - Role diambil dari AuthContext (sistem auth yang sama), bukan hardcoded.
 */
export default function AdminGuard() {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#FAF9F5]">
        <p className="text-[11px] uppercase tracking-[0.22em] text-[#777168]">
          Memuat…
        </p>
      </div>
    );
  }

  if (!user) {
    // Unauthenticated → dedicated admin login, not customer /login
    return (
      <Navigate
        to="/login/admin"
        replace
        state={{ from: location.pathname }}
      />
    );
  }

  if (user.role !== 'ADMIN') {
    // USER rejected from admin UI (backend remains the real boundary)
    return <Navigate to="/" replace />;
  }

  return (
    <AdminLayout>
      <Outlet />
    </AdminLayout>
  );
}
