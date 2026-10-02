import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

/**
 * Customer-only shopping routes (cart, wishlist, checkout, addresses, orders).
 *
 * Frontend UX only:
 * - USER / guest → normal customer page
 * - ADMIN (browsing storefront) → redirect to "/" so admin cannot use shopping UI
 *
 * Backend remains the real security boundary. Role comes from existing AuthContext.
 */
export default function CustomerOnlyRoute() {
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

  if (user?.role === 'ADMIN') {
    return (
      <Navigate
        to="/"
        replace
        state={{ from: location.pathname }}
      />
    );
  }

  return <Outlet />;
}
