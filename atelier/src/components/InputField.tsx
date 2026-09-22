import React from 'react';

export interface InputFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  name: string;
  error?: string;
  icon?: React.ReactNode;
  labelRight?: React.ReactNode;
  containerClassName?: string;
}

export const InputField: React.FC<InputFieldProps> = ({
  label,
  name,
  error,
  icon,
  labelRight,
  containerClassName = '',
  className = '',
  ...props
}) => {
  return (
    <div className={`space-y-1.5 ${containerClassName}`}>
      <div className="flex justify-between items-center">
        <label htmlFor={name} className="block text-[11px] font-bold tracking-[0.12em] text-[#222222] uppercase">
          {label}
        </label>
        {labelRight}
      </div>
      <div className={`relative flex items-center bg-[#ECECEC] border ${error ? 'border-red-500' : 'border-[#E0E0E0]'} focus-within:border-black transition-luxury`}>
        {icon && (
          <div className="pl-3.5 pr-1 text-gray-500 flex items-center justify-center pointer-events-none">
            {icon}
          </div>
        )}
        <input
          id={name}
          name={name}
          className={`w-full bg-transparent py-3 px-3 text-xs md:text-sm text-gray-900 placeholder:text-gray-400 placeholder:text-[11px] placeholder:tracking-wider font-medium outline-none ${className}`}
          {...props}
        />
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

export default InputField;
