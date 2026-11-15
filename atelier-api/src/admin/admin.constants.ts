import { OrderStatus } from '../../generated/prisma/enums.js';

export const BUSINESS_TIMEZONE = 'Asia/Jakarta' as const;
export const BUSINESS_TZ_OFFSET_MS = 7 * 60 * 60 * 1000; // WIB (UTC+7)

/**
 * Status pesanan yang diakui sebagai pendapatan (Revenue) dan produk terjual.
 */
export const REVENUE_STATUSES: OrderStatus[] = [
  OrderStatus.PAID,
  OrderStatus.PROCESSING,
  OrderStatus.SHIPPED,
  OrderStatus.DELIVERED,
];

/**
 * Status pesanan yang dikecualikan dari perhitungan Total Orders.
 */
export const ORDER_EXCLUDED_STATUSES: OrderStatus[] = [
  OrderStatus.CANCELLED,
  OrderStatus.EXPIRED,
];

/**
 * Status pesanan yang termasuk dalam Total Orders (seluruh pesanan kecuali CANCELLED & EXPIRED).
 */
export const VALID_ORDER_STATUSES: OrderStatus[] = [
  OrderStatus.PENDING,
  OrderStatus.PAID,
  OrderStatus.PROCESSING,
  OrderStatus.SHIPPED,
  OrderStatus.DELIVERED,
];
