import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, CheckCircle2 } from 'lucide-react';
import AuthLayout from '../components/AuthLayout';
import AuthTabs from '../components/AuthTabs';
import InputField from '../components/InputField';
import PasswordField from '../components/PasswordField';
import AuthButton from '../components/AuthButton';
import SocialLogin from '../components/SocialLogin';
import GuestAccess from '../components/GuestAccess';
import ForgotPasswordModal from '../components/ForgotPasswordModal';
import { useAuth, ApiRequestError } from '../contexts/AuthContext';
import { API_BASE_URL } from '../lib/api';

export const Login: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuth();

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

    if (!validate()) return;

    setLoading(true);
    setErrors({});

    try {
      await login({
        identifier: formData.emailOrPhone,
        password: formData.password,
      });

      setSuccessToast(true);

      setTimeout(() => {
        navigate('/');
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

  return (
    <AuthLayout
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
        <div className="mb-5 border-l-2 border-red-600 bg-red-50 px-4 py-3.5 text-xs font-semibold leading-relaxed tracking-wide text-red-700">
          {errors.general}
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