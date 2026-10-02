/**
 * Order API service layer.
 *
 * All order operations go through the backend API.
 * Uses the existing `api` client which handles Bearer token automatically.
 *
 * Customer endpoints:
 *   GET    /order/my        → own orders only (userId from JWT)
 *   GET    /order/:id       → own order detail (ownership on backend)
 *   PATCH  /order/:id/cancel → cancel own eligible order
 *
 * Admin-only endpoints (do NOT call from customer UI):
 *   GET    /order           → all orders (ADMIN + order:read)
 *   PATCH  /order/:id/status → update status (ADMIN + order:update_status)
 */

import { api } from './api';
import type {
  Order,
  OrderPaginationResponse,
  OrderStatus,
  CreateOrderRequest,
  OrderQuery,
} from '../types/api';

// ─── Create Order ────────────────────────────────────────────
/**
 * POST /order
 * Backend reads the user's cart automatically via JWT.
 * Frontend only needs to send addressId.
 */
export async function createOrder(
  request: CreateOrderRequest,
): Promise<Order> {
  return api.post<Order>('/order', request);
}

// ─── Get MY orders (customer) ───────────────────────────────
/**
 * GET /order/my
 * Returns only orders for the authenticated user (backend uses JWT userId).
 * Do not pass client-controlled userId for authorization.
 */
export async function getMyOrders(
  query: Omit<OrderQuery, 'userId'> = {},
): Promise<OrderPaginationResponse> {
  const params: Record<string, string | number | boolean | undefined> = {};

  if (query.page !== undefined) params.page = query.page;
  if (query.limit !== undefined) params.limit = query.limit;
  if (query.search) params.search = query.search;
  if (query.status) params.status = query.status;
  if (query.sortBy) params.sortBy = query.sortBy;
  if (query.sortOrder) params.sortOrder = query.sortOrder;

  return api.get<OrderPaginationResponse>('/order/my', params);
}

/**
 * GET /order — ADMIN only (all orders).
 * Response: { data: Order[], meta: { page, limit, total, totalPages } }
 * Do NOT use /order/my from Admin Orders.
 */
export async function getOrders(
  query: OrderQuery,
): Promise<OrderPaginationResponse> {
  const params: Record<string, string | number | boolean | undefined> = {};

  if (query.page !== undefined) params.page = query.page;
  if (query.limit !== undefined) params.limit = query.limit;
  if (query.search) params.search = query.search;
  if (query.userId !== undefined) params.userId = query.userId;
  if (query.status) params.status = query.status;
  if (query.sortBy) params.sortBy = query.sortBy;
  if (query.sortOrder) params.sortOrder = query.sortOrder;

  return api.get<OrderPaginationResponse>('/order', params);
}

/**
 * PATCH /order/:id/status — ADMIN only (order:update_status).
 * Body: { status: OrderStatus }
 */
export async function updateOrderStatus(
  id: number,
  status: OrderStatus,
): Promise<Order> {
  return api.patch<Order>(`/order/${id}/status`, { status });
}

// ─── Get Order Detail ────────────────────────────────────────
/**
 * GET /order/:id
 * USER: own order only (backend ownership).
 * ADMIN: any order + payment fields (admin portal detail).
 */
export async function getOrderById(id: number): Promise<Order> {
  return api.get<Order>(`/order/${id}`);
}

// ─── Cancel Order ────────────────────────────────────────────
/**
 * PATCH /order/:id/cancel
 * Cancels a PENDING order owned by the authenticated user and restores stock.
 */
export async function cancelOrder(id: number): Promise<Order> {
  return api.patch<Order>(`/order/${id}/cancel`);
}

