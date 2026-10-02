import { useEffect, useState } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Mail, ShieldCheck } from 'lucide-react';
import AuthLayout from '../components/AuthLayout';
import InputField from '../components/InputField';
import PasswordField from '../components/PasswordField';
import AuthButton from '../components/AuthButton';
import { useAuth, ApiRequestError } from '../contexts/AuthContext';

/**
 * /login/admin — Admin Portal.
 *
 * Uses POST /auth/admin-login (not /auth/login).
 * Backend authenticates AND authorizes (ADMIN only).
 * Invalid credentials and non-admin accounts share the same generic error.
 *
 * Frontend role checks are UX only — backend is the security boundary.
 */
export const LoginAdmin = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, adminLogin, loading: authLoading } = useAuth();

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<{
    identifier?: string;
    password?: string;
    general?: string;
  }>({});
  const [loading, setLoading] = useState(false);
  const [successToast, setSuccessToast] = useState(false);

  const GENERIC_ADMIN_LOGIN_ERROR =
    'Akun atau kata sandi administrator tidak valid.';

  const requestedFrom =
    (location.state as { from?: string } | null)?.from ?? '/admin';

  const from =
    requestedFrom === '/admin' || requestedFrom.startsWith('/admin/')
      ? requestedFrom
      : '/admin';

  /**
   * Already authenticated ADMIN → /admin.
   * USER stays on this page (never /admin). No redirect loop.
   */
  useEffect(() => {
    if (authLoading || !user) return;

    if (user.role === 'ADMIN') {
      navigate(from, { replace: true });
    }
  }, [authLoading, user, from, navigate]);

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    if (name === 'identifier') setIdentifier(value);
    if (name === 'password') setPassword(value);

    if (errors[name as keyof typeof errors]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const validate = () => {
    const next: typeof errors = {};

    if (!identifier.trim()) {
      next.identifier = 'Email atau username wajib diisi.';
    }

    if (!password) {
      next.password = 'Kata sandi wajib diisi.';
    }

    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    setErrors({});

    try {
      // Backend: auth + ADMIN authorization in one endpoint
      await adminLogin({
        identifier: identifier.trim(),
        password,
      });

      setSuccessToast(true);
      window.setTimeout(() => {
        navigate(from, { replace: true });
      }, 900);
    } catch (err) {
      /**
       * Generic admin portal failure.
       * Do NOT distinguish wrong password vs non-admin account.
       * Do NOT show role/authorization technical copy.
       */
      if (err instanceof ApiRequestError && err.statusCode === 429) {
        setErrors({ general: err.message });
      } else {
        setErrors({ general: GENERIC_ADMIN_LOGIN_ERROR });
      }
    } finally {
      setLoading(false);
    }
  };

  // Loading / already ADMIN redirecting
  if (authLoading || user?.role === 'ADMIN') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#FAF9F5]">
        <p className="text-[11px] uppercase tracking-[0.22em] text-[#777168]">
          Memuat portal…
        </p>
      </div>
    );
  }

  return (
    <AuthLayout
      mode="admin"
      title="Portal Administrasi"
      eyebrow="ATELIER · PORTAL ADMINISTRASI"
      subtitle="Kelola toko Atelier dengan mudah."
    >
      <div className="mb-5 flex items-start gap-3 border border-[#D9E3EC] bg-[#F4F8FB] px-4 py-3 text-[11px] leading-relaxed text-[#2F5D86]">
        <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" />
        <span>
          Portal ini khusus untuk administrator Atelier. Silakan masuk
          menggunakan akun administrator yang memiliki akses ke pengelolaan
          toko.
        </span>
      </div>

      {successToast && (
        <div className="mb-5 border-l-2 border-emerald-700 bg-emerald-50 px-4 py-3.5 text-xs font-semibold tracking-wide text-emerald-900">
          Login berhasil. Membuka dashboard admin...
        </div>
      )}

      {errors.general && (
        <div
          role="alert"
          className="mb-5 border-l-2 border-red-600 bg-red-50 px-4 py-3.5 text-xs font-semibold leading-relaxed tracking-wide text-red-700"
        >
          {errors.general}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <InputField
          label="EMAIL ATAU USERNAME"
          name="identifier"
          placeholder="Email atau Username"
          value={identifier}
          onChange={handleChange}
          error={errors.identifier}
          autoComplete="username"
          icon={<Mail className="h-4 w-4 text-zinc-400" />}
        />

        <PasswordField
          label="PASSWORD"
          name="password"
          placeholder="Masukkan password"
          value={password}
          onChange={handleChange}
          error={errors.password}
          autoComplete="current-password"
        />

        <div className="pt-2">
          <AuthButton type="submit" loading={loading}>
            MASUK KE PORTAL ADMIN
          </AuthButton>
        </div>
      </form>

      {/*
        Single secondary nav: AuthLayout admin mode
        "KEMBALI KE LOGIN PELANGGAN →" → /login
      */}
    </AuthLayout>
  );
};

export default LoginAdmin;
