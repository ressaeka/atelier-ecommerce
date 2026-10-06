import { AlertTriangle } from 'lucide-react';
import type { Category } from '../../types/api';

interface AdminCategoryDeleteDialogProps {
  category: Category;
  isDeleting: boolean;
  errorMessage: string | null;
  onClose: () => void;
  onConfirm: () => Promise<void>;
}

export default function AdminCategoryDeleteDialog({
  category,
  isDeleting,
  errorMessage,
  onClose,
  onConfirm,
}: AdminCategoryDeleteDialogProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      <button
        type="button"
        className="absolute inset-0 bg-black/35 backdrop-blur-[2px]"
        onClick={onClose}
        aria-label="Cancel delete category"
      />

      <div className="relative z-10 w-full max-w-[420px] rounded-t-2xl border border-[#E8E4DC] bg-white p-6 shadow-2xl sm:rounded-2xl">
        <div className="flex items-start gap-3">
          <div className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#FBD9D3] text-[#A05050]">
            <AlertTriangle size={18} strokeWidth={1.8} />
          </div>
          <div>
            <h2 className="font-editorial text-[20px] font-medium text-[#1A1A1A]">
              Delete category?
            </h2>
            <p className="mt-1.5 text-[13px] leading-relaxed text-[#6B6B6B]">
              Are you sure you want to delete this category?
            </p>
            <p className="mt-1.5 text-[12px] font-medium text-[#8C3A1E]">
              This action cannot be undone.
            </p>
            <p className="mt-2 text-[12px] text-[#8A847B]">
              {category.name} · #{category.id}
            </p>
          </div>
        </div>

        {errorMessage && (
          <p className="mt-4 rounded-xl border border-[#F3B0A3] bg-[#FBD9D3] px-3 py-2 text-[12px] font-medium text-[#8C3A1E]">
            {errorMessage}
          </p>
        )}

        <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            disabled={isDeleting}
            className="rounded-xl border border-[#EDEAE3] px-5 py-2.5 text-[12px] font-semibold text-[#4A4A4A] transition-colors hover:bg-[#F3F1EC] disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => {
              void onConfirm();
            }}
            disabled={isDeleting}
            className="rounded-xl bg-[#A05050] px-5 py-2.5 text-[12px] font-semibold uppercase tracking-[0.1em] text-white transition-colors hover:bg-[#8C3A1E] disabled:opacity-50"
          >
            {isDeleting ? 'Deleting...' : 'Delete'}
          </button>
        </div>
      </div>
    </div>
  );
}
