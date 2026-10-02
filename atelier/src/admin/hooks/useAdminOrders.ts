import { useCallback, useEffect, useRef, useState } from 'react';
import {
  getOrderById,
  getOrders,
  updateOrderStatus,
} from '../../lib/orderApi';
import type { Order, OrderStatus, PaginationMeta } from '../../types/api';

export type AdminOrderStatusFilter = OrderStatus | 'ALL';

export interface AdminOrdersState {
  orders: Order[];
  meta: PaginationMeta | null;
  isLoading: boolean;
  error: string | null;
  page: number;
  limit: number;
  search: string;
  statusFilter: AdminOrderStatusFilter;
  selectedOrder: Order | null;
  isDetailLoading: boolean;
  detailError: string | null;
  isUpdatingStatus: boolean;
  updateError: string | null;
  updateSuccess: string | null;
  refetch: () => void;
  setPage: (page: number) => void;
  setSearch: (search: string) => void;
  setStatusFilter: (status: AdminOrderStatusFilter) => void;
  selectOrder: (order: Order | null) => void;
  refreshSelectedOrder: (orderId: number) => Promise<void>;
  updateStatus: (orderId: number, status: OrderStatus) => Promise<void>;
}

const DEFAULT_LIMIT = 10;

/**
 * Admin Orders via existing GET /order (ADMIN + order:read).
 * NOT /order/my.
 * Detail uses the selected order from the list response (full order fields).
 * Status update: PATCH /order/:id/status.
 */
export function useAdminOrders(): AdminOrdersState {
  const [items, setItems] = useState<Order[]>([]);
  const [meta, setMeta] = useState<PaginationMeta | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPageState] = useState(1);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilterState] =
    useState<AdminOrderStatusFilter>('ALL');
  const limit = DEFAULT_LIMIT;
  const [reloadKey, setReloadKey] = useState(0);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isDetailLoading, setIsDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [updateError, setUpdateError] = useState<string | null>(null);
  const [updateSuccess, setUpdateSuccess] = useState<string | null>(null);
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
        const response = await getOrders({
          page,
          limit,
          search: search || undefined,
          status: statusFilter === 'ALL' ? undefined : statusFilter,
          sortBy: 'createdAt',
          sortOrder: 'desc',
        });
        if (cancelled) return;
        setItems(Array.isArray(response?.data) ? response.data : []);
        setMeta(response?.meta ?? null);
      } catch (err) {
        if (cancelled) return;
        const message =
          err instanceof Error && err.message
            ? err.message
            : 'Gagal memuat pesanan.';
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
  }, [page, limit, search, statusFilter, reloadKey]);

  // Keep selected order in sync with refreshed list data
  useEffect(() => {
    if (!selectedOrder) return;
    const fresh = items.find((o) => o.id === selectedOrder.id);
    if (fresh && fresh.status !== selectedOrder.status) {
      setSelectedOrder(fresh);
    }
  }, [items, selectedOrder]);

  const selectOrder = useCallback((order: Order | null) => {
    setSelectedOrder(order);
    setDetailError(null);
    setUpdateError(null);
    setUpdateSuccess(null);
    setIsDetailLoading(false);
  }, []);

  /**
   * Fetch order detail from GET /order/:id.
   * Backend: ADMIN can view any order + payments; USER still ownership-scoped.
   */
  const loadOrderDetail = useCallback(async (orderId: number) => {
    setIsDetailLoading(true);
    setDetailError(null);
    try {
      const detail = await getOrderById(orderId);
      setSelectedOrder(detail);
      setUpdateSuccess(null);
      setUpdateError(null);
    } catch (err) {
      const message =
        err instanceof Error && err.message
          ? err.message
          : 'Gagal memuat detail pesanan.';
      setDetailError(message);
    } finally {
      setIsDetailLoading(false);
    }
  }, []);

  const updateStatus = useCallback(
    async (orderId: number, status: OrderStatus) => {
      setIsUpdatingStatus(true);
      setUpdateError(null);
      setUpdateSuccess(null);
      try {
        // Use order returned by API — do not recompute status locally first
        const updated = await updateOrderStatus(orderId, status);
        setItems((prev) =>
          prev.map((o) => (o.id === orderId ? { ...o, status: updated.status } : o)),
        );
        setSelectedOrder((prev) =>
          prev && prev.id === orderId ? { ...prev, status: updated.status } : prev,
        );
        setUpdateSuccess(`Status pesanan #${orderId} diperbarui.`);
      } catch (err) {
        const message =
          err instanceof Error && err.message
            ? err.message
            : 'Gagal memperbarui status pesanan.';
        setUpdateError(message);
      } finally {
        setIsUpdatingStatus(false);
      }
    },
    [],
  );

  // Client-side extra filter: order id contains (backend search = recipientName only)
  const displayOrders = search
    ? items.filter((order) => {
        const byName = order.recipientName
          .toLowerCase()
          .includes(search.toLowerCase());
        const byId = String(order.id).includes(search);
        // If backend already filtered by name, keep API results; also allow id match
        return byName || byId;
      })
    : items;

  return {
    orders: displayOrders,
    meta,
    isLoading,
    error,
    page,
    limit,
    search: searchInput,
    statusFilter,
    selectedOrder,
    isDetailLoading,
    detailError,
    isUpdatingStatus,
    updateError,
    updateSuccess,
    refetch,
    setPage: setPageState,
    setSearch: setSearchInput,
    setStatusFilter: setStatusFilterState,
    selectOrder,
    refreshSelectedOrder: loadOrderDetail,
    updateStatus,
  };
}
