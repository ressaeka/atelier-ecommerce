import { RefreshCw, Search, Users } from 'lucide-react';
import { useAdminCustomers } from '../hooks/useAdminCustomers';
import AdminCustomersTable from '../components/AdminCustomersTable';

/**
 * Admin Customers (/admin/customers)
 * Data: GET /api/v1/users (ADMIN JWT + user:read).
 * Displays only role === 'USER' (not all users).
 */
export default function AdminCustomers() {
  const {
    customers,
    meta,
    isLoading,
    error,
    page,
    search,
    visibleCount,
    filteredTotal,
    refetch,
    setPage,
    setSearch,
  } = useAdminCustomers();

  return (
    <div className="space-y-5">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#8A847B]">
            Admin · Pelanggan
          </p>
          <h1 className="mt-1.5 font-editorial text-[26px] font-medium tracking-tight text-[#1A1A1A] sm:text-[28px]">
            Pelanggan
          </h1>
          <p className="mt-1.5 text-[13px] text-[#6B6B6B]">
            Daftar akun pelanggan Atelier.
          </p>
        </div>

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
      </header>

      {/* Search — uses existing GET /users?search= */}
      <div className="relative">
        <Search
          size={16}
          className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[#A39E95]"
        />
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Cari nama, email, atau telepon..."
          className="h-11 w-full rounded-xl border border-[#E8E4DC] bg-white pl-10 pr-4 text-[13px] text-[#1A1A1A] placeholder:text-[#A39E95] focus:border-[#B7C9D9] focus:outline-none"
        />
      </div>

      <AdminCustomersTable
        customers={customers}
        meta={meta}
        page={page}
        isLoading={isLoading}
        error={error}
        visibleCount={visibleCount}
        filteredTotal={filteredTotal}
        onRetry={refetch}
        onPageChange={setPage}
      />

      {!error && !isLoading && visibleCount === 0 && (
        <p className="flex items-center justify-center gap-2 text-[12px] text-[#8A847B]">
          <Users size={14} className="text-[#A39E95]" />
          Hanya pelanggan yang terdaftar yang ditampilkan.
        </p>
      )}
    </div>
  );
}
