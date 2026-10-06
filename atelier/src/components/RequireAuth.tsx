import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

/**
 * Auth gate for customer-facing account pages (e.g. /profile).
 * UX only — backend remains the security boundary.
 *
 * - loading → loading state
 * - guest → /login (redirect back after)
 * - ADMIN → /admin/profile (admin uses admin portal profile)
 */
export default function RequireAuth() {
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
    return (
      <Navigate
        to="/login"
        replace
        state={{ from: location.pathname }}
      />
    );
  }

  if (user.role === 'ADMIN') {
    return <Navigate to="/admin/profile" replace />;
  }

  return <Outlet />;
}
