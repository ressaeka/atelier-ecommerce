/**
 * Payment API service layer.
 *
 * All payment operations go through the backend API.
 * Uses the existing `api` client which handles Bearer token automatically.
 *
 * Endpoints:
 *   POST /payment → create Midtrans Snap transaction for a PENDING order
 *
 * NOTE:
 *   - Backend returns `redirectUrl` from Midtrans (not persisted in DB).
 *   - Do NOT call POST /payment/notification from the frontend.
 *     That endpoint is a server-to-server webhook (Midtrans → Backend).
 */

import { api } from './api';
import type { PaymentResponse } from '../types/api';

// ─── Create Payment ─────────────────────────────────────────
/**
 * POST /payment
 * Body: { orderId }
 * Backend validates order is PENDING, creates Midtrans transaction,
 * stores Payment row, and returns snapToken + redirectUrl.
 */
export async function createPayment(
  orderId: number,
): Promise<PaymentResponse> {
  return api.post<PaymentResponse>('/payment', { orderId });
}
