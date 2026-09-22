import React from 'react';
import { ArrowRight, Loader2 } from 'lucide-react';

interface AuthButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  loading?: boolean;
  showArrow?: boolean;
}

export const AuthButton: React.FC<AuthButtonProps> = ({
  children,
  loading = false,
  showArrow = true,
  className = '',
  disabled,
  ...props
}) => {
  return (
    <button
      {...props}
      disabled={disabled || loading}
      className={`w-full bg-[#111111] hover:bg-black active:bg-gray-950 text-white font-bold py-3.5 px-6 text-xs tracking-[0.15em] uppercase flex items-center justify-center gap-2 transition-luxury shadow-sm cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed group ${className}`}
    >
      {loading ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin text-white" />
          <span>MEMPROSES...</span>
        </>
      ) : (
        <>
          <span>{children}</span>
          {showArrow && (
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          )}
        </>
      )}
    </button>
  );
};

export default AuthButton;
