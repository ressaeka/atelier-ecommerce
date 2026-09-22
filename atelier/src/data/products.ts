export interface Product {
  id: number;
  name: string;
  category: string;
  subcategory: string;
  categorySlug: string;   // matches slug di categories.ts
  price: number;
  image: string;
  badge?: string;
  isFavorite?: boolean;
  rating?: number;
  reviewCount?: number;
  colors?: string[];
}

export const products: Product[] = [
  {
    id: 1,
    name: 'Overcoat Wool',
    category: 'MEN',
    subcategory: 'OUTERWEAR',
    categorySlug: '',
    price: 1250000,
    image: 'public/images/recomend1.jpeg',
    rating: 4.8,
    reviewCount: 24,
    colors: ['#C4B49A', '#2C2C2C', '#8B7355'],
  },
  {
    id: 2,
    name: 'Pleated Linen Trousers',
    category: '100% LINEN',
    subcategory: 'CHARCOAL',
    categorySlug: 'tailoring-suits',
    price: 890000,
    image: 'public/images/recomed3.jpeg',
    badge: 'SALE',
    rating: 4.7,
    reviewCount: 31,
    colors: ['#E8E0D0', '#C4B49A'],
  },
  {
    id: 3,
    name: 'Ribbed Knit Sweater',
    category: 'SILK & WOOL',
    subcategory: 'CREAM WHITE',
    categorySlug: 'rajut-kasual',
    price: 750000,
    image: 'public/images/recomend4.jpeg',
    rating: 4.9,
    reviewCount: 42,
    colors: ['#E8E0D0', '#A89070', '#2C2C2C'],
  },
  {
    id: 4,
    name: 'Dompet KAMI',
    category: 'DOMPET',
    subcategory: '5 WARNA',
    categorySlug: 'aksesori-pria',
    price: 1350000,
    image: 'public/images/dompet (2).jpeg',
    badge: 'NEW',
    rating: 4.8,
    reviewCount: 15,
    colors: ['#2C2C2C', '#8B7355', '#C4B49A'],
  },
  {
    id: 5,
    name: 'Oversized Wool Blazer',
    category: 'WOOL BLEND',
    subcategory: 'SAND BEIGE',
    categorySlug: 'tailoring-suits',
    price: 1450000,
    image: 'public/images/recomend2.jpeg',
    rating: 4.6,
    reviewCount: 18,
    colors: ['#8B7355', '#C4B49A'],
  },
  {
    id: 6,
    name: 'Vest Rajut Linen',
    category: 'rajut',
    subcategory: 'cream',
    categorySlug: 'rajut-kasual',
    price: 680000,
    image: 'public/images/rajut-kasual.jpeg',
    rating: 4.5,
    reviewCount: 12,
    colors: ['#C4B49A', '#E8E0D0'],
  },
  {
    id: 7,
    name: 'Kemeja Casual',
    category: 'LINEN',
    subcategory: 'CREAM WHITE',
    categorySlug: 'kemeja-linen',
    price: 520000,
    image: 'public/images/kameja-kasual.jpeg',
    rating: 4.7,
    reviewCount: 28,
    colors: ['#FAF9F5', '#C4B49A'],
  },
  {
    id: 8,
    name: 'Office Bag Man',
    category: 'bag wallet',
    subcategory: 'black',
    categorySlug: 'aksesori-pria',
    price: 450000,
    image: 'public/images/dompet (1).jpeg',
    rating: 4.6,
    reviewCount: 19,
    colors: ['#2C2C2C', '#8B7355'],
  },
  {
    id: 10,
    name: 'Silk Blouse Sleeve',
    category: 'SILK',
    subcategory: 'cream beige',
    categorySlug: 'kemeja-linen',
    price: 720000,
    image: 'public/images/silk-blouse.jpeg',
    badge: 'SALE',
    rating: 4.4,
    reviewCount: 9,
    colors: ['#1A1A1A', '#2C2C2C'],
  },
  {
    id: 11,
    name: 'Structured Leather Tote',
    category: 'CALF LEATHER',
    subcategory: 'NOIR',
    categorySlug: 'sepatu-tas',
    price: 1150000,
    image: 'public/images/recomend5.jpeg',
    rating: 4.9,
    reviewCount: 21,
    colors: ['#2C2C2C', '#8B7355'],
  },
  {
    id: 12,
    name: 'Heels Shoes',
    category: 'HEELS',
    subcategory: 'CREAM',
    categorySlug: 'sepatu-tas',
    price: 1680000,
    image: 'public/images/sepatu(2).jpeg',
    rating: 4.7,
    reviewCount: 37,
    colors: ['#1A1A1A', '#8B7355'],
  },
    {
    id: 13,
    name: 'Formal Shoes Men',
    category: 'office shoes',
    subcategory: 'hitam',
    categorySlug: 'sepatu-tas',
    price: 890000,
    image: 'public/images/sepatu(1).jpeg',
    rating: 4.7,
    reviewCount: 37,
    colors: ['#1A1A1A', '#8B7355'],
  },
];

export const formatPrice = (price: number): string => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })
    .format(price)
    .replace('IDR', 'Rp');
};
