import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { api } from '../../lib/api';
import type {
  SalesReportPeriodType,
  SalesReportQuery,
  SalesReportResponse,
  SalesReportSortBy,
} from '../../types/api';

// Exported for backward compatibility with other report hooks/pages
export type ReportPreset =
  | 'today'
  | '7d'
  | '30d'
  | '1y'
  | 'this_month'
  | 'custom';

const WIB_OFFSET_MS = 7 * 60 * 60 * 1000;
const SEARCH_DEBOUNCE_MS = 350;
const CUSTOM_DATE_DEBOUNCE_MS = 250;
const MAX_CACHE_ENTRIES = 40;
const YMD_REGEX = /^\d{4}-\d{2}-\d{2}$/;

export function isValidYmdDate(value: string): boolean {
  if (!YMD_REGEX.test(value)) return false;
  const [y, m, d] = value.split('-').map(Number);
  if (!y || m < 1 || m > 12 || d < 1 || d > 31) return false;
  const dt = new Date(Date.UTC(y, m - 1, d));
  return (
    dt.getUTCFullYear() === y &&
    dt.getUTCMonth() === m - 1 &&
    dt.getUTCDate() === d
  );
}

export function getWibDateParts(now: Date = new Date()): {
  year: number;
  month: number;
  day: number;
  ymd: string;
} {
  const shifted = new Date(now.getTime() + WIB_OFFSET_MS);
  const year = shifted.getUTCFullYear();
  const month = shifted.getUTCMonth() + 1;
  const day = shifted.getUTCDate();
  const ymd = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  return { year, month, day, ymd };
}

function daysInMonth(year: number, month1Based: number): number {
  return new Date(Date.UTC(year, month1Based, 0)).getUTCDate();
}

export function computePeriodRangeWib(
  periodType: SalesReportPeriodType,
  month: number,
  year: number,
  customStart?: string,
  customEnd?: string,
): { startDate: string; endDate: string } {
  const { ymd: todayYmd } = getWibDateParts();

  if (periodType === 'today') {
    return { startDate: todayYmd, endDate: todayYmd };
  }

  if (periodType === 'monthly') {
    const lastDay = daysInMonth(year, month);
    const mStr = String(month).padStart(2, '0');
    return {
      startDate: `${year}-${mStr}-01`,
      endDate: `${year}-${mStr}-${String(lastDay).padStart(2, '0')}`,
    };
  }

  if (periodType === 'yearly') {
    return {
      startDate: `${year}-01-01`,
      endDate: `${year}-12-31`,
    };
  }

  return {
    startDate: customStart || todayYmd,
    endDate: customEnd || todayYmd,
  };
}

export function computePresetDates(preset: ReportPreset): {
  startDate: string;
  endDate: string;
} {
  const { year, month, day, ymd: todayYmd } = getWibDateParts();

  if (preset === 'today') {
    return { startDate: todayYmd, endDate: todayYmd };
  }

  if (preset === '7d') {
    const past7 = new Date(
      Date.UTC(year, month - 1, day) - 6 * 24 * 60 * 60 * 1000,
    );
    const y = past7.getUTCFullYear();
    const m = String(past7.getUTCMonth() + 1).padStart(2, '0');
    const d = String(past7.getUTCDate()).padStart(2, '0');
    return { startDate: `${y}-${m}-${d}`, endDate: todayYmd };
  }

  if (preset === '1y') {
    const pastYear = new Date(
      Date.UTC(year, month - 1, day) - 364 * 24 * 60 * 60 * 1000,
    );
    const y = pastYear.getUTCFullYear();
    const m = String(pastYear.getUTCMonth() + 1).padStart(2, '0');
    const d = String(pastYear.getUTCDate()).padStart(2, '0');
    return { startDate: `${y}-${m}-${d}`, endDate: todayYmd };
  }

  if (preset === 'this_month') {
    const mStr = String(month).padStart(2, '0');
    return { startDate: `${year}-${mStr}-01`, endDate: todayYmd };
  }

  const past30 = new Date(
    Date.UTC(year, month - 1, day) - 29 * 24 * 60 * 60 * 1000,
  );
  const y = past30.getUTCFullYear();
  const m = String(past30.getUTCMonth() + 1).padStart(2, '0');
  const d = String(past30.getUTCDate()).padStart(2, '0');
  return { startDate: `${y}-${m}-${d}`, endDate: todayYmd };
}

interface CommittedPeriodState {
  periodType: SalesReportPeriodType;
  month: number;
  year: number;
  startDate: string;
  endDate: string;
}

function buildQueryKey(params: SalesReportQuery): string {
  return JSON.stringify({
    periodType: params.periodType,
    month: params.month ?? null,
    year: params.year ?? null,
    startDate: params.startDate ?? '',
    endDate: params.endDate ?? '',
    status: params.status ?? 'ALL',
    search: params.search ?? '',
    sortBy: params.sortBy ?? 'createdAt',
    sortOrder: params.sortOrder ?? 'desc',
    page: params.page ?? 1,
    limit: params.limit ?? 10,
  });
}

function formatNowWibTime(): string {
  const nowShifted = new Date(Date.now() + WIB_OFFSET_MS);
  const hh = String(nowShifted.getUTCHours()).padStart(2, '0');
  const mm = String(nowShifted.getUTCMinutes()).padStart(2, '0');
  return `${hh}.${mm} WIB`;
}

export function useAdminSalesReport() {
  const initialWib = useMemo(() => getWibDateParts(), []);
  const initialRange = useMemo(() => computePresetDates('30d'), []);

  // UI state for filter controls (instant response)
  const [periodType, setPeriodTypeState] =
    useState<SalesReportPeriodType>('custom');
  const [month, setMonthState] = useState<number>(initialWib.month);
  const [year, setYearState] = useState<number>(initialWib.year);
  const [startDate, setStartDateState] = useState<string>(
    initialRange.startDate,
  );
  const [endDate, setEndDateState] = useState<string>(
    initialRange.endDate,
  );

  // Committed period state that drives API queries (avoids double requests on custom dates)
  const [committedPeriod, setCommittedPeriod] = useState<CommittedPeriodState>({
    periodType: 'custom',
    month: initialWib.month,
    year: initialWib.year,
    startDate: initialRange.startDate,
    endDate: initialRange.endDate,
  });

  const [statusFilter, setStatusFilterState] = useState<string>('ALL');
  const [search, setSearchState] = useState<string>('');
  const [debouncedSearch, setDebouncedSearch] = useState<string>('');
  const [sortBy, setSortByState] = useState<SalesReportSortBy>('createdAt');
  const [sortOrder, setSortOrderState] = useState<'asc' | 'desc'>('desc');
  const [page, setPageState] = useState<number>(1);
  const [limit] = useState<number>(10);

  const [data, setData] = useState<SalesReportResponse | null>(null);
  const [isInitialLoading, setIsInitialLoading] = useState<boolean>(true);
  const [isFetching, setIsFetching] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState<number>(0);
  const [lastUpdatedWib, setLastUpdatedWib] = useState<string>('');

  // Refs for stable callbacks, request cancellation, and in-memory caching
  const monthRef = useRef<number>(month);
  monthRef.current = month;
  const yearRef = useRef<number>(year);
  yearRef.current = year;
  const periodTypeRef = useRef<SalesReportPeriodType>(periodType);
  periodTypeRef.current = periodType;
  const startDateRef = useRef<string>(startDate);
  startDateRef.current = startDate;
  const endDateRef = useRef<string>(endDate);
  endDateRef.current = endDate;
  const searchRef = useRef<string>(search);
  searchRef.current = search;
  const debouncedSearchRef = useRef<string>(debouncedSearch);
  debouncedSearchRef.current = debouncedSearch;
  const hasDataRef = useRef<boolean>(false);
  hasDataRef.current = data !== null;

  const customDatesDirtyRef = useRef<boolean>(false);
  const searchTimerRef = useRef<number | null>(null);
  const customDateTimerRef = useRef<number | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const cacheRef = useRef<Map<string, SalesReportResponse>>(new Map());
  const activeQueryKeyRef = useRef<string>('');
  const lastReloadKeyRef = useRef<number>(0);

  const flushPendingSearch = useCallback(() => {
    if (searchTimerRef.current !== null) {
      window.clearTimeout(searchTimerRef.current);
      searchTimerRef.current = null;
    }
    const trimmed = searchRef.current.trim();
    if (trimmed !== debouncedSearchRef.current) {
      debouncedSearchRef.current = trimmed;
      setDebouncedSearch(trimmed);
    }
  }, []);

  // Debounce search input so typing does not fire an API call on every keystroke
  useEffect(() => {
    const trimmed = search.trim();
    if (trimmed === debouncedSearch) {
      return;
    }

    searchTimerRef.current = window.setTimeout(() => {
      searchTimerRef.current = null;
      debouncedSearchRef.current = trimmed;
      setDebouncedSearch(trimmed);
      setPageState(1);
    }, SEARCH_DEBOUNCE_MS);

    return () => {
      if (searchTimerRef.current !== null) {
        window.clearTimeout(searchTimerRef.current);
        searchTimerRef.current = null;
      }
    };
  }, [search, debouncedSearch]);

  // Debounce custom date range commits so changing startDate then endDate only triggers 1 request
  useEffect(() => {
    if (periodType !== 'custom' || !customDatesDirtyRef.current) {
      if (customDateTimerRef.current !== null) {
        window.clearTimeout(customDateTimerRef.current);
        customDateTimerRef.current = null;
      }
      return;
    }

    // Do not fire API if either custom date is still empty or incomplete
    if (!startDate || !endDate) {
      return;
    }

    if (!isValidYmdDate(startDate) || !isValidYmdDate(endDate)) {
      return;
    }

    if (startDate > endDate) {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        abortControllerRef.current = null;
      }
      setError('Tanggal awal tidak boleh lebih besar dari tanggal akhir.');
      setIsInitialLoading(false);
      setIsFetching(false);
      return;
    }

    setError(null);

    if (
      committedPeriod.startDate === startDate &&
      committedPeriod.endDate === endDate &&
      committedPeriod.periodType === 'custom'
    ) {
      return;
    }

    customDateTimerRef.current = window.setTimeout(() => {
      customDatesDirtyRef.current = false;
      setCommittedPeriod({
        periodType: 'custom',
        month: monthRef.current,
        year: yearRef.current,
        startDate,
        endDate,
      });
      setPageState(1);
    }, CUSTOM_DATE_DEBOUNCE_MS);

    return () => {
      if (customDateTimerRef.current !== null) {
        window.clearTimeout(customDateTimerRef.current);
        customDateTimerRef.current = null;
      }
    };
  }, [
    periodType,
    startDate,
    endDate,
    committedPeriod.startDate,
    committedPeriod.endDate,
    committedPeriod.periodType,
  ]);

  const refetch = useCallback(() => {
    flushPendingSearch();
    setReloadKey((k) => k + 1);
  }, [flushPendingSearch]);

  const selectPeriodType = useCallback(
    (newType: SalesReportPeriodType) => {
      if (customDateTimerRef.current !== null) {
        window.clearTimeout(customDateTimerRef.current);
        customDateTimerRef.current = null;
      }
      customDatesDirtyRef.current = false;
      flushPendingSearch();
      setPeriodTypeState(newType);
      setError(null);
      if (newType !== 'custom') {
        const range = computePeriodRangeWib(
          newType,
          monthRef.current,
          yearRef.current,
        );
        setStartDateState(range.startDate);
        setEndDateState(range.endDate);
        setCommittedPeriod({
          periodType: newType,
          month: monthRef.current,
          year: yearRef.current,
          startDate: range.startDate,
          endDate: range.endDate,
        });
        setPageState(1);
      }
    },
    [flushPendingSearch],
  );

  const selectMonth = useCallback(
    (newMonth: number) => {
      customDatesDirtyRef.current = false;
      flushPendingSearch();
      setMonthState(newMonth);
      setPeriodTypeState('monthly');
      setError(null);
      const range = computePeriodRangeWib('monthly', newMonth, yearRef.current);
      setStartDateState(range.startDate);
      setEndDateState(range.endDate);
      setCommittedPeriod({
        periodType: 'monthly',
        month: newMonth,
        year: yearRef.current,
        startDate: range.startDate,
        endDate: range.endDate,
      });
      setPageState(1);
    },
    [flushPendingSearch],
  );

  const selectYear = useCallback(
    (newYear: number) => {
      customDatesDirtyRef.current = false;
      flushPendingSearch();
      setYearState(newYear);
      setError(null);
      const currentType = periodTypeRef.current;
      const targetType: SalesReportPeriodType =
        currentType === 'monthly' ? 'monthly' : 'yearly';
      if (currentType !== 'monthly' && currentType !== 'yearly') {
        setPeriodTypeState('yearly');
      }
      const range = computePeriodRangeWib(
        targetType,
        monthRef.current,
        newYear,
      );
      setStartDateState(range.startDate);
      setEndDateState(range.endDate);
      setCommittedPeriod({
        periodType: targetType,
        month: monthRef.current,
        year: newYear,
        startDate: range.startDate,
        endDate: range.endDate,
      });
      setPageState(1);
    },
    [flushPendingSearch],
  );

  const setCustomStartDate = useCallback((dateStr: string) => {
    customDatesDirtyRef.current = true;
    setPeriodTypeState('custom');
    setStartDateState(dateStr);
  }, []);

  const setCustomEndDate = useCallback((dateStr: string) => {
    customDatesDirtyRef.current = true;
    setPeriodTypeState('custom');
    setEndDateState(dateStr);
  }, []);

  const applyCustomDateRange = useCallback(
    (newStart?: string, newEnd?: string) => {
      if (customDateTimerRef.current !== null) {
        window.clearTimeout(customDateTimerRef.current);
        customDateTimerRef.current = null;
      }
      customDatesDirtyRef.current = false;
      flushPendingSearch();
      const resolvedStart = newStart ?? startDateRef.current;
      const resolvedEnd = newEnd ?? endDateRef.current;
      setPeriodTypeState('custom');
      setStartDateState(resolvedStart);
      setEndDateState(resolvedEnd);

      if (!resolvedStart || !resolvedEnd) {
        setError('Silakan pilih tanggal awal dan tanggal akhir.');
        return;
      }
      if (!isValidYmdDate(resolvedStart) || !isValidYmdDate(resolvedEnd)) {
        setError('Format tanggal tidak valid (gunakan YYYY-MM-DD).');
        return;
      }
      if (resolvedStart > resolvedEnd) {
        setError('Tanggal awal tidak boleh lebih besar dari tanggal akhir.');
        return;
      }

      setError(null);
      setCommittedPeriod({
        periodType: 'custom',
        month: monthRef.current,
        year: yearRef.current,
        startDate: resolvedStart,
        endDate: resolvedEnd,
      });
      setPageState(1);
    },
    [flushPendingSearch],
  );

  const handleStatusChange = useCallback(
    (newStatus: string) => {
      flushPendingSearch();
      setStatusFilterState(newStatus);
      setPageState(1);
    },
    [flushPendingSearch],
  );

  const handleSearchChange = useCallback((newSearch: string) => {
    searchRef.current = newSearch;
    setSearchState(newSearch);
  }, []);

  const handleSortChange = useCallback(
    (field: SalesReportSortBy) => {
      flushPendingSearch();
      setSortByState((prevField) => {
        if (prevField === field) {
          setSortOrderState((prevOrder) =>
            prevOrder === 'desc' ? 'asc' : 'desc',
          );
          return prevField;
        }
        setSortOrderState('desc');
        return field;
      });
      setPageState(1);
    },
    [flushPendingSearch],
  );

  const setPage = useCallback(
    (nextPage: number) => {
      flushPendingSearch();
      setPageState(nextPage);
    },
    [flushPendingSearch],
  );

  useEffect(() => {
    const {
      periodType: cPeriodType,
      month: cMonth,
      year: cYear,
      startDate: cStartDate,
      endDate: cEndDate,
    } = committedPeriod;

    if (!cStartDate || !cEndDate) {
      return;
    }

    if (!isValidYmdDate(cStartDate) || !isValidYmdDate(cEndDate)) {
      return;
    }

    if (cStartDate > cEndDate) {
      setError('Tanggal awal tidak boleh lebih besar dari tanggal akhir.');
      setIsInitialLoading(false);
      setIsFetching(false);
      return;
    }

    const queryParams: SalesReportQuery = {
      periodType: cPeriodType,
      month: cPeriodType === 'monthly' ? cMonth : undefined,
      year:
        cPeriodType === 'monthly' || cPeriodType === 'yearly'
          ? cYear
          : undefined,
      startDate: cStartDate,
      endDate: cEndDate,
      status: statusFilter,
      search: debouncedSearch || undefined,
      sortBy,
      sortOrder,
      page,
      limit,
    };

    const queryKey = buildQueryKey(queryParams);
    const isManualReload = reloadKey !== lastReloadKeyRef.current;
    lastReloadKeyRef.current = reloadKey;

    // Deduplicate if queryKey is already the active displayed key and not manually reloaded
    if (!isManualReload && queryKey === activeQueryKeyRef.current) {
      return;
    }

    // Serve immediately from in-memory cache if available (instant filter switch, 0 flicker)
    const cachedResponse = cacheRef.current.get(queryKey);
    if (!isManualReload && cachedResponse) {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        abortControllerRef.current = null;
      }
      activeQueryKeyRef.current = queryKey;
      setData(cachedResponse);
      setError(null);
      setIsInitialLoading(false);
      setIsFetching(false);
      return;
    }

    // Abort any previous in-flight request before starting the new one
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;

    async function fetchReport() {
      if (!hasDataRef.current) {
        setIsInitialLoading(true);
      }
      setIsFetching(true);
      setError(null);

      try {
        const res = await api.get<SalesReportResponse>(
          '/admin/reports/sales',
          queryParams as unknown as Record<
            string,
            string | number | boolean | undefined
          >,
          { signal: controller.signal },
        );

        if (controller.signal.aborted) return;

        if (cacheRef.current.size >= MAX_CACHE_ENTRIES) {
          const oldestKey = cacheRef.current.keys().next().value;
          if (oldestKey) {
            cacheRef.current.delete(oldestKey);
          }
        }
        cacheRef.current.set(queryKey, res);
        activeQueryKeyRef.current = queryKey;

        setData(res);
        setLastUpdatedWib(formatNowWibTime());
      } catch (err: unknown) {
        if (controller.signal.aborted) return;
        const msg =
          err instanceof Error
            ? err.message
            : 'Terjadi kendala saat memuat laporan penjualan.';
        setError(msg);
      } finally {
        if (!controller.signal.aborted) {
          setIsInitialLoading(false);
          setIsFetching(false);
        }
      }
    }

    void fetchReport();

    return () => {
      controller.abort();
    };
  }, [
    committedPeriod,
    statusFilter,
    debouncedSearch,
    sortBy,
    sortOrder,
    page,
    limit,
    reloadKey,
  ]);

  return {
    data,
    // isLoading is true ONLY during initial page load when data is null
    isLoading: isInitialLoading,
    // isFetching is true during any active network request (initial or background filter update)
    isFetching,
    isRefreshing: isFetching && data !== null,
    error,
    periodType,
    month,
    year,
    startDate,
    endDate,
    statusFilter,
    search,
    debouncedSearch,
    sortBy,
    sortOrder,
    page,
    limit,
    lastUpdatedWib,
    selectPeriodType,
    selectMonth,
    selectYear,
    setStartDate: setCustomStartDate,
    setEndDate: setCustomEndDate,
    applyCustomDateRange,
    setStatusFilter: handleStatusChange,
    setSearch: handleSearchChange,
    handleSortChange,
    setPage,
    refetch,
  };
}
