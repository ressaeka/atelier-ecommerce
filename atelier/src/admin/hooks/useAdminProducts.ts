import { useCallback, useEffect, useRef, useState } from 'react';
import { api } from '../../lib/api';
import {
  createProduct,
  deleteProduct,
  getCategories,
  updateProduct,
  type CreateProductRequest,
  type UpdateProductRequest,
} from '../../lib/productApi';
import type { Category, PaginationMeta, Product } from '../../types/api';

export interface AdminProductItem extends Product {
  categoryName?: string;
}

export interface AdminProductsState {
  products: AdminProductItem[];
  categories: Category[];
  meta: PaginationMeta | null;
  isLoading: boolean;
  error: string | null;
  page: number;
  limit: number;
  search: string;
  categoryId: number | 'ALL';
  refetch: () => void;
  setPage: (page: number) => void;
  setSearch: (search: string) => void;
  setCategoryId: (categoryId: number | 'ALL') => void;
  /** CRUD */
  createProduct: (payload: CreateProductRequest) => Promise<void>;
  updateProduct: (id: number, payload: UpdateProductRequest) => Promise<void>;
  deleteProduct: (id: number) => Promise<void>;
  actionError: string | null;
  actionSuccess: string | null;
  clearActionFeedback: () => void;
}

const DEFAULT_LIMIT = 10;

/**
 * Admin product list + CRUD via existing APIs:
 * GET/POST /product, PATCH/DELETE /product/:id, GET /category
 */
export function useAdminProducts(): AdminProductsState {
  const [items, setItems] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [meta, setMeta] = useState<PaginationMeta | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPageState] = useState(1);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearchQuery] = useState('');
  const [categoryId, setCategoryIdState] = useState<number | 'ALL'>('ALL');
  const limit = DEFAULT_LIMIT;
  const [reloadKey, setReloadKey] = useState(0);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const categoriesLoadedRef = useRef(false);

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

  // Categories for dropdown + name mapping
  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const data = await getCategories();
        if (!cancelled) {
          categoriesLoadedRef.current = true;
          setCategories(data);
        }
      } catch {
        // optional for list display; form will show if empty
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setIsLoading(true);
      setError(null);
      try {
        const data = await api.get<{ items: Product[]; meta: PaginationMeta }>(
          '/product',
          {
            page,
            limit,
            search: search || undefined,
            categoryId: categoryId === 'ALL' ? undefined : categoryId,
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
            : 'Gagal memuat produk.';
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
  }, [page, limit, search, categoryId, reloadKey]);

  const categoryNameById = new Map(categories.map((c) => [c.id, c.name]));

  const products: AdminProductItem[] = items.map((product) => ({
    ...product,
    categoryName:
      product.category?.name ?? categoryNameById.get(product.categoryId),
  }));

  const handleCreate = useCallback(
    async (payload: CreateProductRequest) => {
      setActionError(null);
      setActionSuccess(null);
      try {
        await createProduct(payload);
        setActionSuccess('Produk berhasil ditambahkan.');
        refetch();
      } catch (err) {
        const message =
          err instanceof Error && err.message
            ? err.message
            : 'Gagal menambahkan produk.';
        setActionError(message);
        throw err;
      }
    },
    [refetch],
  );

  const handleUpdate = useCallback(
    async (id: number, payload: UpdateProductRequest) => {
      setActionError(null);
      setActionSuccess(null);
      try {
        await updateProduct(id, payload);
        setActionSuccess('Produk berhasil diperbarui.');
        refetch();
      } catch (err) {
        const message =
          err instanceof Error && err.message
            ? err.message
            : 'Gagal memperbarui produk.';
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
        await deleteProduct(id);
        setActionSuccess('Produk berhasil dihapus.');
        refetch();
      } catch (err) {
        const message =
          err instanceof Error && err.message
            ? err.message
            : 'Gagal menghapus produk.';
        setActionError(message);
        throw err;
      }
    },
    [refetch],
  );

  return {
    products,
    categories,
    meta,
    isLoading,
    error,
    page,
    limit,
    search: searchInput,
    categoryId,
    refetch,
    setPage: setPageState,
    setSearch: setSearchInput,
    setCategoryId: setCategoryIdState,
    createProduct: handleCreate,
    updateProduct: handleUpdate,
    deleteProduct: handleDelete,
    actionError,
    actionSuccess,
    clearActionFeedback,
  };
}
