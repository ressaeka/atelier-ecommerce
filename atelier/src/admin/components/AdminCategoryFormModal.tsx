import { useState } from 'react';
import { X } from 'lucide-react';
import type { Category } from '../../types/api';
import {
  CATEGORY_NAME_MAX,
  validateCategoryName,
  type CreateCategoryRequest,
  type UpdateCategoryRequest,
} from '../../lib/categoryApi';

interface AdminCategoryFormModalProps {
  mode: 'create' | 'edit';
  category?: Category | null;
  isSubmitting: boolean;
  errorMessage: string | null;
  onClose: () => void;
  onSubmit: (payload: CreateCategoryRequest | UpdateCategoryRequest) => Promise<void>;
}

export default function AdminCategoryFormModal({
  mode,
  category,
  isSubmitting,
  errorMessage,
  onClose,
  onSubmit,
}: AdminCategoryFormModalProps) {
  const isEdit = mode === 'edit';
  const [name, setName] = useState(() =>
    isEdit && category ? (category.name ?? '') : '',
  );
  const [fieldError, setFieldError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    const clientError = validateCategoryName(name);
    if (clientError) {
      setFieldError(clientError);
      return;
    }

    setFieldError(null);
    await onSubmit({ name: name.trim() });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      <button
        type="button"
        className="absolute inset-0 bg-black/35 backdrop-blur-[2px]"
        onClick={onClose}
        aria-label="Close category form"
      />

      <div className="relative z-10 max-h-[92vh] w-full max-w-[440px] overflow-y-auto rounded-t-2xl border border-[#E8E4DC] bg-white shadow-2xl sm:rounded-2xl">
        <header className="sticky top-0 z-10 flex items-start justify-between gap-3 border-b border-[#F0EDE7] bg-white px-5 py-4 sm:px-6">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#8A847B]">
              Admin · Category
            </p>
            <h2 className="mt-1 font-editorial text-[22px] font-medium text-[#1A1A1A]">
              {isEdit ? 'Edit Category' : 'Add Category'}
            </h2>
            {isEdit && category && (
              <p className="mt-0.5 text-[12px] text-[#6B6B6B]">
                #{category.id} · {category.name}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="rounded-lg border border-[#EDEAE3] p-2 text-[#6B6B6B] transition-colors hover:bg-[#F3F1EC] hover:text-[#1A1A1A] disabled:opacity-50"
            aria-label="Close"
          >
            <X size={16} />
          </button>
        </header>

        <form onSubmit={handleSubmit} className="space-y-4 px-5 py-5 sm:px-6">
          {errorMessage && (
            <div className="rounded-xl border border-[#F3B0A3] bg-[#FBD9D3] px-4 py-3 text-[12px] font-medium text-[#8C3A1E]">
              {errorMessage}
            </div>
          )}

          <div>
            <label
              htmlFor="category-name"
              className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.1em] text-[#6B6B6B]"
            >
              Category Name <span className="text-[#A05050]">*</span>
            </label>
            <input
              id="category-name"
              name="name"
              type="text"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (fieldError) setFieldError(null);
              }}
              disabled={isSubmitting}
              maxLength={CATEGORY_NAME_MAX}
              className="h-10 w-full rounded-xl border border-[#EDEAE3] bg-[#FAFAF8] px-3 text-[13px] text-[#1A1A1A] focus:border-[#B7C9D9] focus:bg-white focus:outline-none disabled:opacity-60"
              placeholder="Category name"
              autoFocus
            />
            {fieldError && (
              <p className="mt-1 text-[11px] text-[#A05050]">{fieldError}</p>
            )}
          </div>

          <div className="flex flex-col gap-2 pt-2 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="rounded-xl border border-[#EDEAE3] px-5 py-2.5 text-[12px] font-semibold text-[#4A4A4A] transition-colors hover:bg-[#F3F1EC] disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-xl bg-[#1A1A1A] px-5 py-2.5 text-[12px] font-semibold uppercase tracking-[0.1em] text-white transition-colors hover:bg-[#333] disabled:opacity-50"
            >
              {isSubmitting
                ? 'Saving...'
                : isEdit
                  ? 'Save Changes'
                  : 'Create Category'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
