import React from 'react';

import { ArrowDown } from 'lucide-react';

import ProductCard from './ProductCard';

import type { Product } from '../types/api';

const DISPLAY_FONT =
  "'Libre Bodoni', 'Bodoni Moda', 'Playfair Display', Georgia, serif";

const BODY_FONT =
  "'Inter', 'Plus Jakarta Sans', system-ui, sans-serif";

interface ProductSectionProps {
  products: Product[];
  loading?: boolean;
  loadingMore?: boolean;
  hasMore?: boolean;
  onLoadMore?: () => void;
}

const ProductSection: React.FC<ProductSectionProps> = ({
  products,
  loading = false,
  loadingMore = false,
  hasMore = false,
  onLoadMore,
}) => {
  return (
    <section
      id="rekomendasi"
      aria-label="Rekomendasi Untuk Anda"
      className="
        w-full
        bg-[#FAF9F5]
        pt-4
        pb-10
        sm:pt-5
        sm:pb-12
        lg:pt-6
        lg:pb-14
      "
    >
      <div className="mx-auto max-w-[1400px] px-6 lg:px-12">

        {/* =====================================================
            SECTION DIVIDER
        ====================================================== */}

        <div
          className="
            border-t
            border-[#D8D4CC]
            pt-4
            sm:pt-5
            lg:pt-5
          "
        >

          {/* ===================================================
              HEADER
          ==================================================== */}

          <div
            className="
              mb-5
              flex
              items-end
              justify-between
              sm:mb-6
              lg:mb-7
            "
          >
            <div>

              {/* LABEL */}

              <p
                className="
                  mb-1.5
                  text-[9px]
                  font-medium
                  uppercase
                  tracking-[0.25em]
                  text-[#999]
                "
                style={{
                  fontFamily: BODY_FONT,
                }}
              >
                PILIHAN
              </p>

              {/* TITLE */}

              <h2
                className="
                  text-[18px]
                  font-normal
                  uppercase
                  tracking-[0.12em]
                  text-[#1A1A1A]
                  sm:text-[20px]
                "
                style={{
                  fontFamily: DISPLAY_FONT,
                  fontWeight: 400,
                }}
              >
                REKOMENDASI UNTUK ANDA
              </h2>

            </div>
          </div>

          {/* ===================================================
              INITIAL LOADING
          ==================================================== */}

          {loading ? (
            <div
              className="
                grid
                grid-cols-2
                gap-x-3
                gap-y-7
                sm:grid-cols-3
                sm:gap-x-4
                sm:gap-y-8
                lg:grid-cols-5
                lg:gap-x-5
                lg:gap-y-8
              "
            >
              {Array.from({
                length: 5,
              }).map((_, index) => (
                <div
                  key={index}
                  className="animate-pulse"
                >
                  {/* IMAGE SKELETON */}

                  <div
                    className="
                      w-full
                      bg-[#ECEAE4]
                    "
                    style={{
                      aspectRatio: '3 / 4',
                    }}
                  />

                  {/* TEXT SKELETON */}

                  <div className="mt-3 space-y-2">
                    <div className="h-2 w-1/3 bg-[#ECEAE4]" />

                    <div className="h-3 w-2/3 bg-[#ECEAE4]" />

                    <div className="h-3 w-1/4 bg-[#ECEAE4]" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <>

              {/* =================================================
                  PRODUCT GRID
              ================================================== */}

              {products.length > 0 ? (
                <div
                  className="
                    grid
                    grid-cols-2
                    gap-x-3
                    gap-y-6
                    sm:grid-cols-3
                    sm:gap-x-4
                    sm:gap-y-7
                    lg:grid-cols-5
                    lg:gap-x-5
                    lg:gap-y-8
                  "
                >
                  {products.map((product) => (
                    <ProductCard
                      key={product.id}
                      product={product}
                    />
                  ))}
                </div>
              ) : (

                /* =================================================
                    EMPTY STATE
                ================================================== */

                <div className="py-8 text-center">
                  <p
                    className="
                      text-[12px]
                      text-[#999]
                    "
                    style={{
                      fontFamily: BODY_FONT,
                    }}
                  >
                    Belum ada produk untuk ditampilkan.
                  </p>
                </div>
              )}

              {/* =================================================
                  LOAD MORE
              ================================================== */}

              {hasMore && onLoadMore && (
                <div
                  className="
                    mt-7
                    flex
                    justify-center
                    sm:mt-8
                  "
                >
                  <button
                    type="button"
                    onClick={onLoadMore}
                    disabled={loadingMore}
                    className="
                      group
                      inline-flex
                      min-w-[160px]
                      items-center
                      justify-center
                      gap-2
                      border
                      border-[#CECBC3]
                      px-6
                      py-3
                      text-[10px]
                      font-medium
                      uppercase
                      tracking-[0.14em]
                      text-[#1A1A1A]
                      transition-all
                      duration-200
                      hover:border-[#1A1A1A]
                      disabled:cursor-not-allowed
                      disabled:opacity-60
                    "
                    style={{
                      fontFamily: BODY_FONT,
                    }}
                  >
                    {loadingMore ? (
                      <>
                        <span
                          className="
                            h-3.5
                            w-3.5
                            animate-spin
                            rounded-full
                            border-2
                            border-[#1A1A1A]
                            border-t-transparent
                          "
                        />

                        MEMUAT...
                      </>
                    ) : (
                      <>
                        <span>
                          Lihat Semua
                        </span>

                        <ArrowDown
                          size={13}
                          strokeWidth={1.5}
                          className="
                            transition-transform
                            duration-200
                            group-hover:translate-y-0.5
                          "
                        />
                      </>
                    )}
                  </button>
                </div>
              )}

              {/* =================================================
                  ALL PRODUCTS LOADED
              ================================================== */}

              {!hasMore && products.length > 5 && (
                <div
                  className="
                    mt-6
                    flex
                    justify-center
                  "
                >
                  <p
                    className="
                      text-[9px]
                      font-medium
                      uppercase
                      tracking-[0.16em]
                      text-[#AAA]
                    "
                    style={{
                      fontFamily: BODY_FONT,
                    }}
                  >
                    SEMUA PRODUK TELAH DITAMPILKAN
                  </p>
                </div>
              )}

            </>
          )}

        </div>
      </div>
    </section>
  );
};

export default ProductSection;