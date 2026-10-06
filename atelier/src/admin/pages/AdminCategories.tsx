import { useState } from 'react';
import { Plus, RefreshCw, Search } from 'lucide-react';
import { useAdminCategories } from '../hooks/useAdminCategories';
import AdminCategoriesTable from '../components/AdminCategoriesTable';
import AdminCategoryFormModal from '../components/AdminCategoryFormModal';
import AdminCategoryDeleteDialog from '../components/AdminCategoryDeleteDialog';
import type { Category } from '../../types/api';
import type {
  CreateCategoryRequest,
  UpdateCategoryRequest,
} from '../../lib/categoryApi';
import { toCategoryDeleteError } from '../../lib/categoryApi';

/**
 * Admin Categories (/admin/categories)
 * List: GET /category (includes productCount — active products only)
 * CRUD: POST /category, PATCH /category/:id, DELETE /category/:id
 */
export default function AdminCategories() {
  const {
    categories,
    meta,
    isLoading,
    error,
    page,
    search,
    refetch,
    setPage,
    setSearch,
    createCategory,
    updateCategory,
    deleteCategory,
    actionError,
    actionSuccess,
    clearActionFeedback,
  } = useAdminCategories();

  const [formMode, setFormMode] = useState<'create' | 'edit' | null>(null);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [deletingCategory, setDeletingCategory] = useState<Category | null>(null);
  const [deletingCategoryId, setDeletingCategoryId] = useState<number | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [isSubmittingForm, setIsSubmittingForm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const openCreate = () => {
    clearActionFeedback();
    setFormError(null);
    setEditingCategory(null);
    setFormMode('create');
  };

  const openEdit = (category: Category) => {
    clearActionFeedback();
    setFormError(null);
    setEditingCategory(category);
    setFormMode('edit');
  };

  const openDelete = (category: Category) => {
    clearActionFeedback();
    setDeleteError(null);
    setDeletingCategory(category);
  };

  const closeForm = () => {
    if (isSubmittingForm) return;
    setFormMode(null);
    setEditingCategory(null);
    setFormError(null);
  };

  const closeDelete = () => {
    if (isDeleting) return;
    setDeletingCategory(null);
    setDeleteError(null);
  };

  const handleFormSubmit = async (
    payload: CreateCategoryRequest | UpdateCategoryRequest,
  ) => {
    setIsSubmittingForm(true);
    setFormError(null);
    try {
      if (formMode === 'edit' && editingCategory) {
        await updateCategory(editingCategory.id, payload as UpdateCategoryRequest);
      } else {
        await createCategory(payload as CreateCategoryRequest);
      }
      setFormMode(null);
      setEditingCategory(null);
    } catch (err) {
      const message =
        err instanceof Error && err.message
          ? err.message
          : 'Unable to save category.';
      setFormError(message);
    } finally {
      setIsSubmittingForm(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deletingCategory) return;
    setIsDeleting(true);
    setDeleteError(null);
    try {
      await deleteCategory(deletingCategory.id);
      setDeletingCategory(null);
      setDeletingCategoryId(null);
    } catch (err) {
      const message =
        err instanceof Error && err.message
          ? err.message
          : 'Unable to delete category.';
      setDeleteError(toCategoryDeleteError(message));
      setDeletingCategoryId(null);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-5">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#8A847B]">
            Admin · Catalog
          </p>
          <h1 className="mt-1.5 font-editorial text-[26px] font-medium tracking-tight text-[#1A1A1A] sm:text-[28px]">
            Category
          </h1>
          <p className="mt-1.5 text-[13px] text-[#6B6B6B]">
            Manage product categories
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
            Add Category
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

      <div className="relative">
        <Search
          size={16}
          className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[#A39E95]"
        />
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search categories..."
          className="h-11 w-full rounded-xl border border-[#E8E4DC] bg-white pl-10 pr-4 text-[13px] text-[#1A1A1A] placeholder:text-[#A39E95] focus:border-[#B7C9D9] focus:outline-none"
        />
      </div>

      <AdminCategoriesTable
        categories={categories}
        meta={meta}
        page={page}
        isLoading={isLoading}
        error={error}
        deletingCategoryId={deletingCategory?.id ?? deletingCategoryId}
        onRetry={refetch}
        onPageChange={setPage}
        onEdit={openEdit}
        onDelete={openDelete}
        onCreate={openCreate}
      />

      {formMode && (
        <AdminCategoryFormModal
          mode={formMode}
          category={editingCategory}
          isSubmitting={isSubmittingForm}
          errorMessage={formError}
          onClose={closeForm}
          onSubmit={handleFormSubmit}
        />
      )}

      {deletingCategory && (
        <AdminCategoryDeleteDialog
          category={deletingCategory}
          isDeleting={isDeleting}
          errorMessage={deleteError}
          onClose={closeDelete}
          onConfirm={handleDeleteConfirm}
        />
      )}
    </div>
  );
}
