import { useCallback, useEffect, useState } from 'react';
import { api } from '../../lib/api';
import type {
  CustomerReportQuery,
  CustomerReportResponse,
} from '../../types/api';
import {
  computePresetDates,
  type ReportPreset,
} from './useAdminSalesReport';

export type CustomerTypeFilter = 'all' | 'active' | 'inactive';
export type CustomerSortBy =
  | 'totalSpent'
  | 'totalOrders'
  | 'name'
  | 'registeredAt';

export function useAdminCustomerReport() {
  const initialDates = computePresetDates('30d');

  const [preset, setPreset] = useState<ReportPreset>('30d');
  const [startDate, setStartDateState] = useState<string>(initialDates.startDate);
  const [endDate, setEndDateState] = useState<string>(initialDates.endDate);
  const [customerType, setCustomerTypeState] =
    useState<CustomerTypeFilter>('all');
  const [search, setSearch] = useState<string>('');
  const [sortBy, setSortBy] = useState<CustomerSortBy>('totalSpent');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [page, setPage] = useState<number>(1);
  const [limit] = useState<number>(10);

  const [data, setData] = useState<CustomerReportResponse | null>(null);
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

  const setCustomerType = (type: CustomerTypeFilter) => {
    setCustomerTypeState(type);
    setPage(1);
  };

  const handleSearchChange = (newSearch: string) => {
    setSearch(newSearch);
    setPage(1);
  };

  const handleSortChange = (newSortBy: CustomerSortBy) => {
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
        const queryParams: CustomerReportQuery = {
          startDate,
          endDate,
          customerType,
          search: search.trim() || undefined,
          sortBy,
          sortOrder,
          page,
          limit,
        };

        const res = await api.get<CustomerReportResponse>(
          '/admin/reports/customers',
          queryParams as unknown as Record<
            string,
            string | number | boolean | undefined
          >,
        );

        if (cancelled) return;
        setData(res);
      } catch (err: unknown) {
        if (cancelled) return;
        const msg =
          err instanceof Error
            ? err.message
            : 'Terjadi kendala saat memuat laporan pelanggan.';
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
  }, [
    startDate,
    endDate,
    customerType,
    search,
    sortBy,
    sortOrder,
    page,
    limit,
    reloadKey,
  ]);

  return {
    data,
    isLoading,
    error,
    preset,
    startDate,
    endDate,
    customerType,
    search,
    sortBy,
    sortOrder,
    page,
    limit,
    applyPreset,
    setStartDate: setCustomStartDate,
    setEndDate: setCustomEndDate,
    setCustomerType,
    setSearch: handleSearchChange,
    handleSortChange,
    setPage,
    refetch,
  };
}
