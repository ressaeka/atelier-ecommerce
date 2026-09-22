import React from 'react';

import CategoryCard from './CategoryCard';

import type { Category } from '../types/api';

const DISPLAY_FONT =
  "'Libre Bodoni', 'Bodoni Moda', 'Playfair Display', Georgia, serif";

const BODY_FONT =
  "'Inter', 'Plus Jakarta Sans', system-ui, sans-serif";

interface CategorySectionProps {
  categories: Category[];
}

const CategorySection: React.FC<CategorySectionProps> = ({
  categories,
}) => {
  return (
    <section
      id="kategori"
      aria-label="Kategori Terpilih"
      className="w-full bg-[#FAF9F5] pt-10 pb-10 sm:pt-12 sm:pb-12 lg:pt-14 lg:pb-14"
    >
      <div className="mx-auto max-w-[1400px] px-6 lg:px-12">

        {/* =====================================================
            HEADER
        ====================================================== */}

        <div className="mb-7 flex items-end justify-between gap-8 sm:mb-8 lg:mb-9">

          {/* LEFT — TITLE */}
          <div>
            <p
              className="mb-1.5 text-[9px] font-medium uppercase tracking-[0.25em] text-[#999]"
              style={{
                fontFamily: BODY_FONT,
              }}
            >
              EKSPLORASI ATELIER
            </p>

            <h2
              className="text-[18px] font-normal tracking-[0.12em] text-[#1A1A1A] sm:text-[20px]"
              style={{
                fontFamily: DISPLAY_FONT,
                fontWeight: 400,
              }}
            >
              KATEGORI TERPILIH
            </h2>
          </div>

          {/* RIGHT — DESCRIPTION */}
          <div className="hidden max-w-[300px] pb-0.5 sm:block lg:max-w-[320px]">
            <div className="mb-2.5 h-px w-8 bg-[#BDB9B0]" />

            <p
              className="text-[10px] leading-[1.7] text-[#777] sm:text-[11px]"
              style={{
                fontFamily: BODY_FONT,
              }}
            >
              Koleksi pilihan Atelier untuk melengkapi gaya
              modern dengan karakter yang sederhana dan elegan.
            </p>
          </div>
        </div>

        {/* =====================================================
            CATEGORY GRID
        ====================================================== */}

        {categories.length > 0 ? (
          <div className="grid grid-cols-2 gap-x-3 gap-y-5 sm:grid-cols-3 sm:gap-x-4 sm:gap-y-6 lg:grid-cols-5 lg:gap-x-5 lg:gap-y-7">
            {categories.map((category) => (
              <CategoryCard
                key={category.id}
                category={category}
              />
            ))}
          </div>
        ) : (
          <div className="py-8 text-center">
            <p
              className="text-[12px] text-[#AAA]"
              style={{
                fontFamily: BODY_FONT,
              }}
            >
              Kategori belum tersedia.
            </p>
          </div>
        )}
      </div>
    </section>
  );
};

export default CategorySection;