import { Save, UserRound } from 'lucide-react';

export interface ProfileFormValues {
  name: string;
  username: string;
  email: string;
  phone: string;
}

export type ProfileFieldErrors = Partial<Record<keyof ProfileFormValues, string>>;

interface PersonalInformationFormProps {
  form: ProfileFormValues;
  fieldErrors: ProfileFieldErrors;
  isSubmitting: boolean;
  saveError: string | null;
  onChange: (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => void;
  onSubmit: (e: React.FormEvent) => void;
}

const inputClass =
  'h-10 w-full rounded-xl border border-[#EDEAE3] bg-[#FAFAF8] px-3 text-[13px] text-[#1A1A1A] focus:border-[#B7C9D9] focus:bg-white focus:outline-none disabled:opacity-60';

const labelClass =
  'mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.1em] text-[#6B6B6B]';

/**
 * Shared Personal Information form for Admin + User profile.
 * Name / Username / Phone editable · Email read-only (no email-change flow yet).
 */
export default function PersonalInformationForm({
  form,
  fieldErrors,
  isSubmitting,
  saveError,
  onChange,
  onSubmit,
}: PersonalInformationFormProps) {
  return (
    <section className="overflow-hidden rounded-2xl border border-[#E8E4DC] bg-white shadow-[0_1px_2px_rgba(26,26,26,0.03)]">
      <div className="border-b border-[#F0EDE7] px-5 py-4 sm:px-6">
        <div className="flex items-center gap-2">
          <UserRound size={16} strokeWidth={1.75} className="text-[#2F5D86]" />
          <h2 className="font-editorial text-[18px] font-medium tracking-tight text-[#1A1A1A]">
            Personal Information
          </h2>
        </div>
        <p className="mt-1 text-[12px] text-[#8A847B]">
          Update your name, contact details, and account identifiers.
        </p>
      </div>

      <form onSubmit={onSubmit} className="space-y-4 px-5 py-5 sm:px-6">
        {saveError && (
          <div className="rounded-xl border border-[#F3B0A3] bg-[#FBD9D3] px-4 py-3 text-[12px] font-medium text-[#8C3A1E]">
            {saveError}
          </div>
        )}

        <div>
          <label htmlFor="profile-name" className={labelClass}>
            Name <span className="text-[#A05050]">*</span>
          </label>
          <input
            id="profile-name"
            name="name"
            type="text"
            value={form.name}
            onChange={onChange}
            disabled={isSubmitting}
            maxLength={100}
            className={inputClass}
            placeholder="Your full name"
          />
          {fieldErrors.name && (
            <p className="mt-1 text-[11px] text-[#A05050]">{fieldErrors.name}</p>
          )}
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="profile-username" className={labelClass}>
              Username <span className="text-[#A05050]">*</span>
            </label>
            <input
              id="profile-username"
              name="username"
              type="text"
              value={form.username}
              onChange={onChange}
              disabled={isSubmitting}
              maxLength={50}
              className={inputClass}
              placeholder="username"
            />
            {fieldErrors.username && (
              <p className="mt-1 text-[11px] text-[#A05050]">
                {fieldErrors.username}
              </p>
            )}
          </div>

          <div>
            <label htmlFor="profile-phone" className={labelClass}>
              Phone
            </label>
            <input
              id="profile-phone"
              name="phone"
              type="tel"
              value={form.phone}
              onChange={onChange}
              disabled={isSubmitting}
              className={inputClass}
              placeholder="08123456789"
            />
            {fieldErrors.phone && (
              <p className="mt-1 text-[11px] text-[#A05050]">
                {fieldErrors.phone}
              </p>
            )}
          </div>
        </div>

        <div>
          <label htmlFor="profile-email" className={labelClass}>
            Email
          </label>
          <input
            id="profile-email"
            name="email"
            type="email"
            value={form.email}
            readOnly
            disabled
            className={`${inputClass} cursor-not-allowed bg-[#F3F1EC] text-[#6B6B6B]`}
            placeholder="email@example.com"
          />
          <p className="mt-1 text-[11px] text-[#8A847B]">
            Read-only — email change requires a verification flow (not available
            yet).
          </p>
        </div>

        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex items-center gap-2 rounded-xl bg-[#1A1A1A] px-5 py-2.5 text-[12px] font-semibold uppercase tracking-[0.1em] text-white transition-colors hover:bg-[#333] disabled:opacity-50"
          >
            <Save size={14} />
            {isSubmitting ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </form>
    </section>
  );
}
