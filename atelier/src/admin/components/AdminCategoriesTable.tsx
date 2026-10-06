import { useState } from 'react';
import { ChevronLeft, ChevronRight, Tags } from 'lucide-react';
import type { Category, PaginationMeta } from '../../types/api';

interface AdminCategoriesTableProps {
  categories: Category[];
  meta: PaginationMeta | null;
  page: number;
  isLoading: boolean;
  error: string | null;
  deletingCategoryId: number | null;
  onRetry: () => void;
  onPageChange: (page: number) => void;
  onEdit: (category: Category) => void;
  onDelete: (category: Category) => void;
  onCreate: () => void;
}

function formatDate(value: string | Date): string {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(date);
}

export default function AdminCategoriesTable({
  categories,
  meta,
  page,
  isLoading,
  error,
  deletingCategoryId,
  onRetry,
  onPageChange,
  onEdit,
  onDelete,
  onCreate,
}: AdminCategoriesTableProps) {
  const [hoveredId, setHoveredId] = useState<number | null>(null);

  if (error) {
    return (
      <div className="flex min-h-[40vh] flex-col items-center justify-center rounded-2xl border border-[#F3B0A3] bg-white px-6 text-center">
        <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-[#FBD9D3] text-[#A05050]">
          <Tags size={20} strokeWidth={1.6} />
        </div>
        <p className="font-editorial text-[17px] text-[#1A1A1A]">
          Failed to load categories
        </p>
        <p className="mt-2 max-w-sm text-[12px] text-[#8A847B]">
          Something went wrong while loading categories.
        </p>
        <button
          type="button"
          onClick={onRetry}
          className="mt-5 rounded-xl bg-[#1A1A1A] px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-white transition-colors hover:bg-[#333]"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (isLoading && categories.length === 0) {
    return (
      <div className="overflow-hidden rounded-2xl border border-[#E8E4DC] bg-white">
        <div className="border-b border-[#F0EDE7] px-5 py-4 sm:px-6">
          <p className="text-[11px] uppercase tracking-[0.22em] text-[#8A847B]">
            Loading categories…
          </p>
        </div>
        <div className="space-y-3 px-5 py-4 sm:px-6">
          {[0, 1, 2, 3].map((row) => (
            <div
              key={row}
              className="h-11 animate-pulse rounded-xl bg-[#F3F1EC]"
              style={{ opacity: 1 - row * 0.15 }}
            />
          ))}
        </div>
      </div>
    );
  }

  if (!isLoading && categories.length === 0) {
    return (
      <div className="flex min-h-[40vh] flex-col items-center justify-center rounded-2xl border border-[#E8E4DC] bg-white px-6 text-center">
        <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-[#EEF4F9] text-[#4A7BA8]">
          <Tags size={20} strokeWidth={1.6} />
        </div>
        <p className="font-editorial text-[17px] text-[#1A1A1A]">
          No categories yet
        </p>
        <p className="mt-2 max-w-sm text-[12px] text-[#8A847B]">
          Create your first product category to organize your products.
        </p>
        <button
          type="button"
          onClick={onCreate}
          className="mt-5 rounded-xl bg-[#1A1A1A] px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-white transition-colors hover:bg-[#333]"
        >
          Create Category
        </button>
      </div>
    );
  }

  return (
    <section className="overflow-hidden rounded-2xl border border-[#E8E4DC] bg-white shadow-[0_1px_2px_rgba(26,26,26,0.03)]">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#F0EDE7] px-5 py-4 sm:px-6">
        <h2 className="font-editorial text-[18px] font-medium tracking-tight text-[#1A1A1A]">
          Categories
        </h2>
        <span className="text-[11px] uppercase tracking-[0.1em] text-[#8A847B]">
          {meta?.total != null
            ? `${meta.total} categories`
            : `${categories.length} categories`}
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] border-collapse text-left">
          <thead>
            <tr className="border-b border-[#F0EDE7] bg-[#FAFAF8]">
              {['Category Name', 'Active Products', 'Created Date', 'Actions'].map(
                (col) => (
                  <th
                    key={col}
                    className="whitespace-nowrap px-4 py-3 text-[10.5px] font-semibold uppercase tracking-[0.1em] text-[#8A847B]"
                  >
                    {col}
                  </th>
                ),
              )}
            </tr>
          </thead>
          <tbody>
            {categories.map((category) => (
              <tr
                key={category.id}
                onMouseEnter={() => setHoveredId(category.id)}
                onMouseLeave={() => setHoveredId(null)}
                className="border-b border-[#F5F2EC] transition-colors last:border-0 hover:bg-[#FCFBF9]"
              >
                <td className="px-4 py-3.5">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-[#EDEAE3] bg-[#F7F6F2] text-[#8A847B]">
                      <Tags size={14} strokeWidth={1.6} />
                    </div>
                    <p className="text-[12.5px] font-medium text-[#1A1A1A]">
                      {category.name || '-'}
                    </p>
                  </div>
                </td>
                <td className="whitespace-nowrap px-4 py-3.5 text-[12.5px] text-[#4A4A4A]">
                  {category.productCount ?? 0}
                </td>
                <td className="whitespace-nowrap px-4 py-3.5 text-[12.5px] text-[#6B6B6B]">
                  {formatDate(category.createdAt)}
                </td>
                <td className="px-4 py-3.5">
                  <div
                    className={`flex items-center gap-1.5 transition-opacity ${
                      hoveredId === category.id || deletingCategoryId === category.id
                        ? 'opacity-100'
                        : 'opacity-70'
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => onEdit(category)}
                      className="rounded-lg border border-[#D9E3EC] bg-[#F4F8FB] px-2.5 py-1.5 text-[11px] font-semibold text-[#2F5D86] transition-colors hover:bg-[#E8F1F8]"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => onDelete(category)}
                      disabled={deletingCategoryId === category.id}
                      className="rounded-lg border border-[#F3B0A3] bg-[#FBD9D3] px-2.5 py-1.5 text-[11px] font-semibold text-[#8C3A1E] transition-colors hover:bg-[#F5C4BC] disabled:opacity-50"
                    >
                      {deletingCategoryId === category.id ? '...' : 'Delete'}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {meta && meta.totalPages > 1 && (
        <div className="flex flex-col gap-4 border-t border-[#F0EDE7] px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <p className="text-[12px] text-[#8A847B]">
            Page {meta.page} / {Math.max(meta.totalPages, 1)} ·{' '}
            {categories.length} categories on this page
          </p>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => onPageChange(Math.max(page - 1, 1))}
              disabled={page <= 1 || isLoading}
              className="flex h-8 items-center gap-1 rounded-lg px-2 text-[12px] font-medium text-[#6B6B6B] transition-colors hover:bg-[#F3F1EC] disabled:cursor-not-allowed disabled:opacity-40"
              aria-label="Previous page"
            >
              <ChevronLeft size={14} />
              Previous
            </button>

            {Array.from({ length: Math.min(meta.totalPages, 5) }, (_, i) => {
              const start =
                meta.totalPages <= 5
                  ? 1
                  : Math.min(
                      Math.max(page - 2, 1),
                      Math.max(meta.totalPages - 4, 1),
                    );
              const pageNum = start + i;
              if (pageNum > meta.totalPages) return null;
              return (
                <button
                  key={pageNum}
                  type="button"
                  onClick={() => onPageChange(pageNum)}
                  disabled={isLoading}
                  className={`h-8 min-w-8 rounded-lg px-2 text-[12px] font-medium transition-colors ${
                    page === pageNum
                      ? 'bg-[#EEF4F9] text-[#2F5D86]'
                      : 'text-[#6B6B6B] hover:bg-[#F3F1EC]'
                  }`}
                >
                  {pageNum}
                </button>
              );
            })}

            <button
              type="button"
              onClick={() =>
                onPageChange(Math.min(page + 1, meta.totalPages || 1))
              }
              disabled={page >= (meta.totalPages || 1) || isLoading}
              className="flex h-8 items-center gap-1 rounded-lg px-2 text-[12px] font-medium text-[#6B6B6B] transition-colors hover:bg-[#F3F1EC] disabled:cursor-not-allowed disabled:opacity-40"
              aria-label="Next page"
            >
              Next
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
