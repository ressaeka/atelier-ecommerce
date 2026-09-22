import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';
import { useNavigate } from 'react-router-dom';

import { api } from '../lib/api';
import { useAuth } from './AuthContext';

import type { Wishlist, WishlistItem } from '../types/api';

interface WishlistContextValue {
  items: WishlistItem[];
  loading: boolean;
  count: number;
  has: (productId: number) => boolean;
  toggle: (productId: number) => Promise<void>;
  add: (productId: number) => Promise<void>;
  remove: (productId: number) => Promise<void>;
  refresh: () => Promise<void>;
}

const WishlistContext = createContext<WishlistContextValue | null>(null);

export function WishlistProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [wishlist, setWishlist] = useState<Wishlist | null>(null);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!user) {
      setWishlist(null);
      return;
    }

    setLoading(true);

    try {
      const data = await api.get<Wishlist>('/wishlist');
      setWishlist(data);
    } catch (error) {
      console.error('Failed to fetch wishlist:', error);
      setWishlist(null);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const requireAuth = useCallback((): boolean => {
    if (!user) {
      navigate('/login');
      return false;
    }

    return true;
  }, [user, navigate]);

  const add = useCallback(
    async (productId: number): Promise<void> => {
      if (!requireAuth()) return;

      await api.post('/wishlist/items', {
        productId,
      });

      await refresh();
    },
    [requireAuth, refresh],
  );

  const remove = useCallback(
    async (productId: number): Promise<void> => {
      if (!requireAuth()) return;

      await api.delete(`/wishlist/items/${productId}`);

      await refresh();
    },
    [requireAuth, refresh],
  );

  const toggle = useCallback(
    async (productId: number): Promise<void> => {
      if (!requireAuth()) return;

      const exists =
        wishlist?.items.some(
          (item) => item.productId === productId,
        ) ?? false;

      if (exists) {
        await remove(productId);
      } else {
        await add(productId);
      }
    },
    [wishlist, add, remove, requireAuth],
  );

  const has = useCallback(
    (productId: number): boolean =>
      wishlist?.items.some(
        (item) => item.productId === productId,
      ) ?? false,
    [wishlist],
  );

  const items = wishlist?.items ?? [];
  const count = items.length;

  return (
    <WishlistContext.Provider
      value={{
        items,
        loading,
        count,
        has,
        toggle,
        add,
        remove,
        refresh,
      }}
    >
      {children}
    </WishlistContext.Provider>
  );
}

export function useWishlist(): WishlistContextValue {
  const ctx = useContext(WishlistContext);

  if (!ctx) {
    throw new Error(
      'useWishlist must be used within WishlistProvider',
    );
  }

  return ctx;
}
