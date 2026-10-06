import { KeyRound, ShieldCheck } from 'lucide-react';

interface SecuritySectionProps {
  onChangePassword: () => void;
  /** "admin" | "user" — small copy tweak only */
  accountLabel?: string;
}

export default function SecuritySection({
  onChangePassword,
  accountLabel = 'account',
}: SecuritySectionProps) {
  return (
    <section className="overflow-hidden rounded-2xl border border-[#E8E4DC] bg-white shadow-[0_1px_2px_rgba(26,26,26,0.03)]">
      <div className="border-b border-[#F0EDE7] px-5 py-4 sm:px-6">
        <div className="flex items-center gap-2">
          <ShieldCheck size={16} strokeWidth={1.75} className="text-[#2F5D86]" />
          <h2 className="font-editorial text-[18px] font-medium tracking-tight text-[#1A1A1A]">
            Security
          </h2>
        </div>
        <p className="mt-1 text-[12px] text-[#8A847B]">
          Protect your {accountLabel}.
        </p>
      </div>

      <div className="space-y-4 px-5 py-5 sm:px-6">
        <div>
          <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-[0.1em] text-[#6B6B6B]">
            Password
          </p>
          <div className="flex h-10 items-center rounded-xl border border-[#EDEAE3] bg-[#FAFAF8] px-3">
            <span className="text-[14px] tracking-[0.2em] text-[#8A847B]">
              ••••••••••••
            </span>
          </div>
          <p className="mt-1.5 text-[11px] leading-relaxed text-[#8A847B]">
            Changing your password sends a verification code to your email, then
            signs out other sessions.
          </p>
        </div>

        <div className="flex justify-end pt-1">
          <button
            type="button"
            onClick={onChangePassword}
            className="inline-flex items-center gap-2 rounded-xl border border-[#D9E3EC] bg-[#F4F8FB] px-5 py-2.5 text-[12px] font-semibold text-[#2F5D86] transition-colors hover:bg-[#E8F1F8]"
          >
            <KeyRound size={14} />
            Change Password
          </button>
        </div>
      </div>
    </section>
  );
}
