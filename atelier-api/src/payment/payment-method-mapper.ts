import { Logger } from '@nestjs/common';
import { PaymentMethod } from '../../generated/prisma/enums.js';

/**
 * Midtrans payment_type → Atelier PaymentMethod enum.
 *
 * Stable internal codes only — never store marketing display names.
 * VA banks (BCA/BRI/BNI/Mandiri/Permata) collapse to VIRTUAL_ACCOUNT.
 * Unknown types stay null (do not guess / do not invent QRIS).
 */

const logger = new Logger('MidtransPaymentMethodMapper');

const PAYMENT_METHOD_DISPLAY_NAMES: Record<PaymentMethod, string> = {
  GOPAY: 'GoPay / GoPay Later',
  VIRTUAL_ACCOUNT: 'Virtual Accounts',
  SHOPEEPAY: 'ShopeePay / SpayLater',
  OVO: 'OVO',
  DANA: 'Dana',
  QRIS: 'Other QRIS',
};

/** Deterministic chart order */
export const PAYMENT_METHOD_ORDER: PaymentMethod[] = [
  'GOPAY',
  'VIRTUAL_ACCOUNT',
  'SHOPEEPAY',
  'OVO',
  'DANA',
  'QRIS',
];

export function getPaymentMethodDisplayName(method: PaymentMethod): string {
  return PAYMENT_METHOD_DISPLAY_NAMES[method];
}

/**
 * Normalize Midtrans payment_type into Atelier enum.
 * Returns null when the value is missing or unrecognized.
 */
export function mapMidtransPaymentMethod(
  paymentType: string | null | undefined,
): PaymentMethod | null {
  if (!paymentType) return null;

  const normalized = paymentType
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, '_')
    .replace(/[^a-z0-9_]/g, '');

  if (!normalized) return null;

  // GoPay / GoPay Later
  if (
    normalized === 'gopay' ||
    normalized === 'gopaylater' ||
    normalized === 'gopay_later' ||
    normalized.startsWith('gopay')
  ) {
    return 'GOPAY';
  }

  // ShopeePay / SpayLater
  if (
    normalized === 'shopeepay' ||
    normalized === 'spaylater' ||
    normalized === 'shopeepay_later' ||
    normalized.startsWith('shopeepay') ||
    normalized.startsWith('spay')
  ) {
    return 'SHOPEEPAY';
  }

  // E-wallet singles
  if (normalized === 'ovo' || normalized.startsWith('ovo')) {
    return 'OVO';
  }
  if (normalized === 'dana' || normalized.startsWith('dana')) {
    return 'DANA';
  }

  // QRIS
  if (
    normalized === 'qris' ||
    normalized === 'qr_merchant' ||
    normalized.startsWith('qris')
  ) {
    return 'QRIS';
  }

  // Virtual Account / bank transfer VA
  if (
    normalized === 'bank_transfer' ||
    normalized === 'other_va' ||
    normalized.endsWith('_va') ||
    normalized === 'bca' ||
    normalized === 'bri' ||
    normalized === 'bni' ||
    normalized === 'mandiri' ||
    normalized === 'permata' ||
    normalized.startsWith('bca') ||
    normalized.startsWith('bri') ||
    normalized.startsWith('bni') ||
    normalized.startsWith('mandiri') ||
    normalized.startsWith('permata')
  ) {
    return 'VIRTUAL_ACCOUNT';
  }

  // Unknown / unsupported — do NOT classify as QRIS or generic e-wallet
  logger.warn(
    `Unmapped Midtrans payment_type "${paymentType}" — paymentMethod left null`,
  );
  return null;
}

/**
 * Dashboard aggregation: completed payments only (PaymentStatus.PAID).
 * Null/unknown methods are not invented into another category.
 */
export function buildPaymentMethodDistribution(
  rows: Array<{ paymentMethod: PaymentMethod | null }>,
): {
  paymentMethods: Array<{
    id: PaymentMethod;
    name: string;
    percentage: number;
    orders: number;
  }>;
  paymentMethodsAvailable: boolean;
  completedWithKnownMethod: number;
  completedTotal: number;
} {
  const completedTotal = rows.length;
  const counts = new Map<PaymentMethod, number>();

  for (const row of rows) {
    if (!row.paymentMethod) continue;
    counts.set(row.paymentMethod, (counts.get(row.paymentMethod) ?? 0) + 1);
  }

  const completedWithKnownMethod = [...counts.values()].reduce(
    (sum, n) => sum + n,
    0,
  );

  if (completedWithKnownMethod === 0 || completedTotal === 0) {
    return {
      paymentMethods: [],
      paymentMethodsAvailable: false,
      completedWithKnownMethod,
      completedTotal,
    };
  }

  const paymentMethods = PAYMENT_METHOD_ORDER.map((method) => {
    const orders = counts.get(method) ?? 0;
    const percentage =
      completedTotal === 0 ? 0 : (orders / completedTotal) * 100;

    return {
      id: method,
      name: getPaymentMethodDisplayName(method),
      percentage: Math.round(percentage * 100) / 100,
      orders,
    };
  }).filter((item) => item.orders > 0);

  return {
    paymentMethods,
    paymentMethodsAvailable: paymentMethods.length > 0,
    completedWithKnownMethod,
    completedTotal,
  };
}
