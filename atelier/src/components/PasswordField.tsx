import React, { useState } from 'react';
import { Lock, Eye, EyeOff } from 'lucide-react';

export interface PasswordFieldProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label: string;
  name: string;
  error?: string;
  labelRight?: React.ReactNode;
  containerClassName?: string;
}

export const PasswordField: React.FC<PasswordFieldProps> = ({
  label,
  name,
  error,
  labelRight,
  containerClassName = '',
  className = '',
  ...props
}) => {
  const [showPassword, setShowPassword] = useState(false);

  const togglePasswordVisibility = () => {
    setShowPassword((prev) => !prev);
  };

  return (
    <div className={`space-y-1.5 ${containerClassName}`}>
      <div className="flex justify-between items-center">
        <label htmlFor={name} className="block text-[11px] font-bold tracking-[0.12em] text-[#222222] uppercase">
          {label}
        </label>
        {labelRight}
      </div>
      <div className={`relative flex items-center bg-[#ECECEC] border ${error ? 'border-red-500' : 'border-[#E0E0E0]'} focus-within:border-black transition-luxury`}>
        <div className="pl-3.5 pr-1 text-gray-500 flex items-center justify-center pointer-events-none">
          <Lock className="w-4 h-4 text-gray-600" />
        </div>
        <input
          id={name}
          name={name}
          type={showPassword ? 'text' : 'password'}
          className={`w-full bg-transparent py-3 pl-3 pr-10 text-xs md:text-sm text-gray-900 placeholder:text-gray-400 placeholder:text-[11px] placeholder:tracking-wider font-medium outline-none ${className}`}
          {...props}
        />
        <button
          type="button"
          onClick={togglePasswordVisibility}
          className="absolute right-3 text-gray-500 hover:text-gray-800 transition-colors p-1 cursor-pointer focus:outline-none"
          title={showPassword ? 'Sembunyikan Kata Sandi' : 'Tampilkan Kata Sandi'}
          aria-label={showPassword ? 'Sembunyikan Kata Sandi' : 'Tampilkan Kata Sandi'}
        >
          {showPassword ? (
            <EyeOff className="w-4 h-4 text-gray-600" />
          ) : (
            <Eye className="w-4 h-4 text-gray-600" />
          )}
        </button>
      </div>
      {error && (
        <p className="text-[11px] text-red-600 font-medium tracking-wide flex items-center gap-1 mt-1">
          <span className="inline-block w-1.5 h-1.5 rounded-full bg-red-600"></span>
          {error}
        </p>
      )}
    </div>
  );
};

export default PasswordField;
