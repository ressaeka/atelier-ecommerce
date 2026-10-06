import { useState } from 'react';
import { X, Mail, ShieldCheck } from 'lucide-react';
import { api, ApiRequestError } from '../../lib/api';
import type { VerifyOtpResponse } from '../../types/api';

interface ChangePasswordModalProps {
  /** Prefilled email from auth */
  defaultEmail?: string;
  onClose: () => void;
  onSuccess?: () => void;
}

type Step = 'email' | 'otp' | 'reset' | 'done';

/**
 * Shared Change Password modal (Admin + User).
 * Uses existing auth endpoints only:
 * POST /auth/forgot → POST /auth/verify-otp → POST /auth/reset-password
 */
export default function ChangePasswordModal({
  defaultEmail = '',
  onClose,
  onSuccess,
}: ChangePasswordModalProps) {
  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState(defaultEmail);
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const reset = () => {
    setStep('email');
    setEmail(defaultEmail);
    setOtp('');
    setNewPassword('');
    setConfirmPassword('');
    setError(null);
    setLoading(false);
    setResetToken('');
  };

  const handleClose = () => {
    if (loading) return;
    reset();
    onClose();
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    if (!email.trim()) {
      setError('Email is required.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await api.post('/auth/forgot', { email: email.trim() });
      setStep('otp');
      setOtp('');
    } catch (err) {
      setError(
        err instanceof ApiRequestError
          ? err.message
          : 'Unable to send reset code. Please try again.',
      );
    } finally {
      setLoading(false);
    }
  };

  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    if (otp.length !== 6) {
      setError('Enter the 6-digit code sent to your email.');
      return;
    }
    setLoading(true);
    setError(null);
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
      setError(
        err instanceof ApiRequestError
          ? err.message
          : 'Unable to verify the code. Please try again.',
      );
    } finally {
      setLoading(false);
    }
  };

  const handleResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await api.post('/auth/reset-password', {
        resetToken,
        newPassword,
      });
      setStep('done');
    } catch (err) {
      setError(
        err instanceof ApiRequestError
          ? err.message
          : 'Unable to change password. Please try again.',
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      <button
        type="button"
        className="absolute inset-0 bg-black/35 backdrop-blur-[2px]"
        onClick={handleClose}
        aria-label="Close change password"
      />

      <div className="relative z-10 max-h-[92vh] w-full max-w-[440px] overflow-y-auto rounded-t-2xl border border-[#E8E4DC] bg-white shadow-2xl sm:rounded-2xl">
        <header className="sticky top-0 z-10 flex items-start justify-between gap-3 border-b border-[#F0EDE7] bg-white px-5 py-4 sm:px-6">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#8A847B]">
              Account · Security
            </p>
            <h2 className="mt-1 font-editorial text-[22px] font-medium text-[#1A1A1A]">
              Change Password
            </h2>
          </div>
          <button
            type="button"
            onClick={handleClose}
            disabled={loading}
            className="rounded-lg border border-[#EDEAE3] p-2 text-[#6B6B6B] transition-colors hover:bg-[#F3F1EC] hover:text-[#1A1A1A] disabled:opacity-50"
            aria-label="Close"
          >
            <X size={16} />
          </button>
        </header>

        <div className="space-y-4 px-5 py-5 sm:px-6">
          {error && (
            <div className="rounded-xl border border-[#F3B0A3] bg-[#FBD9D3] px-4 py-3 text-[12px] font-medium text-[#8C3A1E]">
              {error}
            </div>
          )}

          {step === 'email' && (
            <form onSubmit={handleEmailSubmit} className="space-y-4">
              <p className="text-[13px] leading-relaxed text-[#6B6B6B]">
                We&apos;ll email a one-time code to verify it&apos;s you before
                setting a new password.
              </p>
              <div>
                <label
                  htmlFor="cp-email"
                  className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.1em] text-[#6B6B6B]"
                >
                  Email
                </label>
                <div className="relative">
                  <Mail
                    size={15}
                    className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#A39E95]"
                  />
                  <input
                    id="cp-email"
                    type="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      setError(null);
                    }}
                    disabled={loading}
                    className="h-10 w-full rounded-xl border border-[#EDEAE3] bg-[#FAFAF8] pl-9 pr-3 text-[13px] text-[#1A1A1A] focus:border-[#B7C9D9] focus:bg-white focus:outline-none disabled:opacity-60"
                    placeholder="email@example.com"
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl bg-[#1A1A1A] px-5 py-2.5 text-[12px] font-semibold uppercase tracking-[0.1em] text-white transition-colors hover:bg-[#333] disabled:opacity-50"
              >
                {loading ? 'Sending...' : 'Send Code'}
              </button>
            </form>
          )}

          {step === 'otp' && (
            <form onSubmit={handleOtpSubmit} className="space-y-4">
              <p className="text-[13px] leading-relaxed text-[#6B6B6B]">
                Enter the 6-digit code sent to{' '}
                <span className="font-medium text-[#1A1A1A]">{email}</span>.
              </p>
              <div>
                <label
                  htmlFor="cp-otp"
                  className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.1em] text-[#6B6B6B]"
                >
                  Verification Code
                </label>
                <input
                  id="cp-otp"
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={6}
                  value={otp}
                  onChange={(e) => {
                    setOtp(e.target.value.replace(/\D/g, '').slice(0, 6));
                    setError(null);
                  }}
                  disabled={loading}
                  className="h-10 w-full rounded-xl border border-[#EDEAE3] bg-[#FAFAF8] px-3 text-center text-[15px] tracking-[0.35em] text-[#1A1A1A] focus:border-[#B7C9D9] focus:bg-white focus:outline-none disabled:opacity-60"
                  placeholder="000000"
                />
              </div>
              <button
                type="submit"
                disabled={loading || otp.length !== 6}
                className="w-full rounded-xl bg-[#1A1A1A] px-5 py-2.5 text-[12px] font-semibold uppercase tracking-[0.1em] text-white transition-colors hover:bg-[#333] disabled:opacity-50"
              >
                {loading ? 'Verifying...' : 'Verify Code'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setStep('email');
                  setError(null);
                }}
                disabled={loading}
                className="w-full rounded-xl border border-[#EDEAE3] px-5 py-2.5 text-[12px] font-semibold text-[#4A4A4A] transition-colors hover:bg-[#F3F1EC] disabled:opacity-50"
              >
                Use a different email
              </button>
            </form>
          )}

          {step === 'reset' && (
            <form onSubmit={handleResetSubmit} className="space-y-4">
              <div>
                <label
                  htmlFor="cp-new"
                  className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.1em] text-[#6B6B6B]"
                >
                  New Password
                </label>
                <input
                  id="cp-new"
                  type="password"
                  value={newPassword}
                  onChange={(e) => {
                    setNewPassword(e.target.value);
                    setError(null);
                  }}
                  disabled={loading}
                  minLength={8}
                  className="h-10 w-full rounded-xl border border-[#EDEAE3] bg-[#FAFAF8] px-3 text-[13px] text-[#1A1A1A] focus:border-[#B7C9D9] focus:bg-white focus:outline-none disabled:opacity-60"
                  placeholder="Min. 8 characters"
                />
              </div>
              <div>
                <label
                  htmlFor="cp-confirm"
                  className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.1em] text-[#6B6B6B]"
                >
                  Confirm Password
                </label>
                <input
                  id="cp-confirm"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    setError(null);
                  }}
                  disabled={loading}
                  minLength={8}
                  className="h-10 w-full rounded-xl border border-[#EDEAE3] bg-[#FAFAF8] px-3 text-[13px] text-[#1A1A1A] focus:border-[#B7C9D9] focus:bg-white focus:outline-none disabled:opacity-60"
                  placeholder="Re-enter new password"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl bg-[#1A1A1A] px-5 py-2.5 text-[12px] font-semibold uppercase tracking-[0.1em] text-white transition-colors hover:bg-[#333] disabled:opacity-50"
              >
                {loading ? 'Saving...' : 'Update Password'}
              </button>
            </form>
          )}

          {step === 'done' && (
            <div className="space-y-4 text-center">
              <div className="mx-auto inline-flex h-12 w-12 items-center justify-center rounded-xl bg-[#E4F4EA] text-[#2C6943]">
                <ShieldCheck size={22} strokeWidth={1.7} />
              </div>
              <p className="font-editorial text-[18px] text-[#1A1A1A]">
                Password updated
              </p>
              <p className="text-[13px] leading-relaxed text-[#6B6B6B]">
                Your password has been changed. For security, all other sessions
                were signed out — please sign in again with the new password.
              </p>
              <button
                type="button"
                onClick={() => {
                  onSuccess?.();
                  onClose();
                }}
                className="w-full rounded-xl bg-[#1A1A1A] px-5 py-2.5 text-[12px] font-semibold uppercase tracking-[0.1em] text-white transition-colors hover:bg-[#333]"
              >
                Done
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
