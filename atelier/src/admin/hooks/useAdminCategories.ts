import { useCallback, useEffect, useRef, useState } from 'react';
import {
  createCategory,
  deleteCategory,
  getCategoriesPage,
  toCategoryDeleteError,
  updateCategory,
  type CreateCategoryRequest,
  type UpdateCategoryRequest,
} from '../../lib/categoryApi';
import type { Category, PaginationMeta } from '../../types/api';

export interface AdminCategoriesState {
  categories: Category[];
  meta: PaginationMeta | null;
  isLoading: boolean;
  error: string | null;
  page: number;
  limit: number;
  search: string;
  refetch: () => void;
  setPage: (page: number) => void;
  setSearch: (search: string) => void;
  createCategory: (payload: CreateCategoryRequest) => Promise<void>;
  updateCategory: (id: number, payload: UpdateCategoryRequest) => Promise<void>;
  deleteCategory: (id: number) => Promise<void>;
  actionError: string | null;
  actionSuccess: string | null;
  clearActionFeedback: () => void;
}

const DEFAULT_LIMIT = 10;

/**
 * Admin category list + CRUD via existing Category API:
 * GET/POST /category, PATCH/DELETE /category/:id
 * Active product count comes from backend productCount (isActive only).
 */
export function useAdminCategories(): AdminCategoriesState {
  const [items, setItems] = useState<Category[]>([]);
  const [meta, setMeta] = useState<PaginationMeta | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPageState] = useState(1);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearchQuery] = useState('');
  const limit = DEFAULT_LIMIT;
  const [reloadKey, setReloadKey] = useState(0);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
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

  const clearActionFeedback = useCallback(() => {
    setActionError(null);
    setActionSuccess(null);
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setIsLoading(true);
      setError(null);
      try {
        const data = await getCategoriesPage({
          page,
          limit,
          search: search || undefined,
        });
        if (cancelled) return;
        setItems(data.items);
        setMeta(data.meta);
      } catch (err) {
        if (cancelled) return;
        const message =
          err instanceof Error && err.message
            ? err.message
            : 'Something went wrong while loading categories.';
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

  const handleCreate = useCallback(
    async (payload: CreateCategoryRequest) => {
      setActionError(null);
      setActionSuccess(null);
      try {
        await createCategory(payload);
        setActionSuccess('Category created successfully.');
        refetch();
      } catch (err) {
        const message =
          err instanceof Error && err.message
            ? err.message
            : 'Unable to create category.';
        setActionError(message);
        throw err;
      }
    },
    [refetch],
  );

  const handleUpdate = useCallback(
    async (id: number, payload: UpdateCategoryRequest) => {
      setActionError(null);
      setActionSuccess(null);
      try {
        await updateCategory(id, payload);
        setActionSuccess('Category updated successfully.');
        refetch();
      } catch (err) {
        const message =
          err instanceof Error && err.message
            ? err.message
            : 'Unable to update category.';
        setActionError(message);
        throw err;
      }
    },
    [refetch],
  );

  const handleDelete = useCallback(
    async (id: number) => {
      setActionError(null);
      setActionSuccess(null);
      try {
        await deleteCategory(id);
        setActionSuccess('Category deleted successfully.');
        refetch();
      } catch (err) {
        const raw =
          err instanceof Error && err.message
            ? err.message
            : 'Unable to delete category.';
        setActionError(toCategoryDeleteError(raw));
        throw err;
      }
    },
    [refetch],
  );

  return {
    categories: items,
    meta,
    isLoading,
    error,
    page,
    limit,
    search: searchInput,
    refetch,
    setPage: setPageState,
    setSearch: setSearchInput,
    createCategory: handleCreate,
    updateCategory: handleUpdate,
    deleteCategory: handleDelete,
    actionError,
    actionSuccess,
    clearActionFeedback,
  };
}
