import React from 'react';

interface SocialLoginProps {
  onGoogleClick?: () => void;
}

export const SocialLogin: React.FC<SocialLoginProps> = ({ onGoogleClick }) => {
  return (
    <div className="my-5 space-y-3">
      {/* Divider */}
      <div className="relative flex items-center justify-center">
        <span className="text-[10px] font-bold tracking-[0.18em] text-gray-700 uppercase whitespace-nowrap">
          ATAU LANJUTKAN DENGAN
        </span>
      </div>

      {/* GOOGLE BUTTON */}
      <button
        type="button"
        onClick={onGoogleClick}
        className="w-full flex items-center justify-center gap-2.5 py-3 px-4 bg-[#EAE8E3] hover:bg-[#E2DFD8] text-gray-950 font-bold text-[11px] tracking-[0.14em] uppercase transition-colors rounded-sm cursor-pointer shadow-xs"
      >
        {/* Google Logo */}
        <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24">
          <path
            fill="#4285F4"
            d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
          />
          <path
            fill="#34A853"
            d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.11-6.72-4.96H1.29v3.13C3.26 21.3 7.31 24 12 24z"
          />
          <path
            fill="#FBBC05"
            d="M5.28 14.24c-.25-.72-.38-1.49-.38-2.24s.13-1.52.38-2.24V6.63H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.37l3.99-3.13z"
          />
          <path
            fill="#EA4335"
            d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.63l3.99 3.13c.95-2.85 3.6-4.96 6.72-4.96z"
          />
        </svg>

        <span>GOOGLE</span>
      </button>
    </div>
  );
};

export default SocialLogin;