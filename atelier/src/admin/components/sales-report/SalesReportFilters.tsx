import { memo } from 'react';
import { Calendar, Search, X } from 'lucide-react';
import type { SalesReportPeriodType } from '../../../types/api';
import {
  MONTH_OPTIONS,
  PERIOD_MODES,
  STATUS_OPTIONS,
  YEAR_OPTIONS,
} from './salesReportUtils';

interface SalesReportFiltersProps {
  periodType: SalesReportPeriodType;
  month: number;
  year: number;
  startDate: string;
  endDate: string;
  statusFilter: string;
  search: string;
  periodLabel?: string;
  comparisonLabel?: string;
  onSelectPeriodType: (type: SalesReportPeriodType) => void;
  onSelectMonth: (month: number) => void;
  onSelectYear: (year: number) => void;
  onStartDateChange: (start: string) => void;
  onEndDateChange: (end: string) => void;
  onStatusFilterChange: (status: string) => void;
  onSearchChange: (search: string) => void;
}

export const SalesReportFilters = memo(function SalesReportFilters({
  periodType,
  month,
  year,
  startDate,
  endDate,
  statusFilter,
  search,
  periodLabel,
  comparisonLabel,
  onSelectPeriodType,
  onSelectMonth,
  onSelectYear,
  onStartDateChange,
  onEndDateChange,
  onStatusFilterChange,
  onSearchChange,
}: SalesReportFiltersProps) {
  return (
    <section
      aria-label="Filter Periode dan Transaksi"
      className="rounded-2xl border border-[#ECE7DE] bg-white p-4 shadow-[0_1px_3px_rgba(26,22,18,0.04)]"
    >
      <div className="flex flex-col gap-3.5 xl:flex-row xl:items-center xl:justify-between">
        {/* Left: Period Mode Switcher + Dynamic Period Selector */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div
            role="group"
            aria-label="Pilih mode periode laporan"
            className="inline-flex min-h-[40px] flex-wrap items-center rounded-xl border border-[#ECE7DE] bg-[#FAF8F4] p-1"
          >
            {PERIOD_MODES.map((m) => {
              const active = periodType === m.id;
              return (
                <button
                  key={m.id}
                  type="button"
                  aria-pressed={active}
                  onClick={() => onSelectPeriodType(m.id)}
                  className={`min-h-[32px] rounded-lg px-3.5 text-[12.5px] transition-colors ${
                    active
                      ? 'bg-[#5C4033] font-semibold text-white shadow-sm'
                      : 'font-medium text-[#3F3B36] hover:bg-white hover:text-[#1A1A1A]'
                  }`}
                >
                  {m.label}
                </button>
              );
            })}
          </div>

          {/* Dynamic Controls based on periodType */}
          {periodType === 'today' && (
            <div className="inline-flex min-h-[40px] items-center gap-2 rounded-xl border border-[#ECE7DE] bg-[#FAF8F4] px-3.5 text-[12.5px] font-medium text-[#1A1A1A]">
              <Calendar
                size={14}
                className="text-[#5C4033]"
                aria-hidden="true"
              />
              <span>{periodLabel ?? `Hari Ini (${startDate})`}</span>
              <span className="text-[11.5px] text-[#6F6A62]">
                · Asia/Jakarta (WIB)
              </span>
            </div>
          )}

          {periodType === 'monthly' && (
            <div className="flex flex-wrap items-center gap-2">
              <label className="sr-only" htmlFor="reportMonthSelect">
                Pilih Bulan
              </label>
              <select
                id="reportMonthSelect"
                value={month}
                onChange={(e) => onSelectMonth(Number(e.target.value))}
                className="h-10 rounded-xl border border-[#ECE7DE] bg-[#FAF8F4] px-3 text-[12.5px] font-semibold text-[#1A1A1A] focus:border-[#5C4033] focus:bg-white focus:outline-none"
              >
                {MONTH_OPTIONS.map((mOpt) => (
                  <option key={mOpt.value} value={mOpt.value}>
                    {mOpt.label}
                  </option>
                ))}
              </select>

              <label className="sr-only" htmlFor="reportMonthYearSelect">
                Pilih Tahun
              </label>
              <select
                id="reportMonthYearSelect"
                value={year}
                onChange={(e) => onSelectYear(Number(e.target.value))}
                className="h-10 rounded-xl border border-[#ECE7DE] bg-[#FAF8F4] px-3 text-[12.5px] font-semibold tabular-nums text-[#1A1A1A] focus:border-[#5C4033] focus:bg-white focus:outline-none"
              >
                {YEAR_OPTIONS.map((yOpt) => (
                  <option key={yOpt} value={yOpt}>
                    {yOpt}
                  </option>
                ))}
              </select>
            </div>
          )}

          {periodType === 'yearly' && (
            <div className="flex items-center gap-2">
              <label
                htmlFor="reportYearSelect"
                className="text-[12px] font-medium text-[#6F6A62]"
              >
                Tahun:
              </label>
              <select
                id="reportYearSelect"
                value={year}
                onChange={(e) => onSelectYear(Number(e.target.value))}
                className="h-10 rounded-xl border border-[#ECE7DE] bg-[#FAF8F4] px-3.5 text-[12.5px] font-semibold tabular-nums text-[#1A1A1A] focus:border-[#5C4033] focus:bg-white focus:outline-none"
              >
                {YEAR_OPTIONS.map((yOpt) => (
                  <option key={yOpt} value={yOpt}>
                    Tahun {yOpt}
                  </option>
                ))}
              </select>
            </div>
          )}

          {periodType === 'custom' && (
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-1.5">
                <label
                  htmlFor="customStartDate"
                  className="text-[11.5px] font-medium text-[#6F6A62]"
                >
                  Dari:
                </label>
                <input
                  id="customStartDate"
                  type="date"
                  value={startDate}
                  max={endDate || undefined}
                  onChange={(e) => onStartDateChange(e.target.value)}
                  className="h-10 rounded-xl border border-[#ECE7DE] bg-[#FAF8F4] px-3 text-[12.5px] font-medium tabular-nums text-[#1A1A1A] focus:border-[#5C4033] focus:bg-white focus:outline-none"
                />
              </div>
              <div className="flex items-center gap-1.5">
                <label
                  htmlFor="customEndDate"
                  className="text-[11.5px] font-medium text-[#6F6A62]"
                >
                  Sampai:
                </label>
                <input
                  id="customEndDate"
                  type="date"
                  value={endDate}
                  min={startDate || undefined}
                  onChange={(e) => onEndDateChange(e.target.value)}
                  className="h-10 rounded-xl border border-[#ECE7DE] bg-[#FAF8F4] px-3 text-[12.5px] font-medium tabular-nums text-[#1A1A1A] focus:border-[#5C4033] focus:bg-white focus:outline-none"
                />
              </div>
            </div>
          )}

          {comparisonLabel && (
            <span className="text-[12px] font-medium text-[#6F6A62]">
              {comparisonLabel}
            </span>
          )}
        </div>

        {/* Right: Status Filter + Search Input */}
        <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center">
          <div className="sm:w-[190px]">
            <label htmlFor="statusFilterSelect" className="sr-only">
              Filter Status Transaksi
            </label>
            <select
              id="statusFilterSelect"
              value={statusFilter}
              onChange={(e) => onStatusFilterChange(e.target.value)}
              className="h-10 w-full rounded-xl border border-[#ECE7DE] bg-[#FAF8F4] px-3 text-[12.5px] font-medium text-[#1A1A1A] focus:border-[#5C4033] focus:bg-white focus:outline-none"
            >
              {STATUS_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <div className="relative sm:w-[230px]">
            <label htmlFor="transactionSearchInput" className="sr-only">
              Cari Pelanggan atau Nomor Pesanan
            </label>
            <Search
              size={14}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#6F6A62]"
              aria-hidden="true"
            />
            <input
              id="transactionSearchInput"
              type="text"
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Cari pelanggan / #ATL..."
              autoComplete="off"
              className="h-10 w-full rounded-xl border border-[#ECE7DE] bg-[#FAF8F4] pl-8 pr-8 text-[12.5px] text-[#1A1A1A] placeholder:text-[#A39D93] focus:border-[#5C4033] focus:bg-white focus:outline-none"
            />
            {search.length > 0 && (
              <button
                type="button"
                onClick={() => onSearchChange('')}
                aria-label="Bersihkan pencarian"
                className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-md p-0.5 text-[#6F6A62] hover:bg-[#ECE7DE] hover:text-[#1A1A1A]"
              >
                <X size={13} aria-hidden="true" />
              </button>
            )}
          </div>
        </div>
      </div>
    </section>
  );
});
