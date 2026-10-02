/**
 * Presentation-layer mapping for admin UI errors.
 * Does not change backend or business logic — only what admins see.
 */

export function toAdminUiError(
  message: string | null | undefined,
  fallback: string,
): string {
  if (!message || !message.trim()) {
    return fallback;
  }

  const lower = message.toLowerCase();

  if (
    lower.includes('permission') ||
    lower.includes('unauthorized') ||
    lower.includes('forbidden') ||
    lower.includes('tidak memiliki akses')
  ) {
    return 'Anda tidak memiliki akses untuk melihat halaman ini.';
  }

  if (lower.includes('midtrans') || lower.includes('signature')) {
    return 'Pembayaran tidak valid.';
  }

  if (
    (lower.includes('user') || lower.includes('akun')) &&
    lower.includes('ditemukan')
  ) {
    return 'Akun tidak ditemukan.';
  }

  if (lower.includes('product') && lower.includes('ditemukan')) {
    return 'Produk tidak ditemukan.';
  }

  if (lower.includes('category') && lower.includes('ditemukan')) {
    return 'Kategori tidak ditemukan.';
  }

  if (lower.includes('order') && lower.includes('ditemukan')) {
    return 'Pesanan tidak ditemukan.';
  }

  if (
    lower.includes('api') ||
    lower.includes('request') ||
    lower.includes('response') ||
    lower.includes('database') ||
    lower.includes('prisma') ||
    lower.includes('server') ||
    lower.includes('endpoint')
  ) {
    return fallback;
  }

  // Keep clear business validation messages from forms
  return message;
}
