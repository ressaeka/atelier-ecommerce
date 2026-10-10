import { useCallback, useEffect, useState } from 'react';
import { api } from '../../lib/api';
import type {
  SalesReportQuery,
  SalesReportResponse,
} from '../../types/api';

export type ReportPreset = 'today' | '7d' | '30d' | 'this_month' | 'custom';

function formatYmd(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function computePresetDates(preset: ReportPreset): {
  startDate: string;
  endDate: string;
} {
  const now = new Date();
  const todayYmd = formatYmd(now);

  if (preset === 'today') {
    return { startDate: todayYmd, endDate: todayYmd };
  }

  if (preset === '7d') {
    const past7 = new Date(now.getTime() - 6 * 24 * 60 * 60 * 1000);
    return { startDate: formatYmd(past7), endDate: todayYmd };
  }

  if (preset === 'this_month') {
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
    return { startDate: formatYmd(firstDay), endDate: todayYmd };
  }

  // default '30d'
  const past30 = new Date(now.getTime() - 29 * 24 * 60 * 60 * 1000);
  return { startDate: formatYmd(past30), endDate: todayYmd };
}

export function useAdminSalesReport() {
  const initialDates = computePresetDates('30d');

  const [preset, setPreset] = useState<ReportPreset>('30d');
  const [startDate, setStartDateState] = useState<string>(initialDates.startDate);
  const [endDate, setEndDateState] = useState<string>(initialDates.endDate);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [search, setSearch] = useState<string>('');
  const [page, setPage] = useState<number>(1);
  const [limit] = useState<number>(10);

  const [data, setData] = useState<SalesReportResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState<number>(0);

  const refetch = useCallback(() => {
    setReloadKey((k) => k + 1);
  }, []);

  const setCustomStartDate = (dateStr: string) => {
    setPreset('custom');
    setStartDateState(dateStr);
    setPage(1);
  };

  const setCustomEndDate = (dateStr: string) => {
    setPreset('custom');
    setEndDateState(dateStr);
    setPage(1);
  };

  const applyPreset = (newPreset: ReportPreset) => {
    setPreset(newPreset);
    if (newPreset !== 'custom') {
      const dates = computePresetDates(newPreset);
      setStartDateState(dates.startDate);
      setEndDateState(dates.endDate);
    }
    setPage(1);
  };

  const handleStatusChange = (newStatus: string) => {
    setStatusFilter(newStatus);
    setPage(1);
  };

  const handleSearchChange = (newSearch: string) => {
    setSearch(newSearch);
    setPage(1);
  };

  useEffect(() => {
    let cancelled = false;

    // Validasi rentang tanggal sebelum request
    if (startDate && endDate && startDate > endDate) {
      setError('Tanggal mulai tidak boleh lebih besar dari tanggal akhir.');
      setIsLoading(false);
      return;
    }

    async function fetchReport() {
      setIsLoading(true);
      setError(null);

      try {
        const queryParams: SalesReportQuery = {
          startDate,
          endDate,
          status: statusFilter,
          search: search.trim() || undefined,
          page,
          limit,
        };

        const res = await api.get<SalesReportResponse>(
          '/admin/reports/sales',
          queryParams as unknown as Record<string, string | number | boolean | undefined>,
        );

        if (cancelled) return;
        setData(res);
      } catch (err: unknown) {
        if (cancelled) return;
        const msg =
          err instanceof Error
            ? err.message
            : 'Terjadi kendala saat memuat laporan penjualan.';
        setError(msg);
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    void fetchReport();

    return () => {
      cancelled = true;
    };
  }, [startDate, endDate, statusFilter, search, page, limit, reloadKey]);

  return {
    data,
    isLoading,
    error,
    preset,
    startDate,
    endDate,
    statusFilter,
    search,
    page,
    limit,
    applyPreset,
    setStartDate: setCustomStartDate,
    setEndDate: setCustomEndDate,
    setStatusFilter: handleStatusChange,
    setSearch: handleSearchChange,
    setPage,
    refetch,
  };
}
