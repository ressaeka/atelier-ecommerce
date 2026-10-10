import { useEffect, useRef, useState } from 'react';
import { api } from '../../lib/api';
import type { Order, PaginationMeta, Product, User } from '../../types/api';

export interface GlobalSearchResults {
  products: Product[];
  orders: Order[];
  customers: User[];
}

export interface UseAdminGlobalSearchReturn {
  query: string;
  debouncedQuery: string;
  results: GlobalSearchResults;
  isLoading: boolean;
  error: string | null;
  hasQuery: boolean;
}

export function useAdminGlobalSearch(query: string): UseAdminGlobalSearchReturn {
  const trimmed = query.trim();
  const hasQuery = trimmed.length >= 2;
  const [debouncedQuery, setDebouncedQuery] = useState(trimmed);
  const [results, setResults] = useState<GlobalSearchResults>({ products: [], orders: [], customers: [] });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const requestIdRef = useRef(0);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => setDebouncedQuery(trimmed), 300);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [trimmed]);

  useEffect(() => {
    if (!hasQuery || debouncedQuery.length < 2) {
      setResults({ products: [], orders: [], customers: [] });
      setIsLoading(false);
      setError(null);
      return;
    }
    const currentId = ++requestIdRef.current;
    let cancelled = false;
    setIsLoading(true);
    setError(null);

    const fetchAll = async () => {
      const productsRaw = api.get<{ items: Product[]; meta: PaginationMeta }>('/product', { search: debouncedQuery, page: 1, limit: 5 }).then((r) => r.items);
      const ordersRaw = api.get<{ data: Order[]; meta: PaginationMeta }>('/order', { search: debouncedQuery, page: 1, limit: 5, sortBy: 'createdAt', sortOrder: 'desc' }).then((r) => r.data);
      const usersRaw = api.get<{ items: User[]; meta: PaginationMeta }>('/users', { search: debouncedQuery, page: 1, limit: 5 }).then((r) => r.items.filter((u) => u.role === 'USER'));

      const [pSettled, oSettled, uSettled] = await Promise.allSettled([productsRaw, ordersRaw, usersRaw]);
      if (cancelled || currentId !== requestIdRef.current) return;

      const products = pSettled.status === 'fulfilled' ? pSettled.value : ([] as Product[]);
      const orders = oSettled.status === 'fulfilled' ? oSettled.value : ([] as Order[]);
      const customers = uSettled.status === 'fulfilled' ? uSettled.value : ([] as User[]);

      const allRejected = pSettled.status === 'rejected' && oSettled.status === 'rejected' && uSettled.status === 'rejected';
      if (allRejected) {
        const firstErr = (pSettled as PromiseRejectedResult).reason;
        setError(firstErr instanceof Error ? firstErr.message : 'Gagal memuat pencarian.');
        setResults({ products: [], orders: [], customers: [] });
      } else {
        setResults({ products, orders, customers });
        setError(null);
      }
      setIsLoading(false);
    };

    fetchAll().catch((err) => {
      if (cancelled || currentId !== requestIdRef.current) return;
      setError(err instanceof Error ? err.message : 'Gagal memuat pencarian.');
      setIsLoading(false);
    });

    return () => { cancelled = true; };
  }, [debouncedQuery, hasQuery]);

  return { query: trimmed, debouncedQuery, results, isLoading, error, hasQuery };
}
