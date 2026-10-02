import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, CheckCircle2, ShieldAlert, ExternalLink } from 'lucide-react';
import AuthLayout from '../components/AuthLayout';
import AuthTabs from '../components/AuthTabs';
import InputField from '../components/InputField';
import PasswordField from '../components/PasswordField';
import AuthButton from '../components/AuthButton';
import SocialLogin from '../components/SocialLogin';
import GuestAccess from '../components/GuestAccess';
import ForgotPasswordModal from '../components/ForgotPasswordModal';
import { useAuth, ApiRequestError } from '../contexts/AuthContext';
import { consumeGuestAuthReturnIntent } from '../lib/guestIntent';
import { API_BASE_URL } from '../lib/api';

/**
 * /login = CUSTOMER PORTAL ONLY.
 *
 * Role comes from the existing auth API response / AuthContext — never hardcoded.
 * ADMIN accounts are rejected here and must use /login/admin.
 */
export const Login: React.FC = () => {
  const navigate = useNavigate();
  const { user, login, logout, loading: authLoading } = useAuth();

  const [formData, setFormData] = useState({
    emailOrPhone: '',
    password: '',
  });

  const [errors, setErrors] = useState<{
    emailOrPhone?: string;
    password?: string;
    general?: string;
  }>({});

  const [loading, setLoading] = useState(false);
  const [successToast, setSuccessToast] = useState(false);
  const [showForgotModal, setShowForgotModal] = useState(false);

  /** Portal rule: ADMIN must not enter the customer app via /login. */
  const isAdminAccount = !authLoading && user?.role === 'ADMIN';

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    if (errors[name as keyof typeof errors]) {
      setErrors((prev) => ({
        ...prev,
        [name]: undefined,
      }));
    }
  };

  const validate = () => {
    const newErrors: typeof errors = {};

    if (!formData.emailOrPhone.trim()) {
      newErrors.emailOrPhone =
        'Email atau Nomor Handphone wajib diisi.';
    }

    if (!formData.password) {
      newErrors.password = 'Kata sandi wajib diisi.';
    } else if (formData.password.length < 8) {
      newErrors.password =
        'Kata sandi minimal 8 karakter.';
    }

    setErrors(newErrors);

    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isAdminAccount) return;
    if (!validate()) return;

    setLoading(true);
    setErrors({});

    try {
      const authenticatedUser = await login({
        identifier: formData.emailOrPhone,
        password: formData.password,
      });

      // Role from backend response — reject ADMIN on customer portal.
      if (authenticatedUser.role === 'ADMIN') {
        await logout();
        setErrors({
          general:
            'Akun administrator harus masuk melalui Portal Administrasi.',
        });
        return;
      }

      setSuccessToast(true);

      // Return-only guest intent — NO automatic wishlist/cart API after login
      const returnIntent = consumeGuestAuthReturnIntent();

      setTimeout(() => {
        if (returnIntent) {
          // Same product page; user clicks wishlist/cart manually
          navigate(returnIntent.returnTo, { replace: true });
          return;
        }

        navigate('/', { replace: true });
      }, 1500);
    } catch (err) {
      if (err instanceof ApiRequestError) {
        setErrors({
          general: err.message,
        });
      } else {
        setErrors({
          general:
            'Terjadi kesalahan jaringan. Silakan coba lagi.',
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (
    tab: 'login' | 'register',
  ) => {
    if (tab === 'register') {
      navigate('/register');
    }
  };

  /* ─── ADMIN blocked on customer portal ─── */
  if (isAdminAccount) {
    return (
      <AuthLayout
        mode="customer"
        title="Login Pelanggan"
        subtitle="Halaman ini khusus akun pelanggan. Akun administrator harus masuk melalui Portal Administrasi."
      >
        <div
          role="alert"
          className="mb-5 border-l-2 border-[#A67C3D] bg-[#FDF6E8] px-4 py-4 text-xs leading-relaxed tracking-wide text-[#7A5A2E]"
        >
          <div className="mb-2 flex items-center gap-2 font-bold uppercase tracking-[0.12em] text-[#8B6F47]">
            <ShieldAlert className="h-4 w-4 shrink-0" />
            Portal Pelanggan
          </div>
          <p>
            Akun administrator harus masuk melalui Portal Administrasi.
          </p>
          <p className="mt-2">
            Anda tidak akan diarahkan ke home, catalog, cart, atau checkout
            pelanggan dari halaman ini.
          </p>
        </div>

        <Link
          to="/login/admin"
          className="flex w-full items-center justify-center gap-2 bg-[#111111] py-3.5 text-xs font-bold uppercase tracking-[0.15em] text-white transition-luxury hover:bg-black"
        >
          <ExternalLink className="h-4 w-4" />
          Masuk ke Portal Admin
        </Link>

        <div className="mt-4 text-center">
          <button
            type="button"
            onClick={() => {
              void logout().finally(() => {
                setErrors({});
                setFormData({ emailOrPhone: '', password: '' });
              });
            }}
            className="text-[10px] font-bold uppercase tracking-[0.14em] text-zinc-600 transition-colors hover:text-black hover:underline"
          >
            Keluar dari akun administrator
          </button>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      mode="customer"
      subtitle="Masukkan kredensial keanggotaan Anda untuk mengakses lemari privat & koleksi tersimpan."
    >
      {/* =====================================================
          AUTH TABS
      ====================================================== */}
      <div className="mb-6">
        <AuthTabs
          activeTab="login"
          onTabChange={handleTabChange}
        />
      </div>

      {/* =====================================================
          SUCCESS MESSAGE
      ====================================================== */}
      {successToast && (
        <div className="mb-5 flex items-center gap-3 border-l-2 border-emerald-700 bg-emerald-50 px-4 py-3.5 text-xs font-semibold tracking-wide text-emerald-900">
          <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-700" />

          <span>
            Akses diberikan. Mengarahkan ke koleksi Atelier...
          </span>
        </div>
      )}

      {/* =====================================================
          GENERAL ERROR
      ====================================================== */}
      {errors.general && (
        <div
          role="alert"
          className="mb-5 border-l-2 border-red-600 bg-red-50 px-4 py-3.5 text-xs font-semibold leading-relaxed tracking-wide text-red-700"
        >
          <div className="flex items-start gap-2">
            <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" />
            <div>
              <span>{errors.general}</span>
              <div className="mt-3">
                <Link
                  to="/login/admin"
                  className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.14em] text-red-800 underline underline-offset-2 hover:text-red-950"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  Masuk ke Portal Administrasi
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================
          LOGIN FORM
      ====================================================== */}
      <form
        onSubmit={handleSubmit}
        className="space-y-4"
      >
        {/* EMAIL / PHONE */}
        <InputField
          label="EMAIL / NO. HANDPHONE"
          name="emailOrPhone"
          placeholder="Email atau No. telepon"
          value={formData.emailOrPhone}
          onChange={handleChange}
          error={errors.emailOrPhone}
          autoComplete="username"
          icon={
            <Mail className="h-4 w-4 text-zinc-400" />
          }
        />

        {/* PASSWORD */}
        <PasswordField
          label="KATA SANDI"
          name="password"
          placeholder="Masukkan sandi"
          value={formData.password}
          onChange={handleChange}
          error={errors.password}
          autoComplete="current-password"
          labelRight={
            <button
              type="button"
              onClick={() => setShowForgotModal(true)}
              className="cursor-pointer text-[10px] font-bold uppercase tracking-[0.14em] text-zinc-600 transition-colors hover:text-black hover:underline"
            >
              LUPA SANDI?
            </button>
          }
        />

        {/* SUBMIT */}
        <div className="pt-2">
          <AuthButton
            type="submit"
            loading={loading}
          >
            MASUK KE AKUN
          </AuthButton>
        </div>
      </form>

      {/* Subtle secondary Admin Portal nav lives in AuthLayout:
          "MASUK KE PORTAL ADMIN TOKO →" → /login/admin */}

      {/* =====================================================
          GOOGLE LOGIN
      ====================================================== */}
      <div className="mt-5">
        <SocialLogin
          onGoogleClick={() => {
            window.location.href =
              `${API_BASE_URL}/auth/google`;
          }}
        />
      </div>

      {/* =====================================================
          GUEST ACCESS
      ====================================================== */}
      <div className="mt-4">
        <GuestAccess />
      </div>

      {/* =====================================================
          FORGOT PASSWORD
      ====================================================== */}
      <ForgotPasswordModal
        isOpen={showForgotModal}
        onClose={() => setShowForgotModal(false)}
      />
    </AuthLayout>
  );
};

export default Login;