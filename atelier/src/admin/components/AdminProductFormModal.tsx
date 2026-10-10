import { useState, useRef } from 'react';
import {
  X,
  Upload,
  Image as ImageIcon,
  Trash2,
  CheckCircle2,
  Loader2,
  Link as LinkIcon,
} from 'lucide-react';
import type { Category } from '../../types/api';
import type { AdminProductItem } from '../hooks/useAdminProducts';
import type { CreateProductRequest, UpdateProductRequest } from '../../lib/productApi';
import {
  validateCreateProductPayload,
  validateUpdateProductPayload,
  uploadProductImage,
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
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(() => product?.image || null);
  const [imageInputMode, setImageInputMode] = useState<'upload' | 'url'>('upload');
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadError(null);

    // Validasi ukuran berkas (maks 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setUploadError('Ukuran file maksimal 5MB.');
      return;
    }

    // Validasi format berkas
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/avif'];
    if (!validTypes.includes(file.type)) {
      setUploadError('Format tidak didukung. Gunakan JPG, PNG, WEBP, atau AVIF.');
      return;
    }

    // Tampilkan pratinjau lokal instan
    const localUrl = URL.createObjectURL(file);
    setPreviewUrl(localUrl);

    setIsUploading(true);
    try {
      const res = await uploadProductImage(file);
      setForm((prev) => ({ ...prev, image: res.url }));
      setPreviewUrl(res.url);
      if (fieldErrors.image) {
        setFieldErrors((prev) => ({ ...prev, image: undefined }));
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Gagal mengunggah foto.';
      setUploadError(msg);
      // Batalkan preview jika upload gagal dan belum ada gambar tersimpan
      if (!form.image) {
        setPreviewUrl(null);
      }
    } finally {
      setIsUploading(false);
      // Reset input agar dapat memilih berkas yang sama jika diinginkan
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemoveImage = () => {
    setForm((prev) => ({ ...prev, image: '' }));
    setPreviewUrl(null);
    setUploadError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

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
                No categories yet. Buat kategori di halaman Kategori terlebih dahulu.
              </p>
            )}
          </div>

          <div>
            <div className="mb-2 flex items-center justify-between">
              <label className="block text-[11px] font-semibold uppercase tracking-[0.1em] text-[#6B6B6B]">
                Foto Produk <span className="text-[#A05050]">*</span>
              </label>
              <div className="flex rounded-lg border border-[#EDEAE3] bg-[#F7F5F0] p-0.5 text-[11px]">
                <button
                  type="button"
                  onClick={() => setImageInputMode('upload')}
                  className={`flex items-center gap-1 rounded-md px-2.5 py-1 font-medium transition-colors ${
                    imageInputMode === 'upload'
                      ? 'bg-white text-[#1A1A1A] shadow-sm'
                      : 'text-[#8A847B] hover:text-[#1A1A1A]'
                  }`}
                >
                  <Upload className="h-3 w-3" />
                  Upload
                </button>
                <button
                  type="button"
                  onClick={() => setImageInputMode('url')}
                  className={`flex items-center gap-1 rounded-md px-2.5 py-1 font-medium transition-colors ${
                    imageInputMode === 'url'
                      ? 'bg-white text-[#1A1A1A] shadow-sm'
                      : 'text-[#8A847B] hover:text-[#1A1A1A]'
                  }`}
                >
                  <LinkIcon className="h-3 w-3" />
                  URL
                </button>
              </div>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/avif"
              onChange={handleFileChange}
              disabled={isSubmitting || isUploading}
              className="hidden"
            />

            {imageInputMode === 'upload' ? (
              <div>
                {previewUrl ? (
                  <div className="relative overflow-hidden rounded-2xl border border-[#EDEAE3] bg-[#FAFAF8] p-3">
                    <div className="flex items-center gap-4">
                      <div className="relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-xl border border-[#E5E0D8] bg-white">
                        <img
                          src={previewUrl}
                          alt="Pratinjau produk"
                          className="h-full w-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none';
                          }}
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 text-[12px] font-semibold text-[#2D5A27]">
                          <CheckCircle2 className="h-3.5 w-3.5 text-[#2D5A27]" />
                          Foto Siap Disimpan
                        </div>
                        <p className="mt-0.5 truncate text-[11px] text-[#8A847B]">
                          {form.image}
                        </p>
                        <div className="mt-2.5 flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            disabled={isSubmitting || isUploading}
                            className="inline-flex items-center gap-1 rounded-lg border border-[#EDEAE3] bg-white px-2.5 py-1 text-[11px] font-medium text-[#4A4A4A] shadow-sm transition hover:bg-[#F7F5F0] disabled:opacity-50"
                          >
                            <Upload className="h-3 w-3" />
                            Ganti Foto
                          </button>
                          <button
                            type="button"
                            onClick={handleRemoveImage}
                            disabled={isSubmitting || isUploading}
                            className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-medium text-[#A05050] transition hover:bg-[#FDF2F2] disabled:opacity-50"
                          >
                            <Trash2 className="h-3 w-3" />
                            Hapus
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div
                    onClick={() => {
                      if (!isUploading && !isSubmitting) {
                        fileInputRef.current?.click();
                      }
                    }}
                    className={`flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-[#DDD7CD] bg-[#FAFAF8] px-4 py-6 text-center transition hover:border-[#1A1A1A] hover:bg-[#F5F2EB] ${
                      isUploading ? 'cursor-not-allowed opacity-75' : ''
                    }`}
                  >
                    {isUploading ? (
                      <div className="flex flex-col items-center py-2">
                        <Loader2 className="h-6 w-6 animate-spin text-[#1A1A1A]" />
                        <p className="mt-2 text-[12px] font-medium text-[#4A4A4A]">
                          Mengunggah foto ke server...
                        </p>
                      </div>
                    ) : (
                      <>
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#EFECE6] text-[#6B6B6B]">
                          <Upload className="h-5 w-5" />
                        </div>
                        <p className="mt-2.5 text-[12px] font-semibold text-[#1A1A1A]">
                          Pilih berkas foto dari perangkat
                        </p>
                        <p className="mt-1 text-[11px] text-[#8A847B]">
                          Format JPG, PNG, WEBP, atau AVIF (Maks. 5MB)
                        </p>
                      </>
                    )}
                  </div>
                )}
                {uploadError && (
                  <p className="mt-1.5 text-[11px] text-[#A05050]">{uploadError}</p>
                )}
              </div>
            ) : (
              <div>
                <input
                  id="product-image"
                  name="image"
                  type="url"
                  value={form.image}
                  onChange={(e) => {
                    handleChange(e);
                    setPreviewUrl(e.target.value.trim() || null);
                  }}
                  disabled={isSubmitting}
                  className="h-10 w-full rounded-xl border border-[#EDEAE3] bg-[#FAFAF8] px-3 text-[13px] text-[#1A1A1A] focus:border-[#B7C9D9] focus:bg-white focus:outline-none disabled:opacity-60"
                  placeholder="https://images.unsplash.com/photo-..."
                />
                {previewUrl && (
                  <div className="mt-2 flex items-center gap-3 rounded-xl border border-[#EDEAE3] bg-[#FAFAF8] p-2">
                    <img
                      src={previewUrl}
                      alt="Preview"
                      className="h-12 w-12 rounded-lg object-cover"
                      onError={() => setPreviewUrl(null)}
                    />
                    <p className="truncate text-[11px] text-[#8A847B]">
                      Pratinjau tautan gambar
                    </p>
                  </div>
                )}
              </div>
            )}

            {fieldErrors.image && (
              <p className="mt-1.5 text-[11px] text-[#A05050]">
                {fieldErrors.image}
              </p>
            )}
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
