import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import { useAuth } from './AuthContext';
import { saveCartIntent } from '../lib/guestIntent';
import type { Cart, CartItem } from '../types/api';

interface CartContextValue {
  items: CartItem[];
  loading: boolean;
  itemCount: number;
  addItem: (productId: number, quantity: number, variantId?: number | null) => Promise<void>;
  updateItem: (productId: number, quantity: number, variantId?: number | null) => Promise<void>;
  removeItem: (productId: number, variantId?: number | null) => Promise<void>;
  clearCart: () => Promise<void>;
  refresh: () => Promise<void>;
  hasItem: (productId: number, variantId?: number | null) => boolean;
  updatingItemKey: string | null;
}

const CartContext = createContext<CartContextValue | null>(null);

function itemKey(productId: number, variantId?: number | null): string {
  return `${productId}:${variantId ?? ''}`;
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [cart, setCart] = useState<Cart | null>(null);
  const [initialLoading, setInitialLoading] = useState(true);
  const [updatingItemKey, setUpdatingItemKey] = useState<string | null>(null);
  const fetchCountRef = useRef(0);

  const refresh = useCallback(async (isInitial = false) => {
    if (!user) {
      setCart(null);
      setInitialLoading(false);
      return;
    }
    const thisFetch = ++fetchCountRef.current;
    if (isInitial) setInitialLoading(true);
    try {
      const data = await api.get<Cart>('/cart');
      if (thisFetch === fetchCountRef.current) {
        setCart(data);
      }
    } catch {
      if (thisFetch === fetchCountRef.current) {
        setCart(null);
      }
    } finally {
      if (isInitial) setInitialLoading(false);
    }
  }, [user]);

  useEffect(() => {
    refresh(true);
  }, [refresh]);

  const addItem = useCallback(
    async (productId: number, quantity: number, variantId?: number | null) => {
      if (!user) {
        // Guest: remember return page only — no auto cart after login
        saveCartIntent({ productId, variantId, quantity });
        navigate('/login');
        return;
      }

      await api.post('/cart/items', { productId, quantity, variantId: variantId ?? null });
      await refresh();
    },
    [user, refresh, navigate],
  );

  const updateItem = useCallback(async (productId: number, quantity: number, variantId?: number | null) => {
    const key = itemKey(productId, variantId);
    setUpdatingItemKey(key);
    setCart((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        items: prev.items.map((item) =>
          item.productId === productId && item.variantId === (variantId ?? null)
            ? { ...item, quantity }
            : item,
        ),
      };
    });
    try {
      const qs = variantId ? `?variantId=${variantId}` : '';
      await api.patch(`/cart/items/${productId}${qs}`, { quantity });
      await refresh();
    } catch {
      await refresh();
      throw new Error('Gagal memperbarui quantity');
    } finally {
      setUpdatingItemKey(null);
    }
  }, [refresh]);

  const removeItem = useCallback(async (productId: number, variantId?: number | null) => {
    setUpdatingItemKey(itemKey(productId, variantId));
    setCart((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        items: prev.items.filter(
          (item) => !(item.productId === productId && item.variantId === (variantId ?? null)),
        ),
      };
    });
    try {
      const qs = variantId ? `?variantId=${variantId}` : '';
      await api.delete(`/cart/items/${productId}${qs}`);
      await refresh();
    } catch {
      await refresh();
      throw new Error('Gagal menghapus item');
    } finally {
      setUpdatingItemKey(null);
    }
  }, [refresh]);

  const clearCart = useCallback(async () => {
    await api.delete('/cart');
    await refresh();
  }, [refresh]);

  const hasItem = useCallback((productId: number, variantId?: number | null): boolean => {
    return cart?.items.some(
      (item) => item.productId === productId && item.variantId === (variantId ?? null),
    ) ?? false;
  }, [cart]);

  const items = cart?.items ?? [];
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <CartContext.Provider value={{ items, loading: initialLoading, itemCount, addItem, updateItem, removeItem, clearCart, refresh, hasItem, updatingItemKey }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
}
