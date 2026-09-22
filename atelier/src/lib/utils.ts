const CATEGORY_IMAGES: Record<string, string> = {
  Tailoring: '/images/jas.jpeg',
  Suits: '/images/jas.jpeg',
  Rajut: '/images/rajut-kasual.jpeg',
  Kemeja: '/images/kameja-linen.jpeg',
  Linen: '/images/kameja-linen.jpeg',
  Aksesori: '/images/dompet.jpeg',
  Dompet: '/images/dompet.jpeg',
  Sepatu: '/images/tas_sepatu.jpeg',
  Tas: '/images/tas_sepatu.jpeg',
};

export function resolveCategoryImage(
  categoryName: string,
): string | null {
  const lower =
    categoryName.toLowerCase();

  for (const [
    keyword,
    path,
  ] of Object.entries(
    CATEGORY_IMAGES,
  )) {
    if (
      lower.includes(
        keyword.toLowerCase(),
      )
    ) {
      return path;
    }
  }

  return null;
}

const PLACEHOLDER_BASE =
  'https://placehold.co';

export function resolveImageUrl(
  url: string | null | undefined,
  width: number,
  height: number,
  fallbackText?: string,
): string {
  /*
   * Tidak ada image
   */
  if (!url || !url.trim()) {
    const text =
      fallbackText
        ? encodeURIComponent(
            fallbackText,
          )
        : '';

    return `${PLACEHOLDER_BASE}/${width}x${height}/ECEAE4/8B8075?text=${text}`;
  }

  const cleanUrl = url.trim();

  /*
   * Absolute URL
   */
  if (
    cleanUrl.startsWith(
      'http://',
    ) ||
    cleanUrl.startsWith(
      'https://',
    )
  ) {
    return cleanUrl;
  }

  /*
   * Absolute frontend path
   *
   * /images/kemeja.jpg
   * /uploads/kemeja.jpg
   */
  if (cleanUrl.startsWith('/')) {
    return cleanUrl;
  }

  /*
   * Backend/storage path yang masih
   * diawali "public/"
   *
   * public/images/foo.jpg
   * → /images/foo.jpg
   */
  if (
    cleanUrl.startsWith(
      'public/',
    )
  ) {
    return `/${cleanUrl.slice(
      'public/'.length,
    )}`;
  }

  /*
   * Relative path.
   *
   * Karena kita tidak tahu apakah backend
   * mengirim uploads/... atau images/...
   * jangan biarkan browser membuat URL
   * relatif terhadap route saat ini.
   */
  if (cleanUrl.includes('/')) {
    return `/${cleanUrl}`;
  }

  /*
   * Hanya filename.
   *
   * foo.jpg
   * → /images/foo.jpg
   */
  return `/images/${cleanUrl}`;
}

export function formatPrice(
  price: number,
): string {
  return new Intl.NumberFormat(
    'id-ID',
    {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    },
  )
    .format(price)
    .replace('IDR', 'Rp');
}