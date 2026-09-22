import React, { useState } from 'react';

import { Link } from 'react-router-dom';

import type { Category } from '../types/api';
import { resolveCategoryImage } from '../lib/utils';

interface CategoryCardProps {
  category: Category;
}

const DISPLAY_FONT =
  "'Libre Bodoni', 'Bodoni Moda', 'Playfair Display', Georgia, serif";

const BODY_FONT =
  "'Inter', 'Plus Jakarta Sans', system-ui, sans-serif";

const CategoryCard: React.FC<CategoryCardProps> = ({
  category,
}) => {
  const [imgError, setImgError] = useState(false);

  const categoryImage = resolveCategoryImage(category.name);

  return (
    <Link
      to={`/catalog?category=${category.id}`}
      id={`category-${category.id}`}
      aria-label={`Kategori ${category.name}`}
      className="group flex flex-col"
    >

      {/* =====================================================
          IMAGE
      ====================================================== */}

      <div
        className="w-full overflow-hidden rounded-[12px] bg-[#EDE9E2]"
        style={{
          aspectRatio: '3 / 4',
        }}
      >
        {categoryImage && !imgError ? (

          <img
            src={categoryImage}
            alt={category.name}
            onError={() => setImgError(true)}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.035]"
          />

        ) : (

          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-[#E8E4DC] to-[#D8D2C8]">

            <span
              className="text-[34px] text-[#8B8075]/60"
              style={{
                fontFamily: DISPLAY_FONT,
                fontWeight: 400,
              }}
            >
              {category.name.charAt(0)}
            </span>

          </div>
        )}
      </div>

      {/* =====================================================
          INFO
      ====================================================== */}

      <div className="mt-2.5 px-0.5">

        <h3
          className="text-[15px] leading-[1.2] text-[#1A1A1A] transition-colors duration-300 group-hover:text-[#555]"
          style={{
            fontFamily: DISPLAY_FONT,
            fontWeight: 400,
          }}
        >
          {category.name}
        </h3>

        <p
          className="mt-1 text-[8px] font-medium uppercase tracking-[0.18em] text-[#999]"
          style={{
            fontFamily: BODY_FONT,
          }}
        >
          {category.productCount ?? 0} model pilihan
        </p>

      </div>

    </Link>
  );
};

export default CategoryCard;