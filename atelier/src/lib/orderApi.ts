/**
 * Order API service layer.
 *
 * All order operations go through the backend API.
 * Uses the existing `api` client which handles Bearer token automatically.
 *
 * Endpoints:
 *   POST   /order           → create order from current cart
 *   GET    /order           → list orders (with pagination + filters)
 *   GET    /order/:id       → get order detail (ownership enforced by backend)
 */

import { api } from './api';
import type {
  Order,
  OrderPaginationResponse,
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

// ─── Get Order List ──────────────────────────────────────────
/**
 * GET /order
 * Accepts pagination + filter query params.
 * For a regular user, always pass userId = authenticated user's id.
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

// ─── Get Order Detail ────────────────────────────────────────
/**
 * GET /order/:id
 * Backend enforces ownership: only returns order if it belongs to the JWT user.
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

