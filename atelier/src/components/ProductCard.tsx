import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Heart } from 'lucide-react';
import { useWishlist } from '../contexts/WishlistContext';
import type { Product } from '../types/api';
import { formatPrice, resolveImageUrl } from '../lib/utils';

interface ProductCardProps {
  product: Product;
}

const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const [imgError, setImgError] = useState(false);
  const { has, toggle } = useWishlist();
  const favorited = has(product.id);

  return (
    <div
      id={`product-${product.id}`}
      className="group flex flex-col"
    >
      {/* Image Container */}
      <div className="relative w-full overflow-hidden bg-[#ECEAE4]" style={{ aspectRatio: '3/4' }}>
        {/* Product Image */}
        <Link to={`/product/${product.id}`}>
          <img
            src={imgError
              ? resolveImageUrl(null, 400, 533, product.name)
              : resolveImageUrl(product.image, 400, 533, product.name)
            }
            alt={product.name}
            onError={() => setImgError(true)}
            className="w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.05]"
            loading="lazy"
          />
        </Link>

        {/* Favorite Button */}
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            toggle(product.id);
          }}
          aria-label={favorited ? 'Hapus dari favorit' : 'Tambah ke favorit'}
          aria-pressed={favorited}
          className={`absolute top-3 right-3 w-8 h-8 flex items-center justify-center rounded-full bg-white/70 transition-all duration-200 ${
            favorited
              ? 'opacity-100 text-[#F44336]'
              : 'opacity-0 group-hover:opacity-100 text-[#1A1A1A]'
          }`}
        >
          <Heart size={14} strokeWidth={favorited ? 0 : 1.8} fill={favorited ? 'currentColor' : 'none'} />
        </button>
      </div>

      {/* Info */}
      <div className="flex flex-col pt-3 gap-[3px]">
        {/* Category placeholder - backend doesn't have category name in product response */}
        <p className="text-[9.5px] tracking-[0.14em] uppercase text-[#999] font-medium">
          PRODUCT
        </p>

        {/* Name */}
        <Link to={`/product/${product.id}`}>
          <h3
            className="text-[14px] leading-[1.3] text-[#1A1A1A] transition-colors duration-200 group-hover:text-[#444]"
            style={{ fontFamily: "'Libre Bodoni', 'Playfair Display', Georgia, serif", fontWeight: 400 }}
          >
            {product.name}
          </h3>
        </Link>

        {/* Price */}
        <p className="text-[13px] text-[#1A1A1A] font-medium mt-[2px]">
          {formatPrice(product.price)}
        </p>
      </div>
    </div>
  );
};

export default ProductCard;
