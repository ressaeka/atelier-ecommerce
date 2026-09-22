/**
 * Mock order data for UI prototyping.
 *
 * This file is ONLY for frontend visual validation.
 * It does NOT connect to any backend API.
 * When a real Order API is built, replace this with api.get('/orders').
 */

export type MockOrderStatus =
  | 'BELUM_BAYAR'
  | 'DIPROSES'
  | 'DIKIRIM'
  | 'DIBATALKAN'
  | 'SELESAI';

export interface MockAddress {
  label: string;
  recipient: string;
  phone: string;
  street: string;
  district: string;
  city: string;
  province: string;
  postalCode: string;
}

export interface MockOrderItem {
  id: number;
  productId: number;
  productName: string;
  image: string;
  price: number;
  quantity: number;
  color?: string;
  size?: string;
}

export interface MockOrder {
  id: string;
  orderNumber: string;
  createdAt: string;
  status: MockOrderStatus;
  items: MockOrderItem[];
  subtotal: number;
  shippingFee: number;
  discount: number;
  total: number;
  shippingAddress?: MockAddress;
}

export const mockOrders: MockOrder[] = [
  {
    id: '1',
    orderNumber: 'INV/ATL/26/09/1601',
    createdAt: '2026-09-16T10:30:00Z',
    status: 'DIKIRIM',
    items: [
      { id: 1, productId: 1, productName: 'Kemeja Linen Oversized', image: '/images/kameja-linen.jpeg', price: 420000, quantity: 1, color: 'Natural', size: 'L' },
      { id: 2, productId: 2, productName: 'Celana Rajut Pleated', image: '/images/rajut-kasual.jpeg', price: 580000, quantity: 1, color: 'Charcoal', size: 'M' },
      { id: 3, productId: 3, productName: 'Outer Knit Premium', image: '/images/recomend1.jpeg', price: 650000, quantity: 1, color: 'Ivory', size: 'XL' },
    ],
    subtotal: 1650000,
    shippingFee: 25000,
    discount: 0,
    total: 1675000,
    shippingAddress: {
      label: 'Rumah',
      recipient: 'Andi Pratama',
      phone: '+62 812-3456-7890',
      street: 'Jl. Sudirman No. 123, RT 01/RW 02',
      district: 'Kebayoran Baru',
      city: 'Jakarta Selatan',
      province: 'DKI Jakarta',
      postalCode: '12190',
    },
  },
  {
    id: '2',
    orderNumber: 'INV/ATL/26/09/1502',
    createdAt: '2026-09-15T14:20:00Z',
    status: 'DIPROSES',
    items: [
      { id: 4, productId: 4, productName: 'Silk Blouse Classic', image: '/images/silk-blouse.jpeg', price: 890000, quantity: 1, color: 'Champagne', size: 'S' },
      { id: 5, productId: 5, productName: 'Kasual Knit Top', image: '/images/kameja-kasual.jpeg', price: 350000, quantity: 1, color: 'Oat', size: 'M' },
    ],
    subtotal: 1240000,
    shippingFee: 20000,
    discount: 0,
    total: 1260000,
    shippingAddress: {
      label: 'Rumah',
      recipient: 'Andi Pratama',
      phone: '+62 812-3456-7890',
      street: 'Jl. Sudirman No. 123, RT 01/RW 02',
      district: 'Kebayoran Baru',
      city: 'Jakarta Selatan',
      province: 'DKI Jakarta',
      postalCode: '12190',
    },
  },
  {
    id: '3',
    orderNumber: 'INV/ATL/26/09/1403',
    createdAt: '2026-09-14T09:15:00Z',
    status: 'SELESAI',
    items: [
      { id: 6, productId: 6, productName: 'Pleated Linen Trousers', image: '/images/recomed3.jpeg', price: 910000, quantity: 1, color: 'Sand', size: 'M' },
    ],
    subtotal: 910000,
    shippingFee: 18000,
    discount: 0,
    total: 928000,
    shippingAddress: {
      label: 'Rumah',
      recipient: 'Andi Pratama',
      phone: '+62 812-3456-7890',
      street: 'Jl. Sudirman No. 123, RT 01/RW 02',
      district: 'Kebayoran Baru',
      city: 'Jakarta Selatan',
      province: 'DKI Jakarta',
      postalCode: '12190',
    },
  },
  {
    id: '4',
    orderNumber: 'INV/ATL/26/09/1304',
    createdAt: '2026-09-13T16:45:00Z',
    status: 'BELUM_BAYAR',
    items: [
      { id: 7, productId: 7, productName: 'Tailoring Blazer', image: '/images/jas.jpeg', price: 1250000, quantity: 1, color: 'Black', size: 'L' },
      { id: 8, productId: 8, productName: 'Sneaker Premium', image: '/images/sepatu(1).jpeg', price: 780000, quantity: 1, color: 'White', size: '42' },
    ],
    subtotal: 2030000,
    shippingFee: 22000,
    discount: 0,
    total: 2052000,
    shippingAddress: {
      label: 'Kantor',
      recipient: 'Andi Pratama',
      phone: '+62 812-3456-7890',
      street: 'Jl. Gatot Subroto No. 45, Lt. 12',
      district: 'Menteng Dalam',
      city: 'Jakarta Selatan',
      province: 'DKI Jakarta',
      postalCode: '12960',
    },
  },
  {
    id: '5',
    orderNumber: 'INV/ATL/26/09/1205',
    createdAt: '2026-09-12T11:00:00Z',
    status: 'DIBATALKAN',
    items: [
      { id: 9, productId: 9, productName: 'Dompet Kulit Artisan', image: '/images/dompet.jpeg', price: 450000, quantity: 1, color: 'Cognac' },
    ],
    subtotal: 450000,
    shippingFee: 15000,
    discount: 0,
    total: 465000,
    shippingAddress: {
      label: 'Rumah',
      recipient: 'Andi Pratama',
      phone: '+62 812-3456-7890',
      street: 'Jl. Sudirman No. 123, RT 01/RW 02',
      district: 'Kebayoran Baru',
      city: 'Jakarta Selatan',
      province: 'DKI Jakarta',
      postalCode: '12190',
    },
  },
];
