import { useCallback, useEffect, useState } from 'react';
import { api, ApiRequestError } from '../../lib/api';
import { toAdminUiError } from '../lib/adminErrorCopy';
import type {
  AnalyticsFilterParams,
  AnalyticsOverviewResponse,
} from '../types/analytics';

export interface AdminAnalyticsState {
  data: AnalyticsOverviewResponse | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useAdminAnalyticsOverview(
  filter: AnalyticsFilterParams,
): AdminAnalyticsState {
  const [data, setData] = useState<AnalyticsOverviewResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  const refetch = useCallback(() => {
    setReloadKey((k) => k + 1);
  }, []);

  const { preset, startDate, endDate } = filter;

  useEffect(() => {
    if (preset === 'custom' && (!startDate || !endDate)) {
      return;
    }

    const controller = new AbortController();
    let cancelled = false;

    async function load() {
      // Clear stale period data immediately when filter changes
      setData(null);
      setIsLoading(true);
      setError(null);

      try {
        const params: Record<string, string> = { preset };
        if (preset === 'custom' && startDate && endDate) {
          params.startDate = startDate;
          params.endDate = endDate;
        }

        const response = await api.get<AnalyticsOverviewResponse>(
          '/admin/analytics/overview',
          params,
          { signal: controller.signal },
        );

        if (cancelled) return;
        setData(response);
      } catch (err) {
        if (cancelled || controller.signal.aborted) return;

        const rawMessage =
          err instanceof ApiRequestError
            ? err.message
            : err instanceof Error
              ? err.message
              : null;

        setError(
          toAdminUiError(
            rawMessage,
            'Gagal memuat Business Analytics. Silakan coba lagi.',
          ),
        );
        setData(null);
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    void load();

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [preset, startDate, endDate, reloadKey]);

  return {
    data,
    isLoading,
    error,
    refetch,
  };
}
