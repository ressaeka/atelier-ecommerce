import React, {
  useState,
  useEffect,
  useCallback,
  useRef,
} from 'react';
import {
  Link,
  useSearchParams,
} from 'react-router-dom';
import {
  Search,
  Heart,
} from 'lucide-react';

import { useWishlist } from '../contexts/WishlistContext';
import AnnouncementBar from '../components/AnnouncementBar';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

import { api } from '../lib/api';

import {
  formatPrice,
  resolveImageUrl,
  resolveCategoryImage,
} from '../lib/utils';

import type {
  Product,
  Category,
  PaginationMeta,
} from '../types/api';

/* =========================================================
   CATALOG
========================================================= */

const Catalog: React.FC = () => {
  const [searchParams, setSearchParams] =
    useSearchParams();

  /* =======================================================
     PRODUCTS
  ======================================================== */

  const [products, setProducts] =
    useState<Product[]>([]);

  const [categories, setCategories] =
    useState<Category[]>([]);

  /* =======================================================
     METADATA
  ======================================================== */

  const [meta, setMeta] =
    useState<PaginationMeta | null>(null);

  const [allProductsMeta, setAllProductsMeta] =
    useState<PaginationMeta | null>(null);

  /* =======================================================
     CATEGORY
  ======================================================== */

  const [activeCategoryId, setActiveCategoryId] =
    useState<number | null>(() => {
      const value =
        searchParams.get('categoryId');

      return value
        ? Number(value)
        : null;
    });

  /* =======================================================
     SEARCH
  ======================================================== */

  /*
   * searchQuery
   *
   * Value yang sedang diketik user.
   */
  const [searchQuery, setSearchQuery] =
    useState(
      searchParams.get('search') ?? '',
    );

  /*
   * debouncedSearch
   *
   * Value yang benar-benar dikirim
   * ke backend setelah user berhenti
   * mengetik selama 350ms.
   *
   * Contoh:
   *
   * l
   * li
   * lin
   * line
   * linen
   *
   * tidak menghasilkan 5 request API.
   */
  const [debouncedSearch, setDebouncedSearch] =
    useState(
      searchParams.get('search') ?? '',
    );

  /* =======================================================
     PAGE
  ======================================================== */

  const [page, setPage] =
    useState(
      Number(
        searchParams.get('page'),
      ) || 1,
    );

  /* =======================================================
     LOADING
  ======================================================== */

  /*
   * loading hanya digunakan untuk
   * first load.
   */
  const [loading, setLoading] =
    useState(true);

  /*
   * fetching digunakan ketika
   * request baru sedang berjalan.
   *
   * Product lama tetap ditampilkan.
   */
  const [fetching, setFetching] =
    useState(false);

  /* =======================================================
     REQUEST ID
  ======================================================== */

  /*
   * Mencegah response request lama
   * menimpa request terbaru.
   *
   * Contoh:
   *
   * request #1 = "linen"
   * request #2 = "linen shirt"
   *
   * Jika request #1 selesai belakangan,
   * hasilnya tidak boleh menimpa request #2.
   */
  const requestIdRef =
    useRef(0);

  /* =======================================================
     FETCH CATEGORIES
  ======================================================== */

  useEffect(() => {
    const fetchCategories =
      async () => {
        try {
          const result =
            await api.get<{
              items: Category[];
              meta: PaginationMeta;
            }>('/category', {
              page: 1,
              limit: 50,
            });

          setCategories(
            result.items,
          );
        } catch {
          setCategories([]);
        }
      };

    fetchCategories();
  }, []);

  /* =======================================================
     GLOBAL PRODUCT COUNT
  ======================================================== */

  useEffect(() => {
    const fetchAllProductsMeta =
      async () => {
        try {
          const result =
            await api.get<{
              items: Product[];
              meta: PaginationMeta;
            }>('/product', {
              page: 1,
              limit: 1,
            });

          setAllProductsMeta(
            result.meta,
          );
        } catch {
          setAllProductsMeta(
            null,
          );
        }
      };

    fetchAllProductsMeta();
  }, []);

  /* =======================================================
     URL -> STATE
  ======================================================== */

  useEffect(() => {
    const urlCategoryId =
      searchParams.get(
        'categoryId',
      );

    const urlSearch =
      searchParams.get(
        'search',
      ) ?? '';

    const urlPage =
      Number(
        searchParams.get(
          'page',
        ),
      ) || 1;

    setActiveCategoryId(
      urlCategoryId
        ? Number(
            urlCategoryId,
          )
        : null,
    );

    setSearchQuery(
      urlSearch,
    );

    /*
     * Search dari URL langsung
     * dianggap sebagai search aktif.
     */
    setDebouncedSearch(
      urlSearch,
    );

    setPage(
      urlPage,
    );
  }, [searchParams]);

  /* =======================================================
     DEBOUNCE SEARCH
  ======================================================== */

  useEffect(() => {
    const timer =
      window.setTimeout(() => {
        setDebouncedSearch(
          searchQuery.trim(),
        );
      }, 350);

    return () => {
      window.clearTimeout(
        timer,
      );
    };
  }, [searchQuery]);

  /* =======================================================
     ACTIVE CATEGORY
  ======================================================== */

  const activeCategory =
    activeCategoryId !==
    null
      ? categories.find(
          (category) =>
            category.id ===
            activeCategoryId,
        ) ?? null
      : null;

  /* =======================================================
     FETCH PRODUCTS
  ======================================================== */

  const fetchProducts =
    useCallback(
      async () => {
        /*
         * Generate request ID baru.
         */
        const currentRequestId =
          ++requestIdRef.current;

        /*
         * Jangan clear products.
         *
         * Kalau kita melakukan:
         *
         * setProducts([])
         *
         * setiap request, grid akan
         * flicker / hilang sementara.
         */
        setFetching(true);

        try {
          const params: Record<
            string,
            string | number | boolean | undefined
          > = {
            page,
            limit: 20,
          };

          /* -----------------------------------------------
             CATEGORY
          ------------------------------------------------ */

          if (
            activeCategoryId !==
            null
          ) {
            params.categoryId =
              activeCategoryId;
          }

          /* -----------------------------------------------
             SEARCH
          ------------------------------------------------ */

          if (
            debouncedSearch
          ) {
            params.search =
              debouncedSearch;
          }

          /* -----------------------------------------------
             API REQUEST
          ------------------------------------------------ */

          const result =
            await api.get<{
              items: Product[];
              meta: PaginationMeta;
            }>('/product', params);

          /*
           * Kalau response ini bukan
           * response terbaru, abaikan.
           */
          if (
            currentRequestId !==
            requestIdRef.current
          ) {
            return;
          }

          /*
           * IMPORTANT:
           *
           * Jangan melakukan:
           *
           * .filter(...)
           * .find(...)
           * new Set(...)
           * new Map(...)
           *
           * berdasarkan product.name.
           *
           * Product dengan nama sama
           * tetap harus ditampilkan.
           *
           * Contoh:
           *
           * ID 1 = Linen Shirt
           * ID 2 = Linen Shirt
           *
           * Keduanya tetap dirender.
           */
          setProducts(
            result.items,
          );

          setMeta(
            result.meta,
          );
        } catch {
          /*
           * Jangan menghapus product
           * yang sedang tampil ketika
           * request gagal.
           */
        } finally {
          if (
            currentRequestId ===
            requestIdRef.current
          ) {
            setFetching(false);
            setLoading(false);
          }
        }
      },
      [
        page,
        activeCategoryId,
        debouncedSearch,
      ],
    );

  /* =======================================================
     RUN FETCH
  ======================================================== */

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  /* =======================================================
     UPDATE URL
  ======================================================== */

  const updateFiltersInUrl =
    (
      overrides: {
        categoryId?: number | null;
        search?: string;
        page?: number;
      } = {},
    ) => {
      const nextParams =
        new URLSearchParams();

      /* -----------------------------------------------
         CATEGORY
      ------------------------------------------------ */

      const nextCategoryId =
        overrides.categoryId !==
        undefined
          ? overrides.categoryId
          : activeCategoryId;

      /* -----------------------------------------------
         SEARCH
      ------------------------------------------------ */

      const nextSearch =
        overrides.search !==
        undefined
          ? overrides.search
          : searchQuery;

      /* -----------------------------------------------
         PAGE
      ------------------------------------------------ */

      const nextPage =
        overrides.page !==
        undefined
          ? overrides.page
          : page;

      /* -----------------------------------------------
         BUILD QUERY
      ------------------------------------------------ */

      if (
        nextCategoryId !==
        null
      ) {
        nextParams.set(
          'categoryId',
          String(
            nextCategoryId,
          ),
        );
      }

      if (
        nextSearch.trim()
      ) {
        nextParams.set(
          'search',
          nextSearch.trim(),
        );
      }

      if (
        nextPage > 1
      ) {
        nextParams.set(
          'page',
          String(nextPage),
        );
      }

      setSearchParams(
        nextParams,
        {
          replace: true,
        },
      );
    };

  /* =======================================================
     CATEGORY CLICK
  ======================================================== */

  const handleCategoryClick =
    (
      id: number | null,
    ) => {
      setActiveCategoryId(
        id,
      );

      setSearchQuery('');

      setDebouncedSearch('');

      setPage(1);

      updateFiltersInUrl({
        categoryId: id,
        search: '',
        page: 1,
      });
    };

  /* =======================================================
     SEARCH CHANGE
  ======================================================== */

  const handleCatalogSearchChange =
    (
      event: React.ChangeEvent<HTMLInputElement>,
    ) => {
      const value =
        event.target.value;

      /*
       * Input langsung berubah.
       */
      setSearchQuery(
        value,
      );

      /*
       * Search selalu mulai
       * dari halaman pertama.
       */
      setPage(1);

      /*
       * Update URL.
       */
      const nextParams =
        new URLSearchParams(
          searchParams,
        );

      const trimmed =
        value.trim();

      if (trimmed) {
        nextParams.set(
          'search',
          trimmed,
        );
      } else {
        nextParams.delete(
          'search',
        );
      }

      /*
       * Search baru harus kembali
       * ke page pertama.
       */
      nextParams.delete(
        'page',
      );

      setSearchParams(
        nextParams,
        {
          replace: true,
        },
      );
    };

  /* =======================================================
     CLEAR SEARCH
  ======================================================== */

  const handleClearSearch =
    () => {
      setSearchQuery('');

      setDebouncedSearch('');

      setPage(1);

      const nextParams =
        new URLSearchParams(
          searchParams,
        );

      nextParams.delete(
        'search',
      );

      nextParams.delete(
        'page',
      );

      setSearchParams(
        nextParams,
        {
          replace: true,
        },
      );
    };

  /* =======================================================
     RESET
  ======================================================== */

  const handleResetFilters =
    () => {
      setActiveCategoryId(
        null,
      );

      setSearchQuery('');

      setDebouncedSearch('');

      setPage(1);

      setSearchParams(
        new URLSearchParams(),
        {
          replace: true,
        },
      );
    };

  /* =======================================================
     FILTER STATE
  ======================================================== */

  const hasFilter =
    activeCategoryId !==
      null ||
    Boolean(
      searchQuery.trim(),
    );

  /* =======================================================
     SEARCH PLACEHOLDER
  ======================================================== */

  const searchPlaceholder =
    activeCategory
      ? `Cari di ${activeCategory.name.toLowerCase()}...`
      : 'Cari di kategori...';

  /* =======================================================
     RENDER
  ======================================================== */

  return (
    <div className="flex min-h-screen flex-col bg-[#FAF9F5]">

      <AnnouncementBar />

      <Navbar />

      <main
        id="catalog-main"
        className="flex-1"
      >

        {/* =================================================
            CATEGORY SECTION
        ================================================== */}

        <section className="bg-[#EDE9E2] px-6 pb-10 pt-10 lg:px-12">

          <div className="mx-auto max-w-[1400px]">

            <h1
              className="mb-8 text-[52px] font-normal leading-[1.05] text-[#1A1A1A] lg:text-[64px]"
              style={{
                fontFamily:
                  "'Libre Bodoni', 'Playfair Display', Georgia, serif",
              }}
            >
              Kategori
            </h1>

            <div className="flex justify-center gap-5 overflow-x-auto pb-2 scrollbar-hide">

              {/* =================================================
                  ALL
              ================================================== */}

              <button
                type="button"
                id="filter-semua"
                onClick={() =>
                  handleCategoryClick(
                    null,
                  )
                }
                className="group flex shrink-0 flex-col items-start gap-3"
              >

                <div className="p-[4px]">

                  <div
                    className={`flex h-[218px] w-[148px] flex-col items-center justify-center overflow-hidden rounded-[74px] transition-all duration-300 ${
                      activeCategoryId ===
                      null
                        ? 'ring-2 ring-[#1A1A1A] ring-offset-[3px] ring-offset-[#EDE9E2]'
                        : 'opacity-80 group-hover:opacity-100'
                    }`}
                    style={{
                      background:
                        '#D8D2C8',
                    }}
                  >

                    <span
                      className="text-[28px] text-[#5C5248]"
                      style={{
                        fontFamily:
                          "'Libre Bodoni', Georgia, serif",
                      }}
                    >
                      All
                    </span>

                    <span className="mt-1 text-[10px] uppercase tracking-[0.2em] text-[#8B8075]">
                      Semua
                    </span>

                  </div>

                </div>

                <div className="w-[156px]">

                  <p
                    className={`text-[15px] leading-snug ${
                      activeCategoryId ===
                      null
                        ? 'text-[#1A1A1A]'
                        : 'text-[#555]'
                    }`}
                    style={{
                      fontFamily:
                        "'Libre Bodoni', 'Playfair Display', Georgia, serif",
                    }}
                  >
                    Semua
                  </p>

                  <p className="mt-[2px] text-[9px] uppercase tracking-[0.2em] text-[#A8A090]">
                    {allProductsMeta?.total ??
                      0}{' '}
                    produk total
                  </p>

                </div>

              </button>

              {/* =================================================
                  CATEGORIES
              ================================================== */}

              {categories.map(
                (category) => {

                  const active =
                    activeCategoryId ===
                    category.id;

                  const categoryImage =
                    resolveCategoryImage(
                      category.name,
                    );

                  return (
                    <button
                      type="button"
                      key={
                        category.id
                      }
                      id={`filter-cat-${category.id}`}
                      onClick={() =>
                        handleCategoryClick(
                          category.id,
                        )
                      }
                      className="group flex shrink-0 flex-col items-start gap-3"
                    >

                      <div className="p-[4px]">

                        <div
                          className={`h-[218px] w-[148px] overflow-hidden rounded-[74px] transition-all duration-300 ${
                            active
                              ? 'ring-2 ring-[#1A1A1A] ring-offset-[3px] ring-offset-[#EDE9E2]'
                              : 'opacity-90 group-hover:opacity-100'
                          }`}
                        >

                          {categoryImage ? (

                            <img
                              src={
                                categoryImage
                              }
                              alt={
                                category.name
                              }
                              className="h-full w-full object-cover"
                            />

                          ) : (

                            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-[#E8E4DC] to-[#D8D2C8]">

                              <span
                                className="text-[32px] text-[#8B8075]/60"
                                style={{
                                  fontFamily:
                                    "'Libre Bodoni', Georgia, serif",
                                }}
                              >
                                {category.name.charAt(
                                  0,
                                )}
                              </span>

                            </div>

                          )}

                        </div>

                      </div>

                      <div className="w-[156px]">

                        <p
                          className={`text-[15px] leading-snug transition-colors ${
                            active
                              ? 'text-[#1A1A1A]'
                              : 'text-[#555] group-hover:text-[#1A1A1A]'
                          }`}
                          style={{
                            fontFamily:
                              "'Libre Bodoni', 'Playfair Display', Georgia, serif",
                          }}
                        >
                          {
                            category.name
                          }
                        </p>

                        <p className="mt-[2px] text-[9px] uppercase tracking-[0.2em] text-[#A8A090]">
                          {category.productCount ??
                            0}{' '}
                          model pilihan
                        </p>

                      </div>

                    </button>
                  );
                },
              )}

            </div>

          </div>

        </section>

        {/* =================================================
            PRODUCT CONTENT
        ================================================== */}

        <div className="mx-auto max-w-[1400px] px-6 lg:px-12">

          {/* =================================================
              ACTIVE FILTER HEADER
          ================================================== */}

          {(activeCategory ||
            searchQuery.trim()) && (

            <div className="pb-4 pt-8">

              {activeCategory && (
                <p className="mb-1 text-[9px] font-medium uppercase tracking-[0.2em] text-[#AAA]">
                  KATEGORI
                </p>
              )}

              {activeCategory && (
                <h2
                  className="mb-3 text-[28px] font-normal leading-[1.1] text-[#1A1A1A] lg:text-[34px]"
                  style={{
                    fontFamily:
                      "'Libre Bodoni', 'Playfair Display', Georgia, serif",
                  }}
                >
                  {
                    activeCategory.name
                  }
                </h2>
              )}

              {searchQuery.trim() && (
                <>
                  <p className="mb-2 text-[9px] font-medium uppercase tracking-[0.18em] text-[#AAA]">
                    {activeCategory
                      ? `PENCARIAN DI ${activeCategory.name}`
                      : 'HASIL PENCARIAN'}
                  </p>

                  <h3
                    className="text-[25px] font-normal leading-[1.1] text-[#1A1A1A]"
                    style={{
                      fontFamily:
                        "'Libre Bodoni', 'Playfair Display', Georgia, serif",
                    }}
                  >
                    &ldquo;
                    {
                      searchQuery.trim()
                    }
                    &rdquo;
                  </h3>
                </>
              )}

            </div>
          )}

          {/* =================================================
              SEARCH
          ================================================== */}

          <div className="border-b border-stone-200/40 py-5">

            <div className="relative">

              <Search
                size={15}
                strokeWidth={1.8}
                className="pointer-events-none absolute left-0 top-1/2 -translate-y-1/2 text-[#AAA]"
              />

              <input
                id="catalog-search"
                type="search"
                value={
                  searchQuery
                }
                onChange={
                  handleCatalogSearchChange
                }
                placeholder={
                  searchPlaceholder
                }
                autoComplete="off"
                className="w-full border-b border-stone-200 bg-transparent py-2 pl-6 pr-4 text-[13px] text-[#1A1A1A] outline-none placeholder:text-[#BBB] transition-colors focus:border-[#1A1A1A]"
              />

            </div>

          </div>

          {/* =================================================
              FILTER
          ================================================== */}

          <div className="border-b border-stone-200/40 py-5">

            <div className="flex items-center justify-end">

              {hasFilter && (

                <button
                  type="button"
                  onClick={
                    handleResetFilters
                  }
                  className="text-[10px] uppercase tracking-[0.1em] text-[#888] transition-colors hover:text-[#1A1A1A]"
                >
                  Reset Filter
                </button>

              )}

            </div>

          </div>

          {/* =================================================
              RESULTS META
          ================================================== */}

          <div className="flex items-center justify-between py-4">

            <div className="flex items-center gap-3">

              <p className="text-[10px] font-medium uppercase tracking-[0.12em] text-[#AAA]">
                {loading
                  ? 'Memuat...'
                  : `${meta?.total ?? 0} produk ditemukan`}
              </p>

              {!loading &&
                fetching && (

                  <span
                    className="h-[5px] w-[5px] animate-pulse rounded-full bg-[#999]"
                    aria-label="Memuat hasil"
                  />

                )}

            </div>

            {searchQuery.trim() && (

              <button
                type="button"
                onClick={
                  handleClearSearch
                }
                className="text-[10px] font-medium uppercase tracking-[0.1em] text-[#888] transition-colors hover:text-[#1A1A1A]"
              >
                Lihat Semua
              </button>

            )}

            {!searchQuery.trim() &&
              activeCategoryId !==
                null && (

                <button
                  type="button"
                  onClick={
                    handleResetFilters
                  }
                  className="text-[10px] font-medium uppercase tracking-[0.1em] text-[#888] transition-colors hover:text-[#1A1A1A]"
                >
                  Semua Kategori
                </button>

              )}

          </div>

          {/* =================================================
              FIRST LOAD
          ================================================== */}

          {loading ? (

            <div className="grid grid-cols-2 gap-x-5 gap-y-10 pb-20 sm:grid-cols-3 lg:grid-cols-4">

              {Array.from({
                length: 8,
              }).map(
                (_, index) => (

                  <div
                    key={
                      index
                    }
                    className="animate-pulse"
                  >

                    <div
                      className="w-full rounded-xl bg-[#ECEAE4]"
                      style={{
                        aspectRatio:
                          '3 / 4',
                      }}
                    />

                    <div className="mt-3 space-y-2">

                      <div className="h-2 w-1/3 rounded bg-[#ECEAE4]" />

                      <div className="h-3 w-2/3 rounded bg-[#ECEAE4]" />

                      <div className="h-3 w-1/4 rounded bg-[#ECEAE4]" />

                    </div>

                  </div>

                ),
              )}

            </div>

          ) : products.length ===
            0 ? (

            /* =================================================
               EMPTY
            ================================================== */

            <div className="flex flex-col items-center justify-center py-24 text-center">

              <p className="mb-3 text-[28px] text-[#DDD]">
                ✦
              </p>

              <p
                className="text-[14px] text-[#999]"
                style={{
                  fontFamily:
                    "'Inter', sans-serif",
                }}
              >
                {searchQuery.trim()
                  ? `Tidak ada produk yang cocok dengan "${searchQuery.trim()}".`
                  : activeCategory
                    ? `Tidak ada produk di kategori ${activeCategory.name}.`
                    : 'Produk tidak ditemukan.'}
              </p>

              <button
                type="button"
                onClick={
                  handleResetFilters
                }
                className="mt-4 text-[10px] uppercase tracking-[0.12em] text-[#888] transition-colors hover:text-[#1A1A1A]"
              >
                Reset Filter
              </button>

            </div>

          ) : (

            /* =================================================
               PRODUCTS

               IMPORTANT:

               Tidak ada deduplication berdasarkan
               product.name.

               Jadi:

               ID 1 = Linen Shirt
               ID 2 = Linen Shirt

               keduanya tetap tampil.
            ================================================== */

            <div className="grid grid-cols-2 gap-x-5 gap-y-10 pb-20 sm:grid-cols-3 lg:grid-cols-4">

              {products.map(
                (product) => (

                  <CatalogProductCard
                    key={
                      product.id
                    }
                    product={
                      product
                    }
                  />

                ),
              )}

            </div>

          )}

          {/* =================================================
              PAGINATION
          ================================================== */}

          {meta &&
            meta.totalPages >
              1 && (

              <div className="flex items-center justify-center gap-2 pb-12">

                {Array.from(
                  {
                    length:
                      meta.totalPages,
                  },
                  (_, index) =>
                    index + 1,
                ).map(
                  (
                    pageNumber,
                  ) => (

                    <button
                      key={
                        pageNumber
                      }
                      type="button"
                      onClick={() => {

                        setPage(
                          pageNumber,
                        );

                        updateFiltersInUrl(
                          {
                            page: pageNumber,
                          },
                        );

                        window.scrollTo(
                          {
                            top: 0,
                            behavior:
                              'smooth',
                          },
                        );

                      }}
                      className={`flex h-8 w-8 items-center justify-center text-[11px] transition-colors ${
                        pageNumber ===
                        page
                          ? 'bg-[#1A1A1A] text-white'
                          : 'text-[#666] hover:text-[#1A1A1A]'
                      }`}
                    >
                      {
                        pageNumber
                      }
                    </button>

                  ),
                )}

              </div>

            )}

        </div>

      </main>

      <Footer />

    </div>
  );
};

/* =========================================================
   PRODUCT CARD
========================================================= */

const CatalogProductCard: React.FC<{
  product: Product;
}> = ({
  product,
}) => {

  const [imgError, setImgError] =
    useState(false);

  const {
    has,
    toggle,
  } =
    useWishlist();

  const favorited =
    has(product.id);

  return (
    <div
      id={`catalog-product-${product.id}`}
      className="group flex flex-col"
    >

      {/* =================================================
          IMAGE
      ================================================== */}

      <div
        className="relative w-full overflow-hidden rounded-xl bg-[#ECEAE4]"
        style={{
          aspectRatio:
            '3 / 4',
        }}
      >

        <Link
          to={`/product/${product.id}`}
          className="block h-full w-full"
        >

          <img
            src={
              imgError
                ? resolveImageUrl(
                    null,
                    400,
                    533,
                    product.name,
                  )
                : resolveImageUrl(
                    product.image,
                    400,
                    533,
                    product.name,
                  )
            }
            alt={
              product.name
            }
            onError={() =>
              setImgError(
                true,
              )
            }
            className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04]"
            loading="lazy"
          />

        </Link>

        {/* =================================================
            WISHLIST
        ================================================== */}

        <div className="absolute right-2 top-2 flex flex-col gap-[6px] opacity-0 transition-opacity duration-200 group-hover:opacity-100">

          <button
            id={`wishlist-${product.id}`}
            type="button"
            onClick={(
              event,
            ) => {

              event.preventDefault();

              toggle(
                product.id,
              );

            }}
            aria-label={
              favorited
                ? 'Hapus dari favorit'
                : 'Tambah ke favorit'
            }
            aria-pressed={
              favorited
            }
            className={`flex h-8 w-8 items-center justify-center rounded-full bg-white/90 shadow-sm transition-all ${
              favorited
                ? 'text-[#F44336]'
                : 'text-[#1A1A1A] hover:bg-[#1A1A1A] hover:text-white'
            }`}
          >

            <Heart
              size={13}
              strokeWidth={
                favorited
                  ? 0
                  : 1.8
              }
              fill={
                favorited
                  ? 'currentColor'
                  : 'none'
              }
            />

          </button>

        </div>

      </div>

      {/* =================================================
          INFO
      ================================================== */}

      <div className="flex flex-col gap-[2px] px-[2px] pt-[10px]">

        <p className="text-[9px] font-medium uppercase tracking-[0.16em] text-[#AAA]">
          PRODUCT
        </p>

        <Link
          to={`/product/${product.id}`}
        >

          <h3
            className="line-clamp-2 text-[13px] font-normal leading-[1.35] text-[#1A1A1A] transition-colors duration-200 group-hover:text-[#555]"
            style={{
              fontFamily:
                "'Libre Bodoni', 'Playfair Display', Georgia, serif",
            }}
          >
            {
              product.name
            }
          </h3>

        </Link>

        <p className="text-[10px] text-[#AAA]">
          by Atelier
        </p>

        <p className="mt-[4px] text-[13px] font-medium text-[#1A1A1A]">
          {formatPrice(
            product.price,
          )}
        </p>

      </div>

    </div>
  );
};

export default Catalog;