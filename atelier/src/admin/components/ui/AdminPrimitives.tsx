import React from 'react';
import { Link } from 'react-router-dom';
import type { LucideIcon } from 'lucide-react';
import {
  ADMIN_ORDER_STATUS_META,
  type AdminOrderStatus,
} from '../../data/adminDashboardMockData';

const idNumberFormatter = new Intl.NumberFormat('id-ID');

export function formatPrice(value: number): string {
  return `Rp ${idNumberFormatter.format(Math.round(value))}`;
}

interface CardHeaderProps {
  id?: string;
  icon: LucideIcon;
  title: string;
  titleTo?: string;
  subtitle?: string;
  scope?: string;
  rightSlot?: React.ReactNode;
  className?: string;
}

export function ScopeLabel({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex items-center rounded-md border border-[#ECE7DE] bg-[#FAF8F4] px-2 py-0.5 font-sans text-[11px] font-medium text-[#6F6A62] ${className}`}
    >
      {children}
    </span>
  );
}

export function CardHeader({
  id,
  icon: Icon,
  title,
  titleTo,
  subtitle,
  scope,
  rightSlot,
  className = 'mb-4',
}: CardHeaderProps) {
  return (
    <header
      className={`flex items-start justify-between gap-2.5 ${className}`}
    >
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <div
          className="flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-[11px] bg-[#F4EFE8] text-[#5C4033]"
          aria-hidden="true"
        >
          <Icon className="h-[18px] w-[18px]" strokeWidth={1.75} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <h2
              id={id}
              className="font-editorial text-[19px] font-semibold leading-tight tracking-tight text-[#1A1A1A]"
            >
              {titleTo ? (
                <Link
                  to={titleTo}
                  className="rounded-sm transition-colors hover:text-[#5C4033] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5C4033]/40"
                >
                  {title}
                </Link>
              ) : (
                title
              )}
            </h2>
            {scope && <ScopeLabel>{scope}</ScopeLabel>}
          </div>
          {subtitle && (
            <p
              className="mt-0.5 truncate text-[12.5px] text-[#6F6A62]"
              title={subtitle}
            >
              {subtitle}
            </p>
          )}
        </div>
      </div>
      {rightSlot && <div className="shrink-0">{rightSlot}</div>}
    </header>
  );
}

interface CardFooterProps {
  left: React.ReactNode;
  right?: React.ReactNode;
  className?: string;
}

export function CardFooter({ left, right, className = 'mt-5' }: CardFooterProps) {
  return (
    <footer
      className={`flex items-center justify-between gap-3 border-t border-[#ECE7DE] pt-4 text-[12.5px] text-[#6F6A62] ${className}`}
    >
      <div>{left}</div>
      {right && <div>{right}</div>}
    </footer>
  );
}

const RANK_STYLES: Record<number, string> = {
  1: 'bg-[#5C4033] text-white',
  2: 'bg-[#9A7458] text-white',
  3: 'bg-[#C2A48A] text-white',
};

export function RankBadge({ rank }: { rank: number }) {
  return (
    <span
      className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full font-sans text-[11.5px] font-semibold tabular-nums ${
        RANK_STYLES[rank] ?? 'bg-[#F4EFE8] text-[#6F6A62]'
      }`}
      aria-label={`Peringkat ${rank}`}
    >
      {rank}
    </span>
  );
}

interface ProgressBarProps {
  value: number;
  colorClass?: string;
  colorHex?: string;
  className?: string;
}

export function ProgressBar({
  value,
  colorClass = 'bg-[#5C4033]',
  colorHex,
  className = '',
}: ProgressBarProps) {
  const clamped = Math.min(100, Math.max(3, value));
  return (
    <div
      className={`h-[5px] overflow-hidden rounded-full bg-[#F1ECE4] ${className}`}
      role="presentation"
    >
      <div
        className={`h-full rounded-full transition-all duration-500 ${
          colorHex ? '' : colorClass
        }`}
        style={{
          width: `${clamped}%`,
          ...(colorHex ? { backgroundColor: colorHex } : {}),
        }}
      />
    </div>
  );
}

export function StatusBadge({ status }: { status: AdminOrderStatus }) {
  const meta = ADMIN_ORDER_STATUS_META[status] ?? {
    className: 'bg-[#FBF1E1] text-[#9A5B14]',
    dotClassName: 'bg-[#9A5B14]',
  };
  return (
    <span
      className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 font-sans text-[12.5px] font-semibold ${meta.className}`}
    >
      <span
        className={`h-1.5 w-1.5 rounded-full ${meta.dotClassName}`}
        aria-hidden="true"
      />
      {status}
    </span>
  );
}
