import { useState, useRef } from 'react';
import { X, Upload, Trash2, Loader2 } from 'lucide-react';
import type { Category } from '../../types/api';
import {
  CATEGORY_NAME_MAX,
  validateCategoryName,
  uploadCategoryImage,
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

  // Explicit image states
  const [existingImage, setExistingImage] = useState<string | null>(() =>
    isEdit && category?.image ? category.image.trim() : null,
  );
  const [imageUrl, setImageUrl] = useState<string>(() => {
    const initial = isEdit && category?.image ? category.image.trim() : '';
    return initial.startsWith('http://') || initial.startsWith('https://')
      ? initial
      : '';
  });
  const [previewUrl, setPreviewUrl] = useState<string | null>(() =>
    isEdit && category?.image ? category.image.trim() : null,
  );
  const [imageInputMode, setImageInputMode] = useState<'upload' | 'url'>('upload');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadError(null);

    // Validate size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setUploadError('Ukuran file maksimal 5MB.');
      return;
    }

    // Validate mime type
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/avif'];
    if (!validTypes.includes(file.type)) {
      setUploadError('Format tidak didukung. Gunakan JPG, PNG, WEBP, atau AVIF.');
      return;
    }

    // Instant local preview
    const localUrl = URL.createObjectURL(file);
    setPreviewUrl(localUrl);

    setIsUploading(true);
    try {
      const uploadedUrl = await uploadCategoryImage(file);
      setImageUrl(uploadedUrl);
      setExistingImage(null);
      setPreviewUrl(uploadedUrl);
    } catch (err) {
      const msg =
        err instanceof Error && err.message
          ? err.message
          : 'Gagal mengunggah foto.';
      setUploadError(msg);
      setPreviewUrl(existingImage || imageUrl || null);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemoveImage = () => {
    setExistingImage(null);
    setImageUrl('');
    setPreviewUrl(null);
    setUploadError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting || isUploading) return;

    const clientError = validateCategoryName(name);
    if (clientError) {
      setFieldError(clientError);
      return;
    }

    setFieldError(null);
    const finalImage = imageUrl.trim() || existingImage || null;
    await onSubmit({
      name: name.trim(),
      image: finalImage,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      <button
        type="button"
        className="absolute inset-0 bg-black/35 backdrop-blur-[2px]"
        onClick={onClose}
        aria-label="Tutup form kategori"
      />

      <div className="relative z-10 max-h-[92vh] w-full max-w-[460px] overflow-y-auto rounded-t-2xl border border-[#E8E4DC] bg-white shadow-2xl sm:rounded-2xl">
        <header className="sticky top-0 z-10 flex items-start justify-between gap-3 border-b border-[#F0EDE7] bg-white px-5 py-4 sm:px-6">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#8A847B]">
              Admin · Kategori
            </p>
            <h2 className="mt-1 font-editorial text-[22px] font-medium text-[#1A1A1A]">
              {isEdit ? 'Ubah Kategori' : 'Tambah Kategori'}
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
            disabled={isSubmitting || isUploading}
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

          {/* NAMA KATEGORI */}
          <div>
            <label
              htmlFor="category-name"
              className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.1em] text-[#6B6B6B]"
            >
              Nama Kategori <span className="text-[#A05050]">*</span>
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
              disabled={isSubmitting || isUploading}
              maxLength={CATEGORY_NAME_MAX}
              className="h-10 w-full rounded-xl border border-[#EDEAE3] bg-[#FAFAF8] px-3 text-[13px] text-[#1A1A1A] focus:border-[#B7C9D9] focus:bg-white focus:outline-none disabled:opacity-60"
              placeholder="Contoh: Outerwear, Dress, dsb."
              autoFocus
            />
            {fieldError && (
              <p className="mt-1 text-[11px] text-[#A05050]">{fieldError}</p>
            )}
          </div>

          {/* FOTO KATEGORI */}
          <div>
            <div className="mb-2 flex items-center justify-between">
              <label className="text-[11px] font-semibold uppercase tracking-[0.1em] text-[#6B6B6B]">
                Foto Kategori <span className="font-normal lowercase text-[#999]">(opsional)</span>
              </label>

              {/* Mode switch */}
              <div className="inline-flex rounded-lg border border-[#EDEAE3] bg-[#F7F6F2] p-0.5 text-[11px]">
                <button
                  type="button"
                  onClick={() => setImageInputMode('upload')}
                  className={`rounded-md px-2.5 py-0.5 font-medium transition ${
                    imageInputMode === 'upload'
                      ? 'bg-white text-[#1A1A1A] shadow-xs'
                      : 'text-[#6B6B6B] hover:text-[#1A1A1A]'
                  }`}
                >
                  Upload File
                </button>
                <button
                  type="button"
                  onClick={() => setImageInputMode('url')}
                  className={`rounded-md px-2.5 py-0.5 font-medium transition ${
                    imageInputMode === 'url'
                      ? 'bg-white text-[#1A1A1A] shadow-xs'
                      : 'text-[#6B6B6B] hover:text-[#1A1A1A]'
                  }`}
                >
                  URL Gambar
                </button>
              </div>
            </div>

            {/* Hidden native file input */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/avif"
              onChange={handleFileChange}
              className="hidden"
            />

            {imageInputMode === 'upload' ? (
              <div>
                {previewUrl ? (
                  <div className="overflow-hidden rounded-2xl border border-[#EDEAE3] bg-[#FAFAF8] p-3">
                    <div className="flex items-center gap-3.5">
                      <img
                        src={previewUrl}
                        alt="Preview Kategori"
                        className="h-16 w-16 shrink-0 rounded-xl border border-[#E8E4DC] object-cover"
                        onError={() => setUploadError('Gagal memuat preview gambar.')}
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="inline-block rounded-md bg-[#EDE9E2] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-[#4A4A4A]">
                            {existingImage && !imageUrl ? 'Tersimpan' : 'Foto Baru'}
                          </span>
                        </div>
                        <p className="mt-1 truncate text-[11px] text-[#6B6B6B]">
                          {imageUrl || existingImage || 'Berkas lokal dipilih'}
                        </p>
                        <div className="mt-2 flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            disabled={isSubmitting || isUploading}
                            className="inline-flex items-center gap-1 rounded-lg border border-[#EDEAE3] bg-white px-2.5 py-1 text-[11px] font-medium text-[#1A1A1A] shadow-xs transition hover:bg-[#F3F1EC] disabled:opacity-50"
                          >
                            <Upload className="h-3 w-3" />
                            Ganti Foto
                          </button>
                          <button
                            type="button"
                            onClick={handleRemoveImage}
                            disabled={isSubmitting || isUploading}
                            className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-[11px] font-medium text-[#A05050] transition hover:bg-[#FDF2F2] disabled:opacity-50"
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
                          Mengunggah foto kategori...
                        </p>
                      </div>
                    ) : (
                      <>
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#EFECE6] text-[#6B6B6B]">
                          <Upload className="h-5 w-5" />
                        </div>
                        <p className="mt-2 text-[12px] font-semibold text-[#1A1A1A]">
                          Pilih foto kategori dari perangkat
                        </p>
                        <p className="mt-0.5 text-[11px] text-[#8A847B]">
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
                  id="category-image-url"
                  name="image"
                  type="url"
                  value={imageUrl || existingImage || ''}
                  onChange={(e) => {
                    const val = e.target.value;
                    setImageUrl(val);
                    setExistingImage(null);
                    setPreviewUrl(val.trim() || null);
                  }}
                  disabled={isSubmitting || isUploading}
                  className="h-10 w-full rounded-xl border border-[#EDEAE3] bg-[#FAFAF8] px-3 text-[13px] text-[#1A1A1A] focus:border-[#B7C9D9] focus:bg-white focus:outline-none disabled:opacity-60"
                  placeholder="https://example.com/foto-kategori.jpg"
                />
                {previewUrl && (
                  <div className="mt-2 flex items-center gap-3 rounded-xl border border-[#EDEAE3] bg-[#FAFAF8] p-2">
                    <img
                      src={previewUrl}
                      alt="Preview Kategori"
                      className="h-12 w-12 rounded-lg border border-[#E8E4DC] object-cover"
                      onError={() => setUploadError('URL gambar tidak dapat dimuat.')}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[11px] text-[#6B6B6B]">{previewUrl}</p>
                      <button
                        type="button"
                        onClick={handleRemoveImage}
                        className="mt-1 text-[11px] font-medium text-[#A05050] hover:underline"
                      >
                        Hapus
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* ACTIONS */}
          <div className="flex flex-col gap-2 pt-2 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting || isUploading}
              className="rounded-xl border border-[#EDEAE3] px-5 py-2.5 text-[12px] font-semibold text-[#4A4A4A] transition-colors hover:bg-[#F3F1EC] disabled:opacity-50"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting || isUploading}
              className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-[#1A1A1A] px-5 py-2.5 text-[12px] font-semibold uppercase tracking-[0.1em] text-white transition-colors hover:bg-[#333] disabled:opacity-50"
            >
              {(isSubmitting || isUploading) && (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              )}
              {isSubmitting || isUploading
                ? 'Menyimpan...'
                : isEdit
                  ? 'Simpan Perubahan'
                  : 'Buat Kategori'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
