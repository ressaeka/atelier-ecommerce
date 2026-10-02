import { useCallback, useEffect, useRef, useState } from 'react';
import { api } from '../../lib/api';
import type { PaginationMeta, User } from '../../types/api';

export type AdminCustomer = User;

export interface AdminCustomersState {
  customers: AdminCustomer[];
  meta: PaginationMeta | null;
  isLoading: boolean;
  error: string | null;
  page: number;
  limit: number;
  search: string;
  /** Customers on current page after role filter */
  visibleCount: number;
  /** Total USER rows on current API page */
  filteredTotal: number;
  refetch: () => void;
  setPage: (page: number) => void;
  setSearch: (search: string) => void;
}

const DEFAULT_LIMIT = 10;

/**
 * Admin customer list via existing GET /users.
 * Backend returns all users; frontend displays only role === 'USER'.
 * Pagination comes from API meta — not fabricated client-side totals.
 */
export function useAdminCustomers(): AdminCustomersState {
  const [items, setItems] = useState<User[]>([]);
  const [meta, setMeta] = useState<PaginationMeta | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPageState] = useState(1);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearchQuery] = useState('');
  const limit = DEFAULT_LIMIT;
  const [reloadKey, setReloadKey] = useState(0);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setSearchQuery(searchInput.trim());
      setPageState(1);
    }, 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [searchInput]);

  const refetch = useCallback(() => {
    setReloadKey((k) => k + 1);
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setIsLoading(true);
      setError(null);
      try {
        const data = await api.get<{ items: User[]; meta: PaginationMeta }>(
          '/users',
          {
            page,
            limit,
            search: search || undefined,
          },
        );
        if (cancelled) return;
        setItems(Array.isArray(data?.items) ? data.items : []);
        setMeta(data?.meta ?? null);
      } catch (err) {
        if (cancelled) return;
        const message =
          err instanceof Error && err.message
            ? err.message
            : 'Gagal memuat pelanggan.';
        setError(message);
        setItems([]);
        setMeta(null);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [page, limit, search, reloadKey]);

  const customers = items.filter((user) => user.role === 'USER');

  return {
    customers,
    meta,
    isLoading,
    error,
    page,
    limit,
    search: searchInput,
    visibleCount: customers.length,
    filteredTotal: items.length,
    refetch,
    setPage: setPageState,
    setSearch: setSearchInput,
  };
}
