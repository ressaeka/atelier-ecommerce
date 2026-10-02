/**
 * Guest auth-return intent (sessionStorage).
 *
 * Purpose ONLY: remember where to return after login.
 * Does NOT store prices, stock, cart payload, or wishlist payload.
 * Does NOT call wishlist/cart APIs after login — user acts manually.
 *
 * Backend remains source of truth.
 */

export const AUTH_RETURN_INTENT_KEY = 'atelier_auth_return_intent';

/** Legacy keys from older automatic-action implementations — always cleared. */
export const LEGACY_WISHLIST_INTENT_KEY = 'atelier_wishlist_intent';
export const LEGACY_CART_INTENT_KEY = 'atelier_cart_intent';
export const LEGACY_CHECKOUT_INTENT_KEY = 'atelier_checkout_intent';

export type GuestAuthReturnIntentType = 'wishlist' | 'cart';

export interface GuestAuthReturnIntent {
  type: GuestAuthReturnIntentType;
  /** Safe internal route, e.g. /product/123 */
  returnTo: string;
}

export function productReturnTo(productId: number): string {
  return `/product/${productId}`;
}

function isSafeInternalProductPath(path: string): boolean {
  // Internal product route only — reject open redirects
  return /^\/product\/\d+$/.test(path);
}

function clearLegacyIntentKeys(): void {
  sessionStorage.removeItem(LEGACY_WISHLIST_INTENT_KEY);
  sessionStorage.removeItem(LEGACY_CART_INTENT_KEY);
  sessionStorage.removeItem(LEGACY_CHECKOUT_INTENT_KEY);
}

/**
 * Save where the guest came from (product page).
 * No API call — user will act manually after login.
 */
export function saveGuestAuthReturnIntent(
  type: GuestAuthReturnIntentType,
  productId: number,
): void {
  clearLegacyIntentKeys();

  if (!Number.isInteger(productId) || productId <= 0) return;

  const intent: GuestAuthReturnIntent = {
    type,
    returnTo: productReturnTo(productId),
  };

  // Single pending intent — overwrite on repeat clicks
  sessionStorage.setItem(AUTH_RETURN_INTENT_KEY, JSON.stringify(intent));
}

/** Back-compat helpers for existing call sites */
export function saveWishlistIntent(productId: number): void {
  saveGuestAuthReturnIntent('wishlist', productId);
}

export function saveCartIntent(intent: {
  productId: number;
  variantId?: number | null;
  quantity: number;
}): void {
  // Variant/quantity are NOT persisted for auto-cart — product page owns that state
  saveGuestAuthReturnIntent('cart', intent.productId);
}

export function clearGuestAuthReturnIntent(): void {
  sessionStorage.removeItem(AUTH_RETURN_INTENT_KEY);
  clearLegacyIntentKeys();
}

/**
 * Read + consume return intent after successful login.
 * NO wishlist/cart/order API is executed here.
 */
export function consumeGuestAuthReturnIntent(): GuestAuthReturnIntent | null {
  clearLegacyIntentKeys();

  let raw: string | null = null;
  try {
    raw = sessionStorage.getItem(AUTH_RETURN_INTENT_KEY);
  } catch {
    raw = null;
  }

  if (!raw) return null;

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    sessionStorage.removeItem(AUTH_RETURN_INTENT_KEY);
    return null;
  }

  if (!parsed || typeof parsed !== 'object') {
    sessionStorage.removeItem(AUTH_RETURN_INTENT_KEY);
    return null;
  }

  const obj = parsed as { type?: unknown; returnTo?: unknown };

  const type = obj.type;
  const returnTo = obj.returnTo;

  const validType =
    type === 'wishlist' || type === 'cart';
  const validReturnTo =
    typeof returnTo === 'string' && isSafeInternalProductPath(returnTo);

  // Always clear after read — one-shot navigation intent
  sessionStorage.removeItem(AUTH_RETURN_INTENT_KEY);

  if (!validType || !validReturnTo) return null;

  return { type, returnTo };
}
