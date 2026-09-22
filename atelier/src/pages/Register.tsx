import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  User,
  Mail,
  Phone,
  CheckCircle2,
} from 'lucide-react';

import AuthLayout from '../components/AuthLayout';
import AuthTabs from '../components/AuthTabs';
import InputField from '../components/InputField';
import PasswordField from '../components/PasswordField';
import AuthButton from '../components/AuthButton';
import SocialLogin from '../components/SocialLogin';

import {
  useAuth,
  ApiRequestError,
} from '../contexts/AuthContext';

import { API_BASE_URL } from '../lib/api';

export const Register: React.FC = () => {
  const navigate = useNavigate();
  const { register } = useAuth();

  const [formData, setFormData] = useState({
    name: '',
    username: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
  });

  const [errors, setErrors] = useState<{
    name?: string;
    username?: string;
    email?: string;
    phone?: string;
    password?: string;
    confirmPassword?: string;
    general?: string;
  }>({});

  const [loading, setLoading] = useState(false);
  const [successToast, setSuccessToast] =
    useState(false);

  /* =========================================================
     INPUT CHANGE
  ========================================================== */

  const handleChange = (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const { name, value } = event.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    const fieldError =
      errors[name as keyof typeof errors];

    if (fieldError) {
      setErrors((prev) => ({
        ...prev,
        [name]: undefined,
      }));
    }
  };

  /* =========================================================
     VALIDATION
  ========================================================== */

  const validate = () => {
    const newErrors: typeof errors = {};

    /* NAME
       Bebas, tidak harus unik.
    */

    if (!formData.name.trim()) {
      newErrors.name =
        'Nama lengkap wajib diisi.';
    }

    /* USERNAME
       Username digunakan sebagai identifier unik.
    */

    if (!formData.username.trim()) {
      newErrors.username =
        'Nama pengguna wajib diisi.';
    }

    /* EMAIL */

    if (!formData.email.trim()) {
      newErrors.email =
        'Email wajib diisi.';
    } else if (
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
        formData.email.trim(),
      )
    ) {
      newErrors.email =
        'Format email tidak valid.';
    }

    /* PHONE */

    if (!formData.phone.trim()) {
      newErrors.phone =
        'Nomor telepon wajib diisi.';
    }

    /* PASSWORD */

    if (!formData.password) {
      newErrors.password =
        'Kata sandi wajib diisi.';
    } else if (
      formData.password.length < 8
    ) {
      newErrors.password =
        'Kata sandi minimal 8 karakter.';
    }

    /* CONFIRM PASSWORD */

    if (!formData.confirmPassword) {
      newErrors.confirmPassword =
        'Konfirmasi kata sandi wajib diisi.';
    } else if (
      formData.confirmPassword !==
      formData.password
    ) {
      newErrors.confirmPassword =
        'Konfirmasi kata sandi tidak cocok.';
    }

    setErrors(newErrors);

    return (
      Object.keys(newErrors).length === 0
    );
  };

  /* =========================================================
     SUBMIT
  ========================================================== */

  const handleSubmit = async (
    event: React.FormEvent,
  ) => {
    event.preventDefault();

    if (!validate()) {
      return;
    }

    setLoading(true);
    setErrors({});

    try {
      await register({
        /*
         * NAME = nama lengkap bebas
         * USERNAME = username unik
         */
        name: formData.name.trim(),
        username: formData.username.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim(),
        password: formData.password,
      });

      setSuccessToast(true);

      window.setTimeout(() => {
        navigate('/login');
      }, 1800);
    } catch (err: unknown) {
      if (err instanceof ApiRequestError) {
        const message =
          err.message.toLowerCase();

        if (message.includes('username')) {
          setErrors({
            username: err.message,
          });
        } else if (
          message.includes('email')
        ) {
          setErrors({
            email: err.message,
          });
        } else if (
          message.includes('phone') ||
          message.includes('telepon')
        ) {
          setErrors({
            phone: err.message,
          });
        } else if (
          message.includes('name') ||
          message.includes('nama')
        ) {
          setErrors({
            name: err.message,
          });
        } else {
          setErrors({
            general: err.message,
          });
        }
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

  /* =========================================================
     AUTH TAB
  ========================================================== */

  const handleTabChange = (
    tab: 'login' | 'register',
  ) => {
    if (tab === 'login') {
      navigate('/login');
    }
  };

  /* =========================================================
     RENDER
  ========================================================== */

  return (
    <AuthLayout
      subtitle="Buat akun untuk menikmati pengalaman berbelanja eksklusif dan menyimpan koleksi favorit Anda."
    >
      {/* =====================================================
          AUTH TABS
      ====================================================== */}

      <div className="mb-6">
        <AuthTabs
          activeTab="register"
          onTabChange={handleTabChange}
        />
      </div>

      {/* =====================================================
          SUCCESS
      ====================================================== */}

      {successToast && (
        <div className="mb-5 flex items-center gap-3 border-l-2 border-emerald-700 bg-emerald-50 px-4 py-3.5 text-xs font-semibold tracking-wide text-emerald-900">
          <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-700" />

          <span>
            Keanggotaan Atelier berhasil dibuat.
            Mengarahkan ke halaman masuk...
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
          REGISTER FORM
      ====================================================== */}

      <form
        onSubmit={handleSubmit}
        className="space-y-3.5"
      >
        {/* ===================================================
            NAME
        ==================================================== */}

        <InputField
          label="NAMA LENGKAP"
          name="name"
          placeholder="Nama lengkap Anda"
          value={formData.name}
          onChange={handleChange}
          error={errors.name}
          icon={
            <User className="h-4 w-4 text-zinc-400" />
          }
        />

        {/* ===================================================
            USERNAME
        ==================================================== */}

        <InputField
          label="NAMA PENGGUNA"
          name="username"
          placeholder="Username"
          value={formData.username}
          onChange={handleChange}
          error={errors.username}
          icon={
            <User className="h-4 w-4 text-zinc-400" />
          }
        />

        {/* ===================================================
            EMAIL
        ==================================================== */}

        <InputField
          label="EMAIL"
          name="email"
          type="email"
          placeholder="Email Anda"
          value={formData.email}
          onChange={handleChange}
          error={errors.email}
          icon={
            <Mail className="h-4 w-4 text-zinc-400" />
          }
        />

        {/* ===================================================
            PHONE
        ==================================================== */}

        <InputField
          label="NO. TELEPON"
          name="phone"
          type="tel"
          placeholder="Nomor telepon"
          value={formData.phone}
          onChange={handleChange}
          error={errors.phone}
          icon={
            <Phone className="h-4 w-4 text-zinc-400" />
          }
        />

        {/* ===================================================
            PASSWORD
        ==================================================== */}

        <PasswordField
          label="KATA SANDI"
          name="password"
          placeholder="Minimal 8 karakter"
          value={formData.password}
          onChange={handleChange}
          error={errors.password}
        />

        {/* ===================================================
            CONFIRM PASSWORD
        ==================================================== */}

        <PasswordField
          label="KONFIRMASI SANDI"
          name="confirmPassword"
          placeholder="Ulangi kata sandi"
          value={formData.confirmPassword}
          onChange={handleChange}
          error={errors.confirmPassword}
        />

        {/* ===================================================
            SUBMIT
        ==================================================== */}

        <div className="pt-2">
          <AuthButton
            type="submit"
            loading={loading}
          >
            BUAT AKUN
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
    </AuthLayout>
  );
};

export default Register;