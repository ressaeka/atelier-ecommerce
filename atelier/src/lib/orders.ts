/**
 * Order history store.
 *
 * src/types/api.ts defines no order resource and the brief forbids inventing
 * endpoints, so order records are kept client-side. Everything the Orders and
 * Payment screens need goes through the four functions below — when a real
 * `/order` endpoint lands, swap their bodies for `api.get`/`api.post` calls and
 * no page component has to change.
 */

export type OrderStatus = 'PROSES' | 'DIBATALKAN' | 'SELESAI';

export interface OrderLine {
  productId: number;
  name: string;
  image: string;
  variant?: string;
  price: number;
  quantity: number;
}

export interface Order {
  id: string;
  createdAt: string;
  status: OrderStatus;
  lines: OrderLine[];
  shippingCost: number;
  discount: number;
  total: number;
  paymentMethod: string;
  virtualAccount: string;
}

const STORAGE_KEY = 'atelier_orders';

export function listOrders(): Order[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as Order[]) : [];
  } catch {
    return [];
  }
}

export function getOrder(id: string): Order | null {
  return listOrders().find((o) => o.id === id) ?? null;
}

export function saveOrder(order: Order): void {
  try {
    const all = listOrders();
    const idx = all.findIndex((o) => o.id === order.id);
    if (idx >= 0) all[idx] = order;
    else all.unshift(order);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
  } catch {
    /* storage unavailable — order simply isn't persisted */
  }
}

export function setOrderStatus(id: string, status: OrderStatus): void {
  const order = getOrder(id);
  if (order) saveOrder({ ...order, status });
}

/** Deterministic-looking 16 digit VA number derived from the order id. */
export function makeVirtualAccount(seed: string): string {
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) {
    hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  }
  const digits = String(8077000000000000 + (hash % 999999999999));
  return digits.slice(0, 16).replace(/(\d{4})(?=\d)/g, '$1 ').trim();
}

export function newOrderId(): string {
  return `ATL-${Date.now().toString(36).toUpperCase()}`;
}
