import React from 'react';
import { ChevronDown, Check } from 'lucide-react';

/**
 * Primitives shared by the Keranjang / Favorit / Pesanan / Pembayaran screens.
 * These encode the recurring shapes in the Figma reference (the cream section
 * strip, the grey list surface, the cream "VARIAN" pill, the square selector and
 * the "- 1X +" stepper) so the four pages stay visually consistent.
 */

export const SERIF = "'Libre Bodoni', 'Bodoni Moda', 'Playfair Display', Georgia, serif";

/** Editorial serif text — used for every heading, product name, price and label. */
export const Serif: React.FC<{
  children: React.ReactNode;
  className?: string;
  as?: 'span' | 'p' | 'h1' | 'h2' | 'h3';
  bold?: boolean;
}> = ({ children, className = '', as: Tag = 'span', bold = false }) => (
  <Tag className={className} style={{ fontFamily: SERIF, fontWeight: bold ? 700 : 400 }}>
    {children}
  </Tag>
);

/** The cream strip that titles each list, e.g. "KERANJANG SAYA". */
export const SectionStrip: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className = '',
}) => (
  <div className={`bg-[#EFEEEA] px-5 sm:px-7 py-3 ${className}`}>
    <Serif bold className="text-[11px] sm:text-[12px] tracking-[0.12em] uppercase text-[#3A3A3A]">
      {children}
    </Serif>
  </div>
);

/** Square selector used down the left edge of cart / favourite rows. */
export const SquareCheckbox: React.FC<{
  checked: boolean;
  onChange: () => void;
  label: string;
  className?: string;
}> = ({ checked, onChange, label, className = '' }) => (
  <button
    type="button"
    role="checkbox"
    aria-checked={checked}
    aria-label={label}
    onClick={onChange}
    className={`w-[26px] h-[26px] flex-shrink-0 flex items-center justify-center border transition-colors duration-200 ${
      checked
        ? 'bg-[#1A1A1A] border-[#1A1A1A] text-white'
        : 'bg-[#F2F2F2] border-[#CFCFCF] hover:border-[#9A9A9A]'
    } ${className}`}
  >
    {checked && <Check size={14} strokeWidth={2.5} />}
  </button>
);

/** Cream pill dropdown. Falls back to a static pill when there are no options. */
export const VariantSelect: React.FC<{
  value: string;
  options?: string[];
  onChange?: (value: string) => void;
  className?: string;
}> = ({ value, options, onChange, className = '' }) => {
  const interactive = Boolean(options && options.length > 0 && onChange);

  return (
    <div
      className={`relative inline-flex items-center bg-[#EFEEEA] border border-[#E0DED8] rounded-[6px] px-4 py-2 min-w-[120px] ${className}`}
    >
      <Serif
        bold
        className="text-[11px] sm:text-[12px] tracking-[0.1em] uppercase text-[#2A2A2A] whitespace-nowrap pr-5"
      >
        {value}
      </Serif>
      <ChevronDown
        size={14}
        strokeWidth={1.75}
        className="absolute right-3 text-[#5A5A5A] pointer-events-none"
      />
      {interactive && (
        <select
          aria-label="Pilih varian"
          value={value}
          onChange={(e) => onChange?.(e.target.value)}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        >
          {options?.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
      )}
    </div>
  );
};

/** The "- 1X +" quantity control. */
export const QuantityStepper: React.FC<{
  quantity: number;
  onDecrease: () => void;
  onIncrease: () => void;
  disabled?: boolean;
}> = ({ quantity, onDecrease, onIncrease, disabled = false }) => (
  <div className="flex items-center gap-1.5">
    <button
      type="button"
      onClick={onDecrease}
      disabled={disabled}
      aria-label="Kurangi jumlah"
      className="w-6 h-6 flex items-center justify-center text-[15px] leading-none text-[#5A5A5A] hover:text-[#1A1A1A] transition-colors disabled:opacity-40"
    >
      –
    </button>
    <span
      className="min-w-[34px] h-[26px] px-2 flex items-center justify-center bg-white border border-[#E2E0DA] text-[12px] text-[#1A1A1A]"
      style={{ fontFamily: SERIF, fontWeight: 700 }}
    >
      {quantity}X
    </span>
    <button
      type="button"
      onClick={onIncrease}
      disabled={disabled}
      aria-label="Tambah jumlah"
      className="w-6 h-6 flex items-center justify-center text-[15px] leading-none text-[#5A5A5A] hover:text-[#1A1A1A] transition-colors disabled:opacity-40"
    >
      +
    </button>
  </div>
);

/** "JUMLAH" style column caption. */
export const ColumnLabel: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className = '',
}) => (
  <Serif bold className={`text-[12px] sm:text-[13px] tracking-[0.06em] uppercase text-[#1A1A1A] ${className}`}>
    {children}
  </Serif>
);

/** Price rendered in the reference's "RP.890.000" form. */
export function formatRp(value: number): string {
  return `RP.${new Intl.NumberFormat('id-ID').format(Math.round(value))}`;
}
