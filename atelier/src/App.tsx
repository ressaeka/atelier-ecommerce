import { BrowserRouter, Routes, Route } from 'react-router-dom';
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
import AdminDashboard from './admin/pages/AdminDashboard';
import AdminCustomers from './admin/pages/AdminCustomers';
import AdminProducts from './admin/pages/AdminProducts';
import AdminOrders from './admin/pages/AdminOrders';
import AdminCategories from './admin/pages/AdminCategories';
import AdminProfile from './admin/pages/AdminProfile';
import AdminPlaceholderPage from './admin/pages/AdminPlaceholderPage';
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
                <Route index element={<AdminDashboard />} />

                {/* CATALOG */}
                <Route path="products" element={<AdminProducts />} />
                <Route path="categories" element={<AdminCategories />} />

                {/* SALES */}
                <Route path="orders" element={<AdminOrders />} />
                <Route path="customers" element={<AdminCustomers />} />

                {/* Account — profile admin yang sedang login (bukan Admin Management) */}
                <Route path="profile" element={<AdminProfile />} />

                {/* LAPORAN — menu + placeholder only; logic berikutnya */}
                <Route
                  path="reports"
                  element={
                    <AdminPlaceholderPage
                      title="Penjualan"
                      description="Sales reporting will be available soon."
                    />
                  }
                />
                <Route
                  path="reports/products"
                  element={
                    <AdminPlaceholderPage
                      title="Produk Terlaris"
                      description="Best-selling product reports will be available soon."
                    />
                  }
                />
                <Route
                  path="reports/customers"
                  element={
                    <AdminPlaceholderPage
                      title="Pelanggan"
                      description="Customer reports will be available soon."
                    />
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
