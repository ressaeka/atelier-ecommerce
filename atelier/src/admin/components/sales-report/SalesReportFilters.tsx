import { memo } from 'react';
import { STATUS_OPTIONS } from './salesReportUtils';

interface SalesReportFiltersProps {
  statusFilter: string;
  onStatusFilterChange: (status: string) => void;
}

export const SalesReportFilters = memo(function SalesReportFilters({
  statusFilter,
  onStatusFilterChange,
}: SalesReportFiltersProps) {
  return (
    <div className="flex items-center">
      <label htmlFor="statusFilterSelect" className="sr-only">
        Filter status transaksi
      </label>
      <select
        id="statusFilterSelect"
        value={statusFilter}
        onChange={(event) => onStatusFilterChange(event.target.value)}
        className="h-10 w-[190px] max-w-full rounded-[10px] border border-[#ECE6E0] bg-white px-3 text-[13px] text-[#2A201D] focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[#5B3F36]"
      >
        {STATUS_OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
});
