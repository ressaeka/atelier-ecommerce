/**
 * Category admin API layer — existing endpoints only.
 * Uses shared axios client in src/lib/api.ts.
 *
 * GET    /category            (public list — pagination + search)
 * POST   /category            (ADMIN + category:create)
 * PATCH  /category/:id        (ADMIN + category:update)
 * DELETE /category/:id        (ADMIN + category:delete)
 */

import { api } from './api';
import type { Category, PaginationMeta } from '../types/api';

/** Matches CreateCategoryDto / updateCategorySchema on backend */
export interface CreateCategoryRequest {
  name: string;
}

export interface UpdateCategoryRequest {
  name: string;
}

export interface CategoryListResponse {
  items: Category[];
  meta: PaginationMeta;
}

export const CATEGORY_NAME_MAX = 50;

export async function getCategoriesPage(params: {
  page?: number;
  limit?: number;
  search?: string;
}): Promise<CategoryListResponse> {
  const data = await api.get<CategoryListResponse>('/category', {
    page: params.page ?? 1,
    limit: params.limit ?? 10,
    search: params.search?.trim() || undefined,
  });

  return {
    items: Array.isArray(data?.items) ? data.items : [],
    meta: data?.meta ?? {
      page: params.page ?? 1,
      limit: params.limit ?? 10,
      total: 0,
      totalPages: 0,
    },
  };
}

/** Dropdown list for Product Add/Edit — same GET /category endpoint */
export async function getCategories(): Promise<Category[]> {
  const data = await api.get<CategoryListResponse>('/category', {
    page: 1,
    limit: 50,
  });
  return Array.isArray(data?.items) ? data.items : [];
}

export async function createCategory(
  body: CreateCategoryRequest,
): Promise<Category> {
  return api.post<Category>('/category', body);
}

export async function updateCategory(
  id: number,
  body: UpdateCategoryRequest,
): Promise<Category> {
  return api.patch<Category>(`/category/${id}`, body);
}

export async function deleteCategory(id: number): Promise<Category> {
  return api.delete<Category>(`/category/${id}`);
}

/** Client-side validation aligned with backend Zod schemas */
export function validateCategoryName(name: string): string | null {
  const trimmed = name.trim();
  if (!trimmed) return 'Category name is required.';
  if (trimmed.length > CATEGORY_NAME_MAX) {
    return `Category name must be ${CATEGORY_NAME_MAX} characters or fewer.`;
  }
  return null;
}

/** Presentation copy for backend delete-in-use conflict (P2003). */
export function toCategoryDeleteError(message: string | null | undefined): string {
  if (!message) {
    return 'Unable to delete this category because it is still being used by products.';
  }

  const lower = message.toLowerCase();
  if (
    lower.includes('category') &&
    (lower.includes('product') || lower.includes('masih'))
  ) {
    return 'Unable to delete this category because it is still being used by products.';
  }

  return message;
}
