import { useCallback, useEffect, useState } from 'react';
import { api } from '../../lib/api';
import type {
  BestSellingQuery,
  BestSellingResponse,
} from '../../types/api';
import {
  computePresetDates,
  type ReportPreset,
} from './useAdminSalesReport';

export function useAdminBestSellingProducts() {
  const initialDates = computePresetDates('30d');

  const [preset, setPreset] = useState<ReportPreset>('30d');
  const [startDate, setStartDateState] = useState<string>(initialDates.startDate);
  const [endDate, setEndDateState] = useState<string>(initialDates.endDate);
  const [search, setSearch] = useState<string>('');
  const [sortBy, setSortBy] = useState<'sold' | 'revenue' | 'orderCount'>('sold');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [page, setPage] = useState<number>(1);
  const [limit] = useState<number>(10);

  const [data, setData] = useState<BestSellingResponse | null>(null);
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

  const handleSearchChange = (newSearch: string) => {
    setSearch(newSearch);
    setPage(1);
  };

  const handleSortChange = (newSortBy: 'sold' | 'revenue' | 'orderCount') => {
    if (sortBy === newSortBy) {
      setSortOrder((prev) => (prev === 'desc' ? 'asc' : 'desc'));
    } else {
      setSortBy(newSortBy);
      setSortOrder('desc');
    }
    setPage(1);
  };

  useEffect(() => {
    let cancelled = false;

    if (startDate && endDate && startDate > endDate) {
      setError('Tanggal mulai tidak boleh lebih besar dari tanggal akhir.');
      setIsLoading(false);
      return;
    }

    async function fetchReport() {
      setIsLoading(true);
      setError(null);

      try {
        const queryParams: BestSellingQuery = {
          startDate,
          endDate,
          search: search.trim() || undefined,
          sortBy,
          sortOrder,
          page,
          limit,
        };

        const res = await api.get<BestSellingResponse>(
          '/admin/reports/best-selling-products',
          queryParams as unknown as Record<string, string | number | boolean | undefined>,
        );

        if (cancelled) return;
        setData(res);
      } catch (err: unknown) {
        if (cancelled) return;
        const msg =
          err instanceof Error
            ? err.message
            : 'Terjadi kendala saat memuat laporan produk terlaris.';
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
  }, [startDate, endDate, search, sortBy, sortOrder, page, limit, reloadKey]);

  return {
    data,
    isLoading,
    error,
    preset,
    startDate,
    endDate,
    search,
    sortBy,
    sortOrder,
    page,
    limit,
    applyPreset,
    setStartDate: setCustomStartDate,
    setEndDate: setCustomEndDate,
    setSearch: handleSearchChange,
    handleSortChange,
    setPage,
    refetch,
  };
}
