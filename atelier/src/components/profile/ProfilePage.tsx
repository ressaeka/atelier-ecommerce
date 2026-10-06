import { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import ChangePasswordModal from './ChangePasswordModal';
import PersonalInformationForm from './PersonalInformationForm';
import SecuritySection from './SecuritySection';
import type { ProfileFieldErrors, ProfileFormValues } from './PersonalInformationForm';
import type { UpdateUserRequest } from '../../types/api';

interface ProfilePageProps {
  /** Eyebrow under header — e.g. "Admin · Account" or "Account" */
  eyebrow?: string;
  /** Security card copy suffix */
  accountLabel?: string;
}

function formFromUser(user: {
  name: string;
  username: string;
  email: string;
  phone: string | null;
}): ProfileFormValues {
  return {
    name: user.name ?? '',
    username: user.username ?? '',
    email: user.email ?? '',
    phone: user.phone ?? '',
  };
}

/** Client validation aligned with backend updateUserSchema (email not submitted) */
function validateForm(form: ProfileFormValues): ProfileFieldErrors {
  const errors: ProfileFieldErrors = {};

  if (!form.name.trim()) {
    errors.name = 'Name is required.';
  } else if (form.name.trim().length < 3) {
    errors.name = 'Name must be at least 3 characters.';
  } else if (form.name.trim().length > 100) {
    errors.name = 'Name must be 100 characters or fewer.';
  }

  if (!form.username.trim()) {
    errors.username = 'Username is required.';
  } else if (form.username.trim().length < 3) {
    errors.username = 'Username must be at least 3 characters.';
  } else if (form.username.trim().length > 50) {
    errors.username = 'Username must be 50 characters or fewer.';
  } else if (!/^[a-zA-Z0-9_]+$/.test(form.username.trim())) {
    errors.username = 'Username may only use letters, numbers, and underscore.';
  }

  if (form.phone.trim()) {
    if (!/^(?:\+62|62|0)8[1-9][0-9]{7,11}$/.test(form.phone.trim())) {
      errors.phone =
        'Enter a valid Indonesian phone number (e.g. 08123456789).';
    }
  }

  return errors;
}

/**
 * Shared Profile page content for Admin (/admin/profile) and User (/profile).
 * Email is read-only. Change Password uses existing OTP auth endpoints.
 */
export default function ProfilePage({
  eyebrow = 'Account',
  accountLabel = 'account',
}: ProfilePageProps) {
  const { user, updateProfile } = useAuth();

  const [form, setForm] = useState<ProfileFormValues>(() =>
    user
      ? formFromUser(user)
      : { name: '', username: '', email: '', phone: '' },
  );
  const [fieldErrors, setFieldErrors] = useState<ProfileFieldErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);
  const [passwordOpen, setPasswordOpen] = useState(false);

  useEffect(() => {
    if (user) {
      setForm(formFromUser(user));
    }
  }, [user]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    if (name === 'email') return;
    setForm((prev) => ({ ...prev, [name]: value }));
    setSaveSuccess(null);
    if (fieldErrors[name as keyof ProfileFormValues]) {
      setFieldErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    setSaveError(null);
    setSaveSuccess(null);

    const errors = validateForm(form);
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;

    // Email intentionally omitted — read-only until verification flow exists
    const payload: UpdateUserRequest = {
      name: form.name.trim(),
      username: form.username.trim(),
      phone: form.phone.trim() || undefined,
    };

    setIsSubmitting(true);
    try {
      await updateProfile(payload);
      setSaveSuccess('Profile updated successfully.');
    } catch (err) {
      setSaveError(
        err instanceof Error && err.message
          ? err.message
          : 'Unable to update profile.',
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!user) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center rounded-2xl border border-[#E8E4DC] bg-white">
        <p className="text-[11px] uppercase tracking-[0.22em] text-[#8A847B]">
          Loading profile…
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#8A847B]">
            {eyebrow}
          </p>
          <h1 className="mt-1.5 font-editorial text-[26px] font-medium tracking-tight text-[#1A1A1A] sm:text-[28px]">
            Profile
          </h1>
          <p className="mt-1.5 text-[13px] text-[#6B6B6B]">
            Manage your account information and security.
          </p>
        </div>
      </header>

      {saveSuccess && (
        <div
          role="status"
          className="rounded-xl border border-[#BDE0C7] bg-[#E4F4EA] px-4 py-3 text-[12px] font-medium text-[#2C6943]"
        >
          {saveSuccess}
        </div>
      )}

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        <PersonalInformationForm
          form={form}
          fieldErrors={fieldErrors}
          isSubmitting={isSubmitting}
          saveError={saveError}
          onChange={handleChange}
          onSubmit={handleSubmit}
        />

        <SecuritySection
          accountLabel={accountLabel}
          onChangePassword={() => setPasswordOpen(true)}
        />
      </div>

      {passwordOpen && (
        <ChangePasswordModal
          defaultEmail={user.email ?? ''}
          onClose={() => setPasswordOpen(false)}
        />
      )}
    </div>
  );
}
