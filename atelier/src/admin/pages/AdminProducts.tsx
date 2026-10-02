import { useState } from 'react';
import { Plus, RefreshCw, Search } from 'lucide-react';
import { useAdminProducts, type AdminProductItem } from '../hooks/useAdminProducts';
import AdminProductsTable from '../components/AdminProductsTable';
import AdminProductFormModal from '../components/AdminProductFormModal';
import AdminProductDeleteDialog from '../components/AdminProductDeleteDialog';
import type {
  CreateProductRequest,
  UpdateProductRequest,
} from '../../lib/productApi';

/**
 * Admin Products (/admin/products)
 * List: GET /product
 * CRUD: POST /product, PATCH /product/:id, DELETE /product/:id
 * Categories: GET /category
 */
export default function AdminProducts() {
  const {
    products,
    categories,
    meta,
    isLoading,
    error,
    page,
    search,
    categoryId,
    refetch,
    setPage,
    setSearch,
    setCategoryId,
    createProduct,
    updateProduct,
    deleteProduct,
    actionError,
    actionSuccess,
    clearActionFeedback,
  } = useAdminProducts();

  const [formMode, setFormMode] = useState<'create' | 'edit' | null>(null);
  const [editingProduct, setEditingProduct] = useState<AdminProductItem | null>(null);
  const [deletingProduct, setDeletingProduct] = useState<AdminProductItem | null>(null);
  const [deletingProductId, setDeletingProductId] = useState<number | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [isSubmittingForm, setIsSubmittingForm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const openCreate = () => {
    clearActionFeedback();
    setFormError(null);
    setEditingProduct(null);
    setFormMode('create');
  };

  const openEdit = (product: AdminProductItem) => {
    clearActionFeedback();
    setFormError(null);
    setEditingProduct(product);
    setFormMode('edit');
  };

  const openDelete = (product: AdminProductItem) => {
    clearActionFeedback();
    setDeleteError(null);
    setDeletingProduct(product);
  };

  const closeForm = () => {
    if (isSubmittingForm) return;
    setFormMode(null);
    setEditingProduct(null);
    setFormError(null);
  };

  const closeDelete = () => {
    if (isDeleting) return;
    setDeletingProduct(null);
    setDeleteError(null);
  };

  const handleFormSubmit = async (
    payload: CreateProductRequest | UpdateProductRequest,
  ) => {
    setIsSubmittingForm(true);
    setFormError(null);
    try {
      if (formMode === 'edit' && editingProduct) {
        await updateProduct(editingProduct.id, payload as UpdateProductRequest);
      } else {
        await createProduct(payload as CreateProductRequest);
      }
      setFormMode(null);
      setEditingProduct(null);
    } catch (err) {
      const message =
        err instanceof Error && err.message
          ? err.message
          : 'Gagal menyimpan produk.';
      setFormError(message);
    } finally {
      setIsSubmittingForm(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deletingProduct) return;
    setIsDeleting(true);
    setDeleteError(null);
    try {
      await deleteProduct(deletingProduct.id);
      setDeletingProduct(null);
      setDeletingProductId(null);
    } catch (err) {
      const message =
        err instanceof Error && err.message
          ? err.message
          : 'Gagal menghapus produk.';
      setDeleteError(message);
      setDeletingProductId(null);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-5">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#8A847B]">
            Admin · Produk
          </p>
          <h1 className="mt-1.5 font-editorial text-[26px] font-medium tracking-tight text-[#1A1A1A] sm:text-[28px]">
            Produk
          </h1>
          <p className="mt-1.5 text-[13px] text-[#6B6B6B]">
            Daftar produk Atelier — kelola tambah, ubah, dan hapus produk.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={refetch}
            disabled={isLoading}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#D9E3EC] bg-[#F4F8FB] px-4 py-2 text-[12px] font-semibold text-[#2F5D86] transition-colors hover:bg-[#E8F1F8] disabled:opacity-50"
          >
            <RefreshCw
              size={14}
              className={isLoading ? 'animate-spin' : undefined}
            />
            Refresh
          </button>
          <button
            type="button"
            onClick={openCreate}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#1A1A1A] px-4 py-2 text-[12px] font-semibold uppercase tracking-[0.08em] text-white transition-colors hover:bg-[#333]"
          >
            <Plus size={14} />
            Tambah Produk
          </button>
        </div>
      </header>

      {actionSuccess && (
        <div
          role="status"
          className="rounded-xl border border-[#BDE0C7] bg-[#E4F4EA] px-4 py-3 text-[12px] font-medium text-[#2C6943]"
        >
          {actionSuccess}
        </div>
      )}
      {actionError && !formError && !deleteError && (
        <div
          role="alert"
          className="rounded-xl border border-[#F3B0A3] bg-[#FBD9D3] px-4 py-3 text-[12px] font-medium text-[#8C3A1E]"
        >
          {actionError}
        </div>
      )}

      {/* Search + category filter — existing GET /product query params */}
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search
            size={16}
            className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[#A39E95]"
          />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari nama produk..."
            className="h-11 w-full rounded-xl border border-[#E8E4DC] bg-white pl-10 pr-4 text-[13px] text-[#1A1A1A] placeholder:text-[#A39E95] focus:border-[#B7C9D9] focus:outline-none"
          />
        </div>

        <select
          value={categoryId === 'ALL' ? 'ALL' : String(categoryId)}
          onChange={(e) => {
            const value = e.target.value;
            setCategoryId(value === 'ALL' ? 'ALL' : Number(value));
          }}
          aria-label="Filter kategori"
          className="h-11 rounded-xl border border-[#E8E4DC] bg-white px-3 text-[13px] text-[#1A1A1A] focus:border-[#B7C9D9] focus:outline-none"
        >
          <option value="ALL">Semua kategori</option>
          {categories.map((category) => (
            <option key={category.id} value={String(category.id)}>
              {category.name}
            </option>
          ))}
        </select>
      </div>

      <AdminProductsTable
        products={products}
        meta={meta}
        page={page}
        isLoading={isLoading}
        error={error}
        deletingProductId={deletingProduct?.id ?? deletingProductId}
        onRetry={refetch}
        onPageChange={setPage}
        onEdit={openEdit}
        onDelete={openDelete}
      />

      {formMode && (
        <AdminProductFormModal
          mode={formMode}
          product={editingProduct}
          categories={categories}
          isSubmitting={isSubmittingForm}
          errorMessage={formError}
          onClose={closeForm}
          onSubmit={handleFormSubmit}
        />
      )}

      {deletingProduct && (
        <AdminProductDeleteDialog
          product={deletingProduct}
          isDeleting={isDeleting}
          errorMessage={deleteError}
          onClose={closeDelete}
          onConfirm={handleDeleteConfirm}
        />
      )}
    </div>
  );
}
