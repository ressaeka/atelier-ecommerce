import { AlertTriangle } from 'lucide-react';
import type { AdminProductItem } from '../hooks/useAdminProducts';

interface AdminProductDeleteDialogProps {
  product: AdminProductItem;
  isDeleting: boolean;
  errorMessage: string | null;
  onClose: () => void;
  onConfirm: () => Promise<void>;
}

export default function AdminProductDeleteDialog({
  product,
  isDeleting,
  errorMessage,
  onClose,
  onConfirm,
}: AdminProductDeleteDialogProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      <button
        type="button"
        className="absolute inset-0 bg-black/35 backdrop-blur-[2px]"
        onClick={onClose}
        aria-label="Batal hapus produk"
      />

      <div className="relative z-10 w-full max-w-[420px] rounded-t-2xl border border-[#E8E4DC] bg-white p-6 shadow-2xl sm:rounded-2xl">
        <div className="flex items-start gap-3">
          <div className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#FBD9D3] text-[#A05050]">
            <AlertTriangle size={18} strokeWidth={1.8} />
          </div>
          <div>
            <h2 className="font-editorial text-[20px] font-medium text-[#1A1A1A]">
              Hapus produk ini?
            </h2>
            <p className="mt-1.5 text-[13px] leading-relaxed text-[#6B6B6B]">
              Produk yang dihapus tidak dapat dikembalikan.
            </p>
            <p className="mt-2 text-[12px] text-[#8A847B]">
              {product.name} · #{product.id}
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
            Batal
          </button>
          <button
            type="button"
            onClick={() => {
              void onConfirm();
            }}
            disabled={isDeleting}
            className="rounded-xl bg-[#A05050] px-5 py-2.5 text-[12px] font-semibold uppercase tracking-[0.1em] text-white transition-colors hover:bg-[#8C3A1E] disabled:opacity-50"
          >
            {isDeleting ? 'Menghapus...' : 'Hapus'}
          </button>
        </div>
      </div>
    </div>
  );
}
