/**
 * Product admin API layer — existing endpoints only.
 * Uses shared axios client in src/lib/api.ts.
 *
 * GET    /product            (public list)
 * POST   /product            (ADMIN + product:create)
 * PATCH  /product/:id        (ADMIN + product:update)
 * DELETE /product/:id        (ADMIN + product:delete)
 * GET    /category           (public list — categoryId dropdown)
 */

import { api } from './api';
import type { Product } from '../types/api';

export { getCategories } from './categoryApi';

/** Matches CreateProductDto on backend (create-product.dto.ts) */
export interface CreateProductRequest {
  name: string;
  description?: string;
  price: number;
  stock: number;
  image: string;
  categoryId: number;
}

/** Matches UpdateProductDto on backend (update-product.dto.ts) — all optional */
export interface UpdateProductRequest {
  name?: string;
  description?: string;
  price?: number;
  stock?: number;
  image?: string;
  categoryId?: number;
}

export async function createProduct(
  body: CreateProductRequest,
): Promise<Product> {
  return api.post<Product>('/product', body);
}

export async function updateProduct(
  id: number,
  body: UpdateProductRequest,
): Promise<Product> {
  return api.patch<Product>(`/product/${id}`, body);
}

export async function deleteProduct(id: number): Promise<Product> {
  return api.delete<Product>(`/product/${id}`);
}

export async function uploadProductImage(
  file: File,
): Promise<{ url: string; filename: string }> {
  const formData = new FormData();
  formData.append('file', file);
  return api.post<{ url: string; filename: string }>(
    '/product/upload-image',
    formData,
    {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    },
  );
}

/** Client-side validation aligned with backend Zod schemas */
export function validateCreateProductPayload(body: CreateProductRequest): string | null {
  if (!body.name.trim()) return 'Nama produk wajib diisi.';
  if (!Number.isInteger(body.price) || body.price <= 0) {
    return 'Harga harus lebih dari 0.';
  }
  if (!Number.isInteger(body.stock) || body.stock < 0) {
    return 'Stok harus bilangan bulat minimal 0.';
  }
  if (!isValidImageUrl(body.image)) {
    return 'Gambar produk harus berupa file yang valid atau URL (https://...).';
  }
  if (!Number.isInteger(body.categoryId) || body.categoryId <= 0) {
    return 'Category is required.';
  }
  return null;
}

export function validateUpdateProductPayload(
  body: UpdateProductRequest,
): string | null {
  if (body.name !== undefined && !body.name.trim()) {
    return 'Nama produk tidak boleh kosong.';
  }
  if (body.name !== undefined && body.name.length > 100) {
    return 'Nama produk maksimal 100 karakter.';
  }
  if (
    body.price !== undefined &&
    (!Number.isFinite(body.price) || body.price <= 0)
  ) {
    return 'Harga harus lebih dari 0.';
  }
  if (
    body.stock !== undefined &&
    (!Number.isInteger(body.stock) || body.stock < 0)
  ) {
    return 'Stok harus bilangan bulat minimal 0.';
  }
  if (body.image !== undefined && !isValidImageUrl(body.image)) {
    return 'Gambar produk harus berupa file yang valid atau URL (https://...).';
  }
  if (
    body.categoryId !== undefined &&
    (!Number.isInteger(body.categoryId) || body.categoryId <= 0)
  ) {
    return 'Category is invalid.';
  }
  return null;
}

function isValidImageUrl(value: string): boolean {
  if (!value || typeof value !== 'string') return false;
  if (value.startsWith('/uploads/') || value.startsWith('uploads/')) return true;
  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}
