import { useRef, useState } from 'react';
import type { KeyboardEvent } from 'react';
import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import {
  CalendarDays,
  ChevronDown,
  Download,
  FileSpreadsheet,
  FileText,
  RefreshCw,
} from 'lucide-react';
import type { AnalyticsPreset } from '../types/analytics';

export interface ReportExportAction {
  format: 'csv' | 'pdf' | 'excel';
  label: string;
  onClick: () => void;
  disabled?: boolean;
  busy?: boolean;
}

interface ReportPageHeaderProps {
  title: string;
  subtitle: string;
  onRefresh: () => void;
  isRefreshing: boolean;
  exportActions: ReportExportAction[];
}

export function ReportPageHeader({
  title,
  subtitle,
  onRefresh,
  isRefreshing,
  exportActions,
}: ReportPageHeaderProps) {
  const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);
  const exportButtonRef = useRef<HTMLButtonElement>(null);

  return (
    <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        <nav
          aria-label="Breadcrumb"
          className="flex items-center gap-1.5 text-breadcrumb text-[#8B7F79]"
        >
          <Link
            to="/admin/reports"
            className="transition-colors hover:text-[#5B3F36] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#5B3F36]"
          >
            Laporan
          </Link>
          <span aria-hidden="true">/</span>
          <span className="font-medium text-[#8B7F79]">{title}</span>
        </nav>
        <h1 className="mt-1 text-page-title font-semibold leading-tight tracking-[-0.02em] text-[#2A201D]">
          {title}
        </h1>
        <p className="mt-1 truncate text-subtitle text-[#8B7F79]">
          {subtitle}
        </p>
      </div>

      <div className="flex shrink-0 items-center gap-2">
        <button
          type="button"
          onClick={onRefresh}
          disabled={isRefreshing}
          aria-label="Muat ulang"
          title="Muat ulang"
          className="inline-flex h-10 w-10 items-center justify-center rounded-[10px] border border-[#ECE6E0] bg-white text-[#5B3F36] transition-colors hover:bg-[#F4EFEA] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#5B3F36] disabled:cursor-not-allowed disabled:opacity-50"
        >
          <RefreshCw
            size={16}
            className={isRefreshing ? 'animate-spin' : undefined}
            aria-hidden="true"
          />
        </button>

        <div
          className="relative"
          onKeyDown={(event) => {
            if (event.key === 'Escape' && isExportMenuOpen) {
              setIsExportMenuOpen(false);
              exportButtonRef.current?.focus();
            }
          }}
        >
          <button
            ref={exportButtonRef}
            type="button"
            onClick={() => setIsExportMenuOpen((open) => !open)}
            aria-haspopup="menu"
            aria-expanded={isExportMenuOpen}
            aria-controls="report-export-menu"
            className="inline-flex h-10 items-center gap-2 rounded-[10px] bg-[#5B3F36] px-4 text-control font-medium text-white transition-colors hover:bg-[#4A332C] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#5B3F36]"
          >
            <Download size={15} aria-hidden="true" />
            <span>Ekspor</span>
            <ChevronDown size={14} aria-hidden="true" />
          </button>

          {isExportMenuOpen && (
            <div
              id="report-export-menu"
              role="menu"
              aria-label="Format ekspor"
              className="absolute right-0 z-30 mt-2 w-48 rounded-xl border border-[#ECE6E0] bg-white p-1 shadow-lg shadow-[#2A201D]/5"
            >
              {exportActions.map((action) => {
                const Icon =
                  action.format === 'pdf'
                    ? FileText
                    : action.format === 'excel'
                      ? FileSpreadsheet
                      : Download;

                return (
                  <button
                    key={action.format}
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      setIsExportMenuOpen(false);
                      action.onClick();
                    }}
                    disabled={action.disabled}
                    className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-control text-[#2A201D] hover:bg-[#F4EFEA] focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[#5B3F36] disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    {action.busy ? (
                      <RefreshCw
                        size={14}
                        className="animate-spin"
                        aria-hidden="true"
                      />
                    ) : (
                      <Icon size={14} aria-hidden="true" />
                    )}
                    {action.label}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

interface PeriodFilterProps {
  activePreset: string;
  startDate: string;
  endDate: string;
  rangeStartDate?: string;
  rangeEndDate?: string;
  rightContent?: ReactNode;
  onPresetChange: (preset: AnalyticsPreset) => void;
  onApplyCustom: (startDate: string, endDate: string) => void;
}

const PRESETS: Array<{ id: AnalyticsPreset; label: string }> = [
  { id: '7d', label: '7 hari' },
  { id: '30d', label: '30 hari' },
  { id: '1y', label: '1 tahun' },
  { id: 'custom', label: 'Kustom' },
];

const shortDateFormatter = new Intl.DateTimeFormat('id-ID', {
  day: '2-digit',
  month: 'short',
});

function formatShortDate(value: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(value);
  if (!match) return value;
  return shortDateFormatter.format(
    new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3])),
  );
}

function formatDateRange(startDate: string, endDate: string): string {
  if (!startDate || !endDate) return 'Rentang tanggal belum tersedia';

  const startYear = Number(startDate.slice(0, 4));
  const endYear = Number(endDate.slice(0, 4));
  const startLabel = formatShortDate(startDate);
  const endLabel = formatShortDate(endDate);

  if (!startYear || !endYear) {
    return `${startDate} sampai ${endDate}`;
  }

  return startYear === endYear
    ? `${startLabel} sampai ${endLabel} ${endYear}`
    : `${startLabel} ${startYear} sampai ${endLabel} ${endYear}`;
}

export function PeriodFilter({
  activePreset,
  startDate,
  endDate,
  rangeStartDate = startDate,
  rangeEndDate = endDate,
  rightContent,
  onPresetChange,
  onApplyCustom,
}: PeriodFilterProps) {
  const [isCustomOpen, setIsCustomOpen] = useState(false);
  const [draftStart, setDraftStart] = useState('');
  const [draftEnd, setDraftEnd] = useState('');
  const optionRefs = useRef<Array<HTMLButtonElement | null>>([]);

  const invalidRange = Boolean(draftStart && draftEnd && draftEnd < draftStart);
  const rangeLabel = formatDateRange(rangeStartDate, rangeEndDate);

  const selectPreset = (preset: AnalyticsPreset) => {
    if (preset === 'custom') {
      setDraftStart(startDate || rangeStartDate);
      setDraftEnd(endDate || rangeEndDate);
      setIsCustomOpen(true);
      return;
    }

    setIsCustomOpen(false);
    onPresetChange(preset);
  };

  const handleRadioKeyDown = (
    event: KeyboardEvent<HTMLButtonElement>,
    index: number,
  ) => {
    let nextIndex = index;
    if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
      nextIndex = (index + 1) % PRESETS.length;
    } else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
      nextIndex = (index - 1 + PRESETS.length) % PRESETS.length;
    } else if (event.key === 'Home') {
      nextIndex = 0;
    } else if (event.key === 'End') {
      nextIndex = PRESETS.length - 1;
    } else {
      return;
    }

    event.preventDefault();
    optionRefs.current[nextIndex]?.focus();
    selectPreset(PRESETS[nextIndex].id);
  };

  return (
    <section
      aria-label="Filter periode"
      className="!mt-7 !mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
    >
      <div className="relative w-fit max-w-full">
        <div
          role="radiogroup"
          aria-label="Pilih periode"
          className="flex max-w-full items-center gap-1 overflow-x-auto rounded-xl border border-[#ECE6E0] bg-white p-1"
        >
          {PRESETS.map((preset, index) => {
            const checked =
              activePreset === preset.id ||
              (isCustomOpen && preset.id === 'custom');
            return (
              <button
                key={preset.id}
                ref={(element) => {
                  optionRefs.current[index] = element;
                }}
                type="button"
                role="radio"
                aria-checked={checked}
                aria-haspopup={preset.id === 'custom' ? 'dialog' : undefined}
                aria-expanded={
                  preset.id === 'custom' ? isCustomOpen : undefined
                }
                tabIndex={checked ? 0 : -1}
                onClick={() => selectPreset(preset.id)}
                onKeyDown={(event) => handleRadioKeyDown(event, index)}
                className={`shrink-0 rounded-[9px] px-4 py-[7px] text-control font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[#5B3F36] ${
                  checked
                    ? 'bg-[#5B3F36] text-white'
                    : 'text-[#8B7F79] hover:bg-[#F4EFEA] hover:text-[#2A201D]'
                }`}
              >
                {preset.label}
              </button>
            );
          })}
        </div>

        {isCustomOpen && (
          <div
            role="dialog"
            aria-label="Pilih rentang tanggal kustom"
            className="absolute left-0 top-full z-30 mt-2 w-[300px] max-w-[calc(100vw-2rem)] rounded-xl border border-[#ECE6E0] bg-white p-4 shadow-lg shadow-[#2A201D]/5"
          >
            <div className="grid grid-cols-2 gap-3">
              <label className="min-w-0 text-label font-medium text-[#8B7F79]">
                Dari
                <input
                  type="date"
                  value={draftStart}
                  max={draftEnd || undefined}
                  onChange={(event) => setDraftStart(event.target.value)}
                  className="mt-1.5 h-10 w-full rounded-[10px] border border-[#ECE6E0] bg-white px-2 text-label text-[#2A201D] focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[#5B3F36]"
                />
              </label>
              <label className="min-w-0 text-label font-medium text-[#8B7F79]">
                Sampai
                <input
                  type="date"
                  value={draftEnd}
                  min={draftStart || undefined}
                  onChange={(event) => setDraftEnd(event.target.value)}
                  className="mt-1.5 h-10 w-full rounded-[10px] border border-[#ECE6E0] bg-white px-2 text-label text-[#2A201D] focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[#5B3F36]"
                />
              </label>
            </div>
            {invalidRange && (
              <p role="alert" className="mt-2 text-label text-red-600">
                Tanggal akhir tidak boleh sebelum tanggal awal.
              </p>
            )}
            <div className="mt-4 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setIsCustomOpen(false)}
                className="rounded-md px-2 py-1.5 text-control font-medium text-[#8B7F79] hover:text-[#2A201D] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#5B3F36]"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => {
                  if (!draftStart || !draftEnd || invalidRange) return;
                  onApplyCustom(draftStart, draftEnd);
                  setIsCustomOpen(false);
                }}
                disabled={!draftStart || !draftEnd || invalidRange}
                className="rounded-[10px] bg-[#5B3F36] px-4 py-2 text-control font-medium text-white transition-colors hover:bg-[#4A332C] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#5B3F36] disabled:cursor-not-allowed disabled:opacity-40"
              >
                Terapkan
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-2 sm:justify-end">
        <div className="flex items-center gap-2 text-table text-[#8B7F79]">
          <CalendarDays size={15} aria-hidden="true" />
          <span className="tabular-nums">{rangeLabel}</span>
        </div>
        {rightContent}
      </div>
    </section>
  );
}
