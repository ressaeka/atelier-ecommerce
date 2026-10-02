import { useState } from 'react';
import { X } from 'lucide-react';
import type { Category } from '../../types/api';
import type { AdminProductItem } from '../hooks/useAdminProducts';
import type { CreateProductRequest, UpdateProductRequest } from '../../lib/productApi';
import {
  validateCreateProductPayload,
  validateUpdateProductPayload,
} from '../../lib/productApi';

interface AdminProductFormModalProps {
  mode: 'create' | 'edit';
  product?: AdminProductItem | null;
  categories: Category[];
  isSubmitting: boolean;
  errorMessage: string | null;
  onClose: () => void;
  onSubmit: (payload: CreateProductRequest | UpdateProductRequest) => Promise<void>;
}

interface FormState {
  name: string;
  description: string;
  price: string;
  stock: string;
  image: string;
  categoryId: string;
}

function emptyForm(): FormState {
  return {
    name: '',
    description: '',
    price: '',
    stock: '0',
    image: '',
    categoryId: '',
  };
}

function formFromProduct(product: AdminProductItem): FormState {
  return {
    name: product.name ?? '',
    description: product.description ?? '',
    price: String(product.price ?? ''),
    stock: String(product.stock ?? 0),
    image: product.image ?? '',
    categoryId: String(product.categoryId ?? ''),
  };
}

export default function AdminProductFormModal({
  mode,
  product,
  categories,
  isSubmitting,
  errorMessage,
  onClose,
  onSubmit,
}: AdminProductFormModalProps) {
  const isEdit = mode === 'edit';
  const [form, setForm] = useState<FormState>(() =>
    isEdit && product ? formFromProduct(product) : emptyForm(),
  );
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<keyof FormState, string>>>({});

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (fieldErrors[name as keyof FormState]) {
      setFieldErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    const errors: Partial<Record<keyof FormState, string>> = {};

    if (!form.name.trim()) {
      errors.name = 'Nama produk wajib diisi.';
    }
    if (!form.image.trim()) {
      errors.image = 'Alamat gambar wajib diisi.';
    }
    if (form.categoryId === '') {
      errors.categoryId = 'Kategori wajib dipilih.';
    }

    const price = Number(form.price);
    const stock = Number(form.stock);

    if (form.price === '' || !Number.isInteger(price) || price <= 0) {
      errors.price = 'Harga harus lebih dari 0.';
    }
    if (form.stock === '' || !Number.isInteger(stock) || stock < 0) {
      errors.stock = 'Stok harus bilangan bulat minimal 0.';
    }

    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;

    const categoryId = Number(form.categoryId);

    if (isEdit) {
      // UpdateProductDto — send only defined fields from the form
      const payload: UpdateProductRequest = {
        name: form.name.trim(),
        description: form.description.trim() || undefined,
        price,
        stock,
        image: form.image.trim(),
        categoryId,
      };

      const clientError = validateUpdateProductPayload(payload);
      if (clientError) {
        setFieldErrors({ image: clientError });
        return;
      }

      await onSubmit(payload);
      return;
    }

    const payload: CreateProductRequest = {
      name: form.name.trim(),
      description: form.description.trim() || undefined,
      price,
      stock,
      image: form.image.trim(),
      categoryId,
    };

    const clientError = validateCreateProductPayload(payload);
    if (clientError) {
      setFieldErrors({ image: clientError });
      return;
    }

    await onSubmit(payload);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      <button
        type="button"
        className="absolute inset-0 bg-black/35 backdrop-blur-[2px]"
        onClick={onClose}
        aria-label="Tutup form produk"
      />

      <div className="relative z-10 max-h-[92vh] w-full max-w-[560px] overflow-y-auto rounded-t-2xl border border-[#E8E4DC] bg-white shadow-2xl sm:rounded-2xl">
        <header className="sticky top-0 z-10 flex items-start justify-between gap-3 border-b border-[#F0EDE7] bg-white px-5 py-4 sm:px-6">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#8A847B]">
              Admin · Produk
            </p>
            <h2 className="mt-1 font-editorial text-[22px] font-medium text-[#1A1A1A]">
              {isEdit ? 'Ubah Produk' : 'Tambah Produk'}
            </h2>
            {isEdit && product && (
              <p className="mt-0.5 text-[12px] text-[#6B6B6B]">
                #{product.id} · {product.name}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="rounded-lg border border-[#EDEAE3] p-2 text-[#6B6B6B] transition-colors hover:bg-[#F3F1EC] hover:text-[#1A1A1A] disabled:opacity-50"
            aria-label="Tutup"
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
              htmlFor="product-name"
              className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.1em] text-[#6B6B6B]"
            >
              Nama Produk <span className="text-[#A05050]">*</span>
            </label>
            <input
              id="product-name"
              name="name"
              type="text"
              value={form.name}
              onChange={handleChange}
              disabled={isSubmitting}
              maxLength={100}
              className="h-10 w-full rounded-xl border border-[#EDEAE3] bg-[#FAFAF8] px-3 text-[13px] text-[#1A1A1A] focus:border-[#B7C9D9] focus:bg-white focus:outline-none disabled:opacity-60"
              placeholder="Nama produk"
            />
            {fieldErrors.name && (
              <p className="mt-1 text-[11px] text-[#A05050]">{fieldErrors.name}</p>
            )}
          </div>

          <div>
            <label
              htmlFor="product-description"
              className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.1em] text-[#6B6B6B]"
            >
              Deskripsi
            </label>
            <textarea
              id="product-description"
              name="description"
              value={form.description}
              onChange={handleChange}
              disabled={isSubmitting}
              rows={3}
              className="w-full rounded-xl border border-[#EDEAE3] bg-[#FAFAF8] px-3 py-2.5 text-[13px] text-[#1A1A1A] focus:border-[#B7C9D9] focus:bg-white focus:outline-none disabled:opacity-60"
              placeholder="Deskripsi produk (opsional)"
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label
                htmlFor="product-price"
                className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.1em] text-[#6B6B6B]"
              >
                Harga (Rp) <span className="text-[#A05050]">*</span>
              </label>
              <input
                id="product-price"
                name="price"
                type="number"
                inputMode="numeric"
                min={1}
                step={1}
                value={form.price}
                onChange={handleChange}
                disabled={isSubmitting}
                className="h-10 w-full rounded-xl border border-[#EDEAE3] bg-[#FAFAF8] px-3 text-[13px] text-[#1A1A1A] focus:border-[#B7C9D9] focus:bg-white focus:outline-none disabled:opacity-60"
                placeholder="150000"
              />
              {fieldErrors.price && (
                <p className="mt-1 text-[11px] text-[#A05050]">{fieldErrors.price}</p>
              )}
            </div>

            <div>
              <label
                htmlFor="product-stock"
                className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.1em] text-[#6B6B6B]"
              >
                Stok <span className="text-[#A05050]">*</span>
              </label>
              <input
                id="product-stock"
                name="stock"
                type="number"
                inputMode="numeric"
                min={0}
                step={1}
                value={form.stock}
                onChange={handleChange}
                disabled={isSubmitting}
                className="h-10 w-full rounded-xl border border-[#EDEAE3] bg-[#FAFAF8] px-3 text-[13px] text-[#1A1A1A] focus:border-[#B7C9D9] focus:bg-white focus:outline-none disabled:opacity-60"
                placeholder="10"
              />
              {fieldErrors.stock && (
                <p className="mt-1 text-[11px] text-[#A05050]">{fieldErrors.stock}</p>
              )}
            </div>
          </div>

          <div>
            <label
              htmlFor="product-category"
              className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.1em] text-[#6B6B6B]"
            >
              Kategori <span className="text-[#A05050]">*</span>
            </label>
            <select
              id="product-category"
              name="categoryId"
              value={form.categoryId}
              onChange={handleChange}
              disabled={isSubmitting || categories.length === 0}
              className="h-10 w-full rounded-xl border border-[#EDEAE3] bg-[#FAFAF8] px-3 text-[13px] text-[#1A1A1A] focus:border-[#B7C9D9] focus:bg-white focus:outline-none disabled:opacity-60"
            >
              <option value="">
                {categories.length === 0
                  ? 'Kategori tidak tersedia'
                  : 'Pilih kategori'}
              </option>
              {categories.map((category) => (
                <option key={category.id} value={String(category.id)}>
                  {category.name}
                </option>
              ))}
            </select>
            {fieldErrors.categoryId && (
              <p className="mt-1 text-[11px] text-[#A05050]">
                {fieldErrors.categoryId}
              </p>
            )}
            {categories.length === 0 && (
              <p className="mt-1 text-[11px] text-[#8A847B]">
                Belum ada kategori. Tambahkan kategori terlebih dahulu.
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="product-image"
              className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.1em] text-[#6B6B6B]"
            >
              Image URL <span className="text-[#A05050]">*</span>
            </label>
            <input
              id="product-image"
              name="image"
              type="url"
              value={form.image}
              onChange={handleChange}
              disabled={isSubmitting}
              className="h-10 w-full rounded-xl border border-[#EDEAE3] bg-[#FAFAF8] px-3 text-[13px] text-[#1A1A1A] focus:border-[#B7C9D9] focus:bg-white focus:outline-none disabled:opacity-60"
              placeholder="https://example.com/product.jpg"
            />
            {fieldErrors.image && (
              <p className="mt-1 text-[11px] text-[#A05050]">{fieldErrors.image}</p>
            )}
            <p className="mt-1 text-[11px] text-[#8A847B]">
              Masukkan alamat gambar yang sudah diunggah.
            </p>
          </div>

          <div className="flex flex-col gap-2 pt-2 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="rounded-xl border border-[#EDEAE3] px-5 py-2.5 text-[12px] font-semibold text-[#4A4A4A] transition-colors hover:bg-[#F3F1EC] disabled:opacity-50"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting || categories.length === 0}
              className="rounded-xl bg-[#1A1A1A] px-5 py-2.5 text-[12px] font-semibold uppercase tracking-[0.1em] text-white transition-colors hover:bg-[#333] disabled:opacity-50"
            >
              {isSubmitting
                ? 'Menyimpan...'
                : isEdit
                  ? 'Simpan Produk'
                  : 'Tambah Produk'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
