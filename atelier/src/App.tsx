import { lazy, Suspense } from 'react';
import { BrowserRouter, Navigate, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { CartProvider } from './contexts/CartContext';
import { WishlistProvider } from './contexts/WishlistContext';

import Home from './pages/Home';
import Catalog from './pages/Catalog';
import ProductDetail from './pages/ProductDetail';
import Cart from './pages/Cart';
import Payment from './pages/Payment';
import PaymentSuccess from './pages/PaymentSuccess';
import Wishlist from './pages/Wishlist';
import Orders from './pages/Orders';
import OrderDetail from './pages/OrderDetail';
import Addresses from './pages/Addresses';
import About from './pages/About';

import Login from './pages/Login';
import LoginAdmin from './pages/LoginAdmin';
import Register from './pages/Register';
import AuthCallback from './pages/AuthCallback';

import AdminGuard from './admin/components/AdminGuard';
const AdminDashboard = lazy(() => import('./admin/pages/AdminDashboard'));
const AdminCustomers = lazy(() => import('./admin/pages/AdminCustomers'));
const AdminProducts = lazy(() => import('./admin/pages/AdminProducts'));
const AdminOrders = lazy(() => import('./admin/pages/AdminOrders'));
const AdminCategories = lazy(() => import('./admin/pages/AdminCategories'));
const AdminProfile = lazy(() => import('./admin/pages/AdminProfile'));
const AdminSalesReportPage = lazy(() => import('./admin/pages/AdminSalesReportPage'));
const AdminBestSellingProductsPage = lazy(
  () => import('./admin/pages/AdminBestSellingProductsPage'),
);
const AdminCustomerReportPage = lazy(
  () => import('./admin/pages/AdminCustomerReportPage'),
);
const AdminCategoryReportPage = lazy(
  () => import('./admin/pages/AdminCategoryReportPage'),
);
const AdminRegionalSalesReportPage = lazy(
  () => import('./admin/pages/AdminRegionalSalesReportPage'),
);
import CustomerOnlyRoute from './components/CustomerOnlyRoute';
import RequireAuth from './components/RequireAuth';
import UserProfile from './pages/UserProfile';

export function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <CartProvider>
          <WishlistProvider>
            <Routes>
              {/* Main Pages */}
              <Route path="/" element={<Home />} />
              <Route path="/catalog" element={<Catalog />} />
              <Route path="/product/:id" element={<ProductDetail />} />

              {/* Customer-only shopping routes — ADMIN browsing storefront is redirected to "/" */}
              <Route element={<CustomerOnlyRoute />}>
                <Route path="/cart" element={<Cart />} />
                <Route path="/payment" element={<Payment />} />
                {/* Midtrans Snap return URL → cek status dari backend
                    /payment/success/:orderId  (callback.finish path)
                    /payment/success?order_id=ATELIER-11-2 (dashboard finish + query) */}
                <Route path="/payment/success" element={<PaymentSuccess />} />
                <Route path="/payment/success/:orderId" element={<PaymentSuccess />} />
                <Route path="/wishlist" element={<Wishlist />} />
                <Route path="/orders" element={<Orders />} />
                <Route path="/orders/:id" element={<OrderDetail />} />
                <Route path="/addresses" element={<Addresses />} />
              </Route>

              <Route path="/about" element={<About />} />

              {/* User Profile — same pattern as /admin/profile, own account only */}
              <Route element={<RequireAuth />}>
                <Route path="/profile" element={<UserProfile />} />
              </Route>

              {/* Auth Pages */}
              <Route path="/login" element={<Login />} />
              {/* Dedicated Admin Portal login → role check → /admin */}
              <Route path="/login/admin" element={<LoginAdmin />} />
              <Route path="/register" element={<Register />} />
              <Route path="/auth/callback" element={<AuthCallback />} />

              {/* Admin Management (frontend gate only; backend remains security boundary) */}
              <Route path="/admin" element={<AdminGuard />}>
                <Route
                  index
                  element={
                    <Suspense
                      fallback={
                        <div className="flex min-h-[40vh] items-center justify-center">
                          <p className="text-[11px] uppercase tracking-[0.22em] text-[#8A847B]">
                            Memuat halaman admin…
                          </p>
                        </div>
                      }
                    >
                      <AdminDashboard />
                    </Suspense>
                  }
                />
                <Route path="analytics" element={<Navigate to="/admin" replace />} />

                {/* CATALOG */}
                <Route
                  path="products"
                  element={
                    <Suspense fallback={<div className="min-h-[40vh]" />}>
                      <AdminProducts />
                    </Suspense>
                  }
                />
                <Route
                  path="categories"
                  element={
                    <Suspense fallback={<div className="min-h-[40vh]" />}>
                      <AdminCategories />
                    </Suspense>
                  }
                />

                {/* SALES */}
                <Route
                  path="orders"
                  element={
                    <Suspense fallback={<div className="min-h-[40vh]" />}>
                      <AdminOrders />
                    </Suspense>
                  }
                />
                <Route
                  path="customers"
                  element={
                    <Suspense fallback={<div className="min-h-[40vh]" />}>
                      <AdminCustomers />
                    </Suspense>
                  }
                />

                {/* Account — profile admin yang sedang login (bukan Admin Management) */}
                <Route
                  path="profile"
                  element={
                    <Suspense fallback={<div className="min-h-[40vh]" />}>
                      <AdminProfile />
                    </Suspense>
                  }
                />

                {/* LAPORAN — Penjualan aktif */}
                <Route
                  path="reports"
                  element={
                    <Suspense fallback={<div className="min-h-[40vh]" />}>
                      <AdminSalesReportPage />
                    </Suspense>
                  }
                />
                <Route
                  path="reports/products"
                  element={
                    <Suspense fallback={<div className="min-h-[40vh]" />}>
                      <AdminBestSellingProductsPage />
                    </Suspense>
                  }
                />
                <Route
                  path="reports/customers"
                  element={
                    <Suspense fallback={<div className="min-h-[40vh]" />}>
                      <AdminCustomerReportPage />
                    </Suspense>
                  }
                />
                <Route
                  path="reports/categories"
                  element={
                    <Suspense fallback={<div className="min-h-[40vh]" />}>
                      <AdminCategoryReportPage />
                    </Suspense>
                  }
                />
                <Route
                  path="reports/regions"
                  element={
                    <Suspense fallback={<div className="min-h-[40vh]" />}>
                      <AdminRegionalSalesReportPage />
                    </Suspense>
                  }
                />
              </Route>

              {/* Fallback */}
              <Route path="*" element={<Home />} />
              </Routes>
            </WishlistProvider>
          </CartProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
