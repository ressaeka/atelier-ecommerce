import React, { useState } from 'react';
import {
  ArrowUpDown,
  Calendar,
  ChevronLeft,
  ChevronRight,
  DollarSign,
  Package,
  RefreshCw,
  Search,
  ShoppingBag,
  TrendingUp,
  Trophy,
} from 'lucide-react';

import { useAdminBestSellingProducts } from '../hooks/useAdminBestSellingProducts';
import { formatPrice, resolveImageUrl } from '../../lib/utils';
import type { ReportPreset } from '../hooks/useAdminSalesReport';

const PRESET_BUTTONS: Array<{ id: ReportPreset; label: string }> = [
  { id: 'today', label: 'Hari Ini' },
  { id: '7d', label: '7 Hari Terakhir' },
  { id: '30d', label: '30 Hari Terakhir' },
  { id: 'this_month', label: 'Bulan Ini' },
];

function ProductThumb({
  src,
  name,
}: {
  src: string | null | undefined;
  name: string;
}) {
  const [imgError, setImgError] = useState(false);
  const hasImage = Boolean(src && !imgError);

  return (
    <div className="h-11 w-11 shrink-0 overflow-hidden rounded-lg border border-[#EDEAE3] bg-[#ECEAE4]">
      {hasImage ? (
        <img
          src={resolveImageUrl(src, 88, 88, name)}
          alt={name}
          onError={() => setImgError(true)}
          className="h-full w-full object-cover"
          loading="lazy"
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center text-[#A39E95]">
          <Package size={16} strokeWidth={1.6} />
        </div>
      )}
    </div>
  );
}

export default function AdminBestSellingProductsPage() {
  const {
    data,
    isLoading,
    error,
    preset,
    startDate,
    endDate,
    search,
    sortBy,
    sortOrder,
    page,
    applyPreset,
    setStartDate,
    setEndDate,
    setSearch,
    handleSortChange,
    setPage,
    refetch,
  } = useAdminBestSellingProducts();

  const summary = data?.summary ?? {
    totalUnitsSold: 0,
    totalRevenue: 0,
    totalUniqueProducts: 0,
    totalOrdersWithProducts: 0,
  };

  const products = data?.products?.data ?? [];
  const meta = data?.products?.meta ?? {
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1,
  };

  const topThree = products.slice(0, 3);

  return (
    <div className="space-y-6">
      {/* Header */}
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#8A847B]">
            Admin · Laporan
          </p>
          <h1 className="mt-1.5 font-editorial text-[26px] font-medium tracking-tight text-[#1A1A1A] sm:text-[30px]">
            Laporan Produk Terlaris
          </h1>
          <p className="mt-1.5 text-[13px] text-[#6B6B6B]">
            Peringkat dan performa produk berdasarkan unit terjual, pendapatan, dan pesanan unik.
          </p>
        </div>

        <button
          type="button"
          onClick={refetch}
          disabled={isLoading}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#D9E3EC] bg-[#F4F8FB] px-4 py-2.5 text-[12px] font-semibold text-[#2F5D86] transition-colors hover:bg-[#E8F1F8] disabled:opacity-50"
        >
          <RefreshCw
            size={14}
            className={isLoading ? 'animate-spin' : undefined}
          />
          Refresh Data
        </button>
      </header>

      {/* Filter Card */}
      <section className="rounded-2xl border border-[#E8E4DC] bg-white p-5 shadow-[0_1px_2px_rgba(26,26,26,0.03)] sm:p-6">
        <div className="flex flex-col gap-4">
          {/* Preset Buttons */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="mr-1 text-[11px] font-semibold uppercase tracking-[0.1em] text-[#8A847B]">
                Periode:
              </span>
              {PRESET_BUTTONS.map((btn) => (
                <button
                  key={btn.id}
                  type="button"
                  onClick={() => applyPreset(btn.id)}
                  className={`rounded-xl px-3 py-1.5 text-[12px] font-medium transition-colors ${
                    preset === btn.id
                      ? 'bg-[#1A1A1A] text-white shadow-sm'
                      : 'border border-[#E8E4DC] bg-[#FAFAF8] text-[#4A4A4A] hover:bg-[#F0EDE7]'
                  }`}
                >
                  {btn.label}
                </button>
              ))}
              <span
                className={`rounded-xl px-3 py-1.5 text-[12px] font-medium ${
                  preset === 'custom'
                    ? 'bg-[#2F5D86] text-white'
                    : 'text-[#8A847B]'
                }`}
              >
                {preset === 'custom' ? 'Kustom Terpilih' : ''}
              </span>
            </div>

            {data?.period && (
              <span className="text-[12px] text-[#8A847B]">
                Rentang: <strong className="font-semibold text-[#1A1A1A]">{data.period.startDate} s/d {data.period.endDate}</strong> ({data.period.timezone})
              </span>
            )}
          </div>

          {/* Date inputs & Search input & Sort button */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="prodStartDate" className="text-[11px] font-medium text-[#6B6B6B]">
                Dari Tanggal
              </label>
              <input
                id="prodStartDate"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="h-10 w-full rounded-xl border border-[#E8E4DC] bg-[#FAFAF8] px-3 text-[12px] text-[#1A1A1A] focus:border-[#B7C9D9] focus:bg-white focus:outline-none"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="prodEndDate" className="text-[11px] font-medium text-[#6B6B6B]">
                Sampai Tanggal
              </label>
              <input
                id="prodEndDate"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="h-10 w-full rounded-xl border border-[#E8E4DC] bg-[#FAFAF8] px-3 text-[12px] text-[#1A1A1A] focus:border-[#B7C9D9] focus:bg-white focus:outline-none"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="prodSearch" className="text-[11px] font-medium text-[#6B6B6B]">
                Cari Produk
              </label>
              <div className="relative">
                <Search
                  size={14}
                  className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#A39E95]"
                />
                <input
                  id="prodSearch"
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Ketik nama produk..."
                  className="h-10 w-full rounded-xl border border-[#E8E4DC] bg-[#FAFAF8] pl-8 pr-3 text-[12px] text-[#1A1A1A] placeholder:text-[#A39E95] focus:border-[#B7C9D9] focus:bg-white focus:outline-none"
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <span className="text-[11px] font-medium text-[#6B6B6B]">
                Urutkan Berdasarkan
              </span>
              <div className="flex gap-1.5">
                <button
                  type="button"
                  onClick={() => handleSortChange('sold')}
                  className={`flex-1 rounded-xl px-2 py-2 text-[11px] font-medium transition-colors ${
                    sortBy === 'sold'
                      ? 'bg-[#EEF4F9] text-[#2F5D86] font-semibold border border-[#D9E3EC]'
                      : 'border border-[#E8E4DC] bg-[#FAFAF8] text-[#6B6B6B] hover:bg-[#F3F1EC]'
                  }`}
                >
                  Unit {sortBy === 'sold' ? (sortOrder === 'desc' ? '↓' : '↑') : ''}
                </button>
                <button
                  type="button"
                  onClick={() => handleSortChange('revenue')}
                  className={`flex-1 rounded-xl px-2 py-2 text-[11px] font-medium transition-colors ${
                    sortBy === 'revenue'
                      ? 'bg-[#EEF4F9] text-[#2F5D86] font-semibold border border-[#D9E3EC]'
                      : 'border border-[#E8E4DC] bg-[#FAFAF8] text-[#6B6B6B] hover:bg-[#F3F1EC]'
                  }`}
                >
                  Omzet {sortBy === 'revenue' ? (sortOrder === 'desc' ? '↓' : '↑') : ''}
                </button>
                <button
                  type="button"
                  onClick={() => handleSortChange('orderCount')}
                  className={`flex-1 rounded-xl px-2 py-2 text-[11px] font-medium transition-colors ${
                    sortBy === 'orderCount'
                      ? 'bg-[#EEF4F9] text-[#2F5D86] font-semibold border border-[#D9E3EC]'
                      : 'border border-[#E8E4DC] bg-[#FAFAF8] text-[#6B6B6B] hover:bg-[#F3F1EC]'
                  }`}
                >
                  Pesanan {sortBy === 'orderCount' ? (sortOrder === 'desc' ? '↓' : '↑') : ''}
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Error Alert */}
      {error && (
        <div
          role="alert"
          className="rounded-2xl border border-[#F3B0A3] bg-[#FBD9D3] p-5 text-[#8C3A1E]"
        >
          <p className="text-[13px] font-semibold">Kendala Memuat Laporan Produk Terlaris</p>
          <p className="mt-1 text-[12px] opacity-90">{error}</p>
          <button
            type="button"
            onClick={refetch}
            className="mt-3 rounded-xl bg-[#8C3A1E] px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.1em] text-white hover:bg-[#722e17]"
          >
            Coba Lagi
          </button>
        </div>
      )}

      {/* KPI Cards */}
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {/* Total Unit Terjual */}
        <div className="rounded-2xl border border-[#E8E4DC] bg-white p-5 shadow-[0_1px_2px_rgba(26,26,26,0.03)] sm:p-6">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#8A847B]">
              Total Unit Terjual
            </span>
            <div className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-[#E8F1F8] text-[#2F5D86]">
              <ShoppingBag size={17} strokeWidth={2} />
            </div>
          </div>
          <p className="mt-3 font-editorial text-[25px] font-semibold tracking-tight text-[#1A1A1A]">
            {summary.totalUnitsSold} <span className="font-sans text-[14px] font-normal text-[#6B6B6B]">item</span>
          </p>
          <p className="mt-1 text-[11px] text-[#8A847B]">
            Volume produk dari pesanan terkonfirmasi
          </p>
        </div>

        {/* Total Pendapatan Produk */}
        <div className="rounded-2xl border border-[#E8E4DC] bg-white p-5 shadow-[0_1px_2px_rgba(26,26,26,0.03)] sm:p-6">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#8A847B]">
              Pendapatan Produk
            </span>
            <div className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-[#E4F4EA] text-[#3D8B5C]">
              <DollarSign size={17} strokeWidth={2} />
            </div>
          </div>
          <p className="mt-3 font-editorial text-[25px] font-semibold tracking-tight text-[#1A1A1A]">
            {formatPrice(summary.totalRevenue)}
          </p>
          <p className="mt-1 text-[11px] text-[#8A847B]">
            Nilai subtotal historis produk yang terjual
          </p>
        </div>

        {/* Variasi Produk Terjual */}
        <div className="rounded-2xl border border-[#E8E4DC] bg-white p-5 shadow-[0_1px_2px_rgba(26,26,26,0.03)] sm:p-6">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#8A847B]">
              Produk Terjual
            </span>
            <div className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-[#FDF0E0] text-[#A67C3D]">
              <Trophy size={17} strokeWidth={2} />
            </div>
          </div>
          <p className="mt-3 font-editorial text-[25px] font-semibold tracking-tight text-[#1A1A1A]">
            {summary.totalUniqueProducts} <span className="font-sans text-[14px] font-normal text-[#6B6B6B]">produk</span>
          </p>
          <p className="mt-1 text-[11px] text-[#8A847B]">
            Variasi produk unik yang menghasilkan penjualan
          </p>
        </div>

        {/* Jumlah Pesanan Terkait */}
        <div className="rounded-2xl border border-[#E8E4DC] bg-white p-5 shadow-[0_1px_2px_rgba(26,26,26,0.03)] sm:p-6">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#8A847B]">
              Pesanan Terkait
            </span>
            <div className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-[#F4F8FB] text-[#4A7BA8]">
              <TrendingUp size={17} strokeWidth={2} />
            </div>
          </div>
          <p className="mt-3 font-editorial text-[25px] font-semibold tracking-tight text-[#1A1A1A]">
            {summary.totalOrdersWithProducts} <span className="font-sans text-[14px] font-normal text-[#6B6B6B]">pesanan</span>
          </p>
          <p className="mt-1 text-[11px] text-[#8A847B]">
            Jumlah transaksi pesanan unik yang memuat produk
          </p>
        </div>
      </section>

      {/* Top 3 Showcase */}
      {topThree.length > 0 && (
        <section className="space-y-3">
          <div className="flex items-center gap-2">
            <Trophy size={16} className="text-[#A67C3D]" />
            <h2 className="font-editorial text-[18px] font-medium tracking-tight text-[#1A1A1A]">
              Top 3 Produk Terlaris Periode Ini
            </h2>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {topThree.map((item, idx) => {
              const badgeColors = [
                'bg-[#FDF0E0] text-[#A67C3D] border-[#E8D7C0]', // 1st: Gold/Warm Bronze
                'bg-[#EEF4F9] text-[#2F5D86] border-[#D9E3EC]', // 2nd: Slate/Silver
                'bg-[#F7F6F2] text-[#6B6B6B] border-[#EDEAE3]', // 3rd: Bronze neutral
              ];

              return (
                <div
                  key={item.productId}
                  className="relative flex flex-col justify-between rounded-2xl border border-[#E8E4DC] bg-white p-5 shadow-[0_1px_2px_rgba(26,26,26,0.03)]"
                >
                  <div className="flex items-start gap-3.5">
                    <div className="relative">
                      <ProductThumb src={item.image} name={item.name} />
                      <span
                        className={`absolute -left-1.5 -top-1.5 inline-flex h-5 w-5 items-center justify-center rounded-full border text-[10px] font-bold ${
                          badgeColors[idx] ?? badgeColors[2]
                        }`}
                      >
                        #{item.rank}
                      </span>
                    </div>

                    <div className="min-w-0 flex-1">
                      <span className="inline-block rounded-md bg-[#FAFAF8] px-2 py-0.5 text-[10px] font-medium text-[#8A847B] border border-[#F0EDE7]">
                        {item.categoryName}
                      </span>
                      <h3 className="mt-1 truncate font-editorial text-[15px] font-semibold text-[#1A1A1A]">
                        {item.name}
                      </h3>
                      <p className="mt-0.5 text-[12px] font-semibold text-[#2F5D86]">
                        {formatPrice(item.revenue)}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 flex items-center justify-between border-t border-[#F0EDE7] pt-3 text-[12px]">
                    <span className="text-[#6B6B6B]">
                      Terjual: <strong className="text-[#1A1A1A]">{item.unitsSold} unit</strong>
                    </span>
                    <span className="text-[#6B6B6B]">
                      Pesanan: <strong className="text-[#1A1A1A]">{item.orderCount} kali</strong>
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Main Ranking Table Section */}
      <section className="overflow-hidden rounded-2xl border border-[#E8E4DC] bg-white shadow-[0_1px_2px_rgba(26,26,26,0.03)]">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#F0EDE7] px-5 py-4 sm:px-6">
          <div>
            <h2 className="font-editorial text-[18px] font-medium tracking-tight text-[#1A1A1A]">
              Peringkat Seluruh Produk
            </h2>
            <p className="mt-0.5 text-[12px] text-[#8A847B]">
              Daftar produk yang terjual pada rentang tanggal terpilih
            </p>
          </div>
          <span className="text-[11px] uppercase tracking-[0.1em] text-[#8A847B]">
            {meta.total} produk terdaftar
          </span>
        </div>

        {/* Loading Indicator */}
        {isLoading && products.length === 0 && (
          <div className="flex min-h-[30vh] items-center justify-center">
            <p className="text-[11px] uppercase tracking-[0.22em] text-[#8A847B]">
              Memuat data produk terlaris…
            </p>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && products.length === 0 && (
          <div className="flex min-h-[35vh] flex-col items-center justify-center px-6 py-12 text-center">
            <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-[#EEF4F9] text-[#4A7BA8]">
              <Calendar size={20} strokeWidth={1.6} />
            </div>
            <p className="font-editorial text-[17px] text-[#1A1A1A]">
              Tidak Ada Data Penjualan Produk
            </p>
            <p className="mt-2 max-w-md text-[12px] leading-relaxed text-[#8A847B]">
              Tidak ada produk yang terjual pada rentang waktu atau kata kunci pencarian yang dipilih. Silakan ubah filter tanggal atau hapus kata kunci.
            </p>
          </div>
        )}

        {/* Table */}
        {products.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[860px] border-collapse text-left">
              <thead>
                <tr className="border-b border-[#F0EDE7] bg-[#FAFAF8]">
                  <th className="whitespace-nowrap px-4 py-3 text-[10.5px] font-semibold uppercase tracking-[0.1em] text-[#8A847B]">
                    Rank
                  </th>
                  <th className="whitespace-nowrap px-4 py-3 text-[10.5px] font-semibold uppercase tracking-[0.1em] text-[#8A847B]">
                    Produk & Kategori
                  </th>
                  <th className="whitespace-nowrap px-4 py-3 text-[10.5px] font-semibold uppercase tracking-[0.1em] text-[#8A847B]">
                    <button
                      type="button"
                      onClick={() => handleSortChange('sold')}
                      className="inline-flex items-center gap-1 hover:text-[#1A1A1A]"
                    >
                      Unit Terjual
                      <ArrowUpDown size={12} />
                    </button>
                  </th>
                  <th className="whitespace-nowrap px-4 py-3 text-[10.5px] font-semibold uppercase tracking-[0.1em] text-[#8A847B]">
                    <button
                      type="button"
                      onClick={() => handleSortChange('revenue')}
                      className="inline-flex items-center gap-1 hover:text-[#1A1A1A]"
                    >
                      Pendapatan
                      <ArrowUpDown size={12} />
                    </button>
                  </th>
                  <th className="whitespace-nowrap px-4 py-3 text-[10.5px] font-semibold uppercase tracking-[0.1em] text-[#8A847B]">
                    <button
                      type="button"
                      onClick={() => handleSortChange('orderCount')}
                      className="inline-flex items-center gap-1 hover:text-[#1A1A1A]"
                    >
                      Pesanan Unik
                      <ArrowUpDown size={12} />
                    </button>
                  </th>
                  <th className="whitespace-nowrap px-4 py-3 text-[10.5px] font-semibold uppercase tracking-[0.1em] text-[#8A847B]">
                    Rata-rata Harga Jual
                  </th>
                  <th className="whitespace-nowrap px-4 py-3 text-[10.5px] font-semibold uppercase tracking-[0.1em] text-[#8A847B]">
                    Sisa Stok
                  </th>
                </tr>
              </thead>
              <tbody>
                {products.map((item) => (
                  <tr
                    key={item.productId}
                    className="border-b border-[#F5F2EC] transition-colors last:border-0 hover:bg-[#FCFBF9]"
                  >
                    <td className="whitespace-nowrap px-4 py-3.5">
                      <span className="font-editorial text-[14px] font-bold text-[#1A1A1A]">
                        #{item.rank}
                      </span>
                    </td>

                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-3">
                        <ProductThumb src={item.image} name={item.name} />
                        <div className="min-w-0">
                          <p className="truncate text-[13px] font-medium text-[#1A1A1A]">
                            {item.name}
                          </p>
                          <span className="mt-0.5 inline-block text-[11px] text-[#8A847B]">
                            {item.categoryName}
                          </span>
                        </div>
                      </div>
                    </td>

                    <td className="whitespace-nowrap px-4 py-3.5">
                      <span className="inline-flex items-center rounded-lg bg-[#FAFAF8] px-2.5 py-1 text-[12.5px] font-semibold text-[#1A1A1A] border border-[#EDEAE3]">
                        {item.unitsSold} item
                      </span>
                    </td>

                    <td className="whitespace-nowrap px-4 py-3.5 text-[13px] font-semibold text-[#1A1A1A]">
                      {formatPrice(item.revenue)}
                    </td>

                    <td className="whitespace-nowrap px-4 py-3.5 text-[12.5px] text-[#4A4A4A]">
                      {item.orderCount} pesanan
                    </td>

                    <td className="whitespace-nowrap px-4 py-3.5 text-[12px] text-[#6B6B6B]">
                      {formatPrice(item.averageSellingPrice)}
                    </td>

                    <td className="whitespace-nowrap px-4 py-3.5 text-[12px]">
                      <span
                        className={`inline-block rounded-md px-2 py-0.5 font-medium ${
                          item.currentStock <= 5
                            ? 'bg-[#FDF3D9] text-[#A67C3D]'
                            : 'bg-[#E4F4EA] text-[#3D8B5C]'
                        }`}
                      >
                        {item.currentStock} pcs
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Footer */}
        {products.length > 0 && meta.totalPages > 1 && (
          <div className="flex flex-col gap-4 border-t border-[#F0EDE7] px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <p className="text-[12px] text-[#8A847B]">
              Halaman {meta.page} dari {meta.totalPages} · Menampilkan {products.length} produk
            </p>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setPage(Math.max(page - 1, 1))}
                disabled={page <= 1 || isLoading}
                className="flex h-8 items-center gap-1 rounded-lg px-2.5 text-[12px] font-medium text-[#6B6B6B] transition-colors hover:bg-[#F3F1EC] disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ChevronLeft size={14} />
                Sebelumnya
              </button>

              {(() => {
                const windowSize = 5;
                const half = Math.floor(windowSize / 2);
                const start = Math.max(1, Math.min(page - half, meta.totalPages - windowSize + 1));
                const end = Math.min(meta.totalPages, start + windowSize - 1);
                const pages: (number | '…')[] = [];
                if (start > 1) { pages.push(1); if (start > 2) pages.push('…'); }
                for (let p = start; p <= end; p++) pages.push(p);
                if (end < meta.totalPages) { if (end < meta.totalPages - 1) pages.push('…'); pages.push(meta.totalPages); }
                return pages.map((pNum, idx) =>
                  pNum === '…' ? (
                    <span key={`e-${idx}`} className="px-1 text-[12px] text-[#8A847B]">…</span>
                  ) : (
                    <button
                      key={pNum}
                      type="button"
                      onClick={() => setPage(pNum as number)}
                      disabled={isLoading}
                      className={`h-8 min-w-8 rounded-lg px-2 text-[12px] font-medium transition-colors ${
                        page === pNum ? 'bg-[#EEF4F9] text-[#2F5D86]' : 'text-[#6B6B6B] hover:bg-[#F3F1EC]'
                      }`}
                    >
                      {pNum}
                    </button>
                  ),
                );
              })()}

              <button
                type="button"
                onClick={() => setPage(Math.min(page + 1, meta.totalPages))}
                disabled={page >= meta.totalPages || isLoading}
                className="flex h-8 items-center gap-1 rounded-lg px-2.5 text-[12px] font-medium text-[#6B6B6B] transition-colors hover:bg-[#F3F1EC] disabled:cursor-not-allowed disabled:opacity-40"
              >
                Berikutnya
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
