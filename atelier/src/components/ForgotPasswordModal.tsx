import React, { useState } from 'react';
import { X, Mail, CheckCircle2, ArrowLeft, ShieldCheck } from 'lucide-react';
import InputField from './InputField';
import PasswordField from './PasswordField';
import AuthButton from './AuthButton';
import OtpInput from './OtpInput';
import { api, ApiRequestError } from '../lib/api';
import type { VerifyOtpResponse } from '../types/api';

interface ForgotPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type Step = 'email' | 'otp' | 'reset' | 'done';

export const ForgotPasswordModal: React.FC<ForgotPasswordModalProps> = ({ isOpen, onClose }) => {
  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [resetToken, setResetToken] = useState('');

  if (!isOpen) return null;

  const reset = () => {
    setStep('email');
    setEmail('');
    setOtp('');
    setNewPassword('');
    setConfirmPassword('');
    setError('');
    setLoading(false);
    setResetToken('');
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setError('Masukkan email Anda.');
      return;
    }

    setLoading(true);
    setError('');
    try {
      await api.post('/auth/forgot', { email: email.trim() });
      setStep('otp');
      setOtp('');
    } catch (err) {
      if (err instanceof ApiRequestError) {
        setError(err.message);
      } else {
        setError('Terjadi kesalahan. Silakan coba lagi.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length !== 6) {
      setError('Masukkan kode OTP 6 digit.');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const result = await api.post<VerifyOtpResponse>('/auth/verify-otp', {
        email: email.trim(),
        otp,
      });
      setResetToken(result.resetToken);
      setStep('reset');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      if (err instanceof ApiRequestError) {
        setError(err.message);
      } else {
        setError('Terjadi kesalahan. Silakan coba lagi.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 8) {
      setError('Password minimal 8 karakter.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Konfirmasi password tidak cocok.');
      return;
    }

    setLoading(true);
    setError('');
    try {
      await api.post('/auth/reset-password', {
        resetToken,
        newPassword,
      });
      setStep('done');
    } catch (err) {
      if (err instanceof ApiRequestError) {
        setError(err.message);
      } else {
        setError('Terjadi kesalahan. Silakan coba lagi.');
      }
    } finally {
      setLoading(false);
    }
  };

  const maskedEmail = email.replace(/(.{2})(.*)(@.*)/, '$1***$3');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs transition-opacity animate-fadeIn">
      <div className="bg-[#FAF9F5] border border-gray-300 w-full max-w-md p-6 sm:p-8 shadow-2xl relative">
        <button
          type="button"
          onClick={handleClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-black p-1 cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {step === 'email' && (
          <div className="space-y-4">
            <div>
              <span className="font-editorial text-lg font-bold tracking-widest text-black uppercase">
                ATELIER
              </span>
              <h3 className="font-editorial text-2xl text-gray-900 font-normal mt-1">
                Atur Ulang Kata Sandi
              </h3>
              <p className="text-xs text-gray-600 mt-1 leading-relaxed">
                Masukkan alamat email yang terdaftar pada keanggotaan Atelier Anda. Kode OTP verifikasi akan dikirimkan secara otomatis.
              </p>
            </div>

            <form onSubmit={handleEmailSubmit} className="space-y-4 pt-2">
              <InputField
                label="EMAIL"
                name="resetEmail"
                placeholder="CONTOH: USER@ATELIER.COM"
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (error) setError('');
                }}
                error={error}
                icon={<Mail className="w-4 h-4 text-gray-500" />}
              />

              <AuthButton type="submit" loading={loading}>
                KIRIM KODE OTP
              </AuthButton>
            </form>
          </div>
        )}

        {step === 'otp' && (
          <div className="space-y-4">
            <div>
              <button
                type="button"
                onClick={() => { setStep('email'); setError(''); setOtp(''); }}
                className="flex items-center gap-1 text-[11px] font-bold tracking-wider text-gray-500 hover:text-black cursor-pointer mb-2"
              >
                <ArrowLeft className="w-3 h-3" />
                KEMBALI
              </button>
              <span className="font-editorial text-lg font-bold tracking-widest text-black uppercase">
                ATELIER
              </span>
              <h3 className="font-editorial text-2xl text-gray-900 font-normal mt-1">
                Verifikasi OTP
              </h3>
              <p className="text-xs text-gray-600 mt-1 leading-relaxed">
                Masukkan kode 6 digit yang telah dikirim ke <span className="font-bold text-gray-900">{maskedEmail}</span>. Kode berlaku selama 10 menit.
              </p>
            </div>

            <form onSubmit={handleOtpSubmit} className="space-y-4 pt-2">
              <OtpInput
                value={otp}
                onChange={(v) => { setOtp(v); if (error) setError(''); }}
                error={error}
                disabled={loading}
              />

              <AuthButton type="submit" loading={loading} showArrow={false}>
                VERIFIKASI
              </AuthButton>
            </form>
          </div>
        )}

        {step === 'reset' && (
          <div className="space-y-4">
            <div>
              <button
                type="button"
                onClick={() => { setStep('otp'); setError(''); setNewPassword(''); setConfirmPassword(''); }}
                className="flex items-center gap-1 text-[11px] font-bold tracking-wider text-gray-500 hover:text-black cursor-pointer mb-2"
              >
                <ArrowLeft className="w-3 h-3" />
                KEMBALI
              </button>
              <span className="font-editorial text-lg font-bold tracking-widest text-black uppercase">
                ATELIER
              </span>
              <h3 className="font-editorial text-2xl text-gray-900 font-normal mt-1">
                Password Baru
              </h3>
              <p className="text-xs text-gray-600 mt-1 leading-relaxed">
                Buat password baru untuk akun Anda. Password minimal 8 karakter.
              </p>
            </div>

            <form onSubmit={handleResetSubmit} className="space-y-4 pt-2">
              <PasswordField
                label="PASSWORD BARU"
                name="newPassword"
                placeholder="Masukkan password baru"
                value={newPassword}
                onChange={(e) => {
                  setNewPassword(e.target.value);
                  if (error) setError('');
                }}
                error={undefined}
              />

              <PasswordField
                label="KONFIRMASI PASSWORD"
                name="confirmPassword"
                placeholder="Ulangi password baru"
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  if (error) setError('');
                }}
                error={error}
              />

              <AuthButton type="submit" loading={loading} showArrow={false}>
                SIMPAN PASSWORD BARU
              </AuthButton>
            </form>
          </div>
        )}

        {step === 'done' && (
          <div className="text-center py-4 space-y-4">
            <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
              <ShieldCheck className="w-7 h-7" />
            </div>
            <h3 className="font-editorial text-2xl text-gray-950 font-normal">
              Password Berhasil Diubah
            </h3>
            <p className="text-xs text-gray-600 leading-relaxed max-w-xs mx-auto">
              Password akun Anda telah berhasil diperbarui. Silakan masuk dengan password baru Anda.
            </p>
            <button
              type="button"
              onClick={handleClose}
              className="w-full bg-[#111111] hover:bg-black text-white text-xs font-bold py-3 uppercase tracking-widest cursor-pointer transition-luxury mt-2"
            >
              KEMBALI KE HALAMAN MASUK
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ForgotPasswordModal;
