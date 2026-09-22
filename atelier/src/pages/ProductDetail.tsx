import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Heart, ShoppingBag, ArrowLeft } from 'lucide-react';
import { useWishlist } from '../contexts/WishlistContext';
import AnnouncementBar from '../components/AnnouncementBar';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import Breadcrumb from '../components/Breadcrumb';
import { api } from '../lib/api';
import { formatPrice, resolveImageUrl } from '../lib/utils';
import { useAuth } from '../contexts/AuthContext';
import { useCart } from '../contexts/CartContext';
import type { Product, ProductVariant } from '../types/api';

const ProductDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { items: cartItems, addItem } = useCart();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [addingToCart, setAddingToCart] = useState(false);
  const [cartSuccess, setCartSuccess] = useState(false);
  const [cartError, setCartError] = useState('');
  const [imgError, setImgError] = useState(false);
  const { has, toggle } = useWishlist();
  const favorited = product ? has(product.id) : false;

  const variants = product?.variants ?? [];
  const hasVariants = variants.length > 0;

  const colors = useMemo(
    () => [...new Set(variants.map((v) => v.color).filter(Boolean))] as string[],
    [variants],
  );
  const sizes = useMemo(
    () => [...new Set(variants.map((v) => v.size).filter(Boolean))] as string[],
    [variants],
  );

  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);

  const selectedVariant = useMemo((): ProductVariant | null => {
    if (!hasVariants) return null;
    return (
      variants.find(
        (v) =>
          (selectedColor === null || v.color === selectedColor) &&
          (selectedSize === null || v.size === selectedSize),
      ) ?? null
    );
  }, [variants, selectedColor, selectedSize, hasVariants]);

  useEffect(() => {
    if (colors.length > 0 && selectedColor === null) {
      setSelectedColor(colors[0]);
    }
  }, [colors, selectedColor]);

  useEffect(() => {
    if (sizes.length > 0 && selectedSize === null) {
      setSelectedSize(sizes[0]);
    }
  }, [sizes, selectedSize]);

  // Reset size when color ACTUALLY changes — not on every render
  const prevColorRef = useRef<string | null>(null);
  useEffect(() => {
    if (prevColorRef.current !== selectedColor) {
      prevColorRef.current = selectedColor;
      if (selectedColor !== null && sizes.length > 0) {
        const firstAvailable = variants.find(
          (v) => v.color === selectedColor && v.size !== null,
        );
        if (firstAvailable) {
          setSelectedSize(firstAvailable.size);
        } else {
          setSelectedSize(null);
        }
      }
    }
  }, [selectedColor, sizes.length, variants]);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    setError(false);
    setSelectedColor(null);
    setSelectedSize(null);
    api.get<Product>(`/product/${id}`)
      .then(setProduct)
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [id]);

  const currentPrice = selectedVariant?.price ?? product?.price ?? 0;
  const currentStock = selectedVariant?.stock ?? product?.stock ?? 0;

  const alreadyInCart = useMemo(() => {
    if (!product) return false;
    if (hasVariants) {
      if (!selectedVariant) return false;
      return cartItems.some(
        (item) => item.productId === product.id && item.variantId === selectedVariant.id,
      );
    }
    return cartItems.some((item) => item.productId === product.id);
  }, [product, cartItems, hasVariants, selectedVariant]);

  const handleAddToCart = async () => {
    if (!product) return;
    if (!user) {
      window.location.href = '/login';
      return;
    }
    if (alreadyInCart) return;

    setAddingToCart(true);
    setCartError('');
    setCartSuccess(false);

    try {
      await addItem(product.id, 1, selectedVariant?.id ?? null);
      setCartSuccess(true);
      setTimeout(() => setCartSuccess(false), 2000);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Gagal menambahkan ke keranjang';
      setCartError(message);
      setTimeout(() => setCartError(''), 3000);
    } finally {
      setAddingToCart(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col min-h-screen bg-[#FAF9F5]">
        <AnnouncementBar />
        <Navbar />
        <main className="flex-1 flex items-center justify-center">
          <div className="animate-pulse text-[14px] text-[#999]">Memuat produk...</div>
        </main>
        <Footer />
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="flex flex-col min-h-screen bg-[#FAF9F5]">
        <AnnouncementBar />
        <Navbar />
        <main className="flex-1 flex flex-col items-center justify-center py-24 px-6">
          <h1
            className="text-[40px] text-[#1A1A1A] mb-4"
            style={{ fontFamily: "'Libre Bodoni', Georgia, serif", fontWeight: 400 }}
          >
            Produk Tidak Ditemukan
          </h1>
          <Link
            to="/catalog"
            className="mt-6 inline-flex items-center gap-2 text-[11px] tracking-[0.14em] uppercase text-[#666] hover:text-[#1A1A1A] transition-colors"
          >
            <ArrowLeft size={14} strokeWidth={1.5} /> Kembali ke Katalog
          </Link>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-[#FAF9F5]">
      <AnnouncementBar />
      <Navbar />
      <main className="flex-1">
        <div className="max-w-[1400px] mx-auto px-6 py-10">
          <Breadcrumb
            items={[
              { label: 'BERANDA', href: '/' },
              { label: 'KATEGORI', href: '/catalog' },
              { label: product.category?.name ?? 'PRODUK', href: product.categoryId ? `/catalog?category=${product.categoryId}` : undefined },
              { label: product.name },
            ]}
          />

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16">
            {/* Image */}
            <div className="w-full overflow-hidden bg-[#ECEAE4]" style={{ aspectRatio: '3/4' }}>
              <img
                src={imgError
                  ? resolveImageUrl(null, 800, 1066, product.name)
                  : resolveImageUrl(product.image, 800, 1066, product.name)
                }
                alt={product.name}
                onError={() => setImgError(true)}
                className="w-full h-full object-cover"
              />
            </div>

            {/* Info */}
            <div className="flex flex-col justify-center py-4">
              <p className="text-[10px] tracking-[0.16em] uppercase text-[#999] mb-2">ATELIER</p>
              <h1
                className="text-[36px] lg:text-[44px] leading-[1.15] text-[#1A1A1A] mb-4"
                style={{ fontFamily: "'Libre Bodoni', Georgia, serif", fontWeight: 400 }}
              >
                {product.name}
              </h1>
              <p className="text-[20px] text-[#1A1A1A] font-medium mb-8">{formatPrice(currentPrice)}</p>

              {/* Stock info */}
              <p className="text-[12px] text-[#888] mb-6">
                {currentStock > 0 ? `Stok tersedia: ${currentStock}` : 'Stok habis'}
              </p>

              {/* Variant selectors */}
              {hasVariants && colors.length > 0 && (
                <div className="mb-4">
                  <p className="text-[11px] tracking-[0.12em] uppercase text-[#1A1A1A] font-medium mb-2">Warna</p>
                  <div className="flex flex-wrap gap-2">
                    {colors.map((color) => (
                      <button
                        key={color}
                        type="button"
                        onClick={() => setSelectedColor(color)}
                        className={`px-4 py-2 text-[11px] tracking-[0.08em] uppercase border transition-colors duration-200 ${
                          selectedColor === color
                            ? 'border-[#1A1A1A] bg-[#1A1A1A] text-white'
                            : 'border-[#CECBC3] text-[#1A1A1A] hover:border-[#1A1A1A]'
                        }`}
                      >
                        {color}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {hasVariants && sizes.length > 0 && (
                <div className="mb-6">
                  <p className="text-[11px] tracking-[0.12em] uppercase text-[#1A1A1A] font-medium mb-2">Ukuran</p>
                  <div className="flex flex-wrap gap-2">
                    {sizes.map((size) => {
                      const variantExists = variants.some(
                        (v) => v.size === size && (selectedColor === null || v.color === selectedColor),
                      );
                      return (
                        <button
                          key={size}
                          type="button"
                          onClick={() => variantExists && setSelectedSize(size)}
                          disabled={!variantExists}
                          className={`px-4 py-2 text-[11px] tracking-[0.08em] uppercase border transition-colors duration-200 ${
                            selectedSize === size
                              ? 'border-[#1A1A1A] bg-[#1A1A1A] text-white'
                              : variantExists
                                ? 'border-[#CECBC3] text-[#1A1A1A] hover:border-[#1A1A1A]'
                                : 'border-[#E0DED8] text-[#CCC] cursor-not-allowed'
                          }`}
                        >
                          {size}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Description */}
              {product.description && (
                <div className="mb-6">
                  <p className="text-[12.5px] leading-[1.8] text-[#666]">
                    {product.description}
                  </p>
                </div>
              )}

              {/* Actions */}
              <div className="flex flex-col gap-3 max-w-[440px]">
                {/* Success/Error feedback */}
                {cartSuccess && (
                  <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 p-3 text-[11px] font-semibold tracking-wide">
                    Berhasil ditambahkan ke keranjang!
                  </div>
                )}
                {cartError && (
                  <div className="bg-red-50 border border-red-200 text-red-700 p-3 text-[11px] font-semibold tracking-wide">
                    {cartError}
                  </div>
                )}

                <button
                  onClick={handleAddToCart}
                  disabled={addingToCart || alreadyInCart || currentStock === 0}
                  className={`w-full text-[11px] tracking-[0.16em] uppercase font-medium py-4 flex items-center justify-center gap-2 transition-colors duration-200 disabled:cursor-not-allowed ${
                    alreadyInCart
                      ? 'bg-[#E7E5E0] text-[#777] cursor-not-allowed'
                      : 'bg-[#1A1A1A] text-white hover:bg-[#333] disabled:opacity-50'
                  }`}
                >
                  {addingToCart ? (
                    <>
                      <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      MEMPROSES...
                    </>
                  ) : alreadyInCart ? (
                    <>
                      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                      SUDAH DI KERANJANG
                    </>
                  ) : currentStock === 0 ? (
                    'STOK HABIS'
                  ) : (
                    <>
                      <ShoppingBag size={16} strokeWidth={1.5} />
                      TAMBAH KE KERANJANG
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => toggle(product.id)}
                  aria-pressed={favorited}
                  className={`w-full border text-[11px] tracking-[0.16em] uppercase font-medium py-4 flex items-center justify-center gap-2 transition-colors duration-200 ${
                    favorited
                      ? 'border-[#F44336] text-[#F44336]'
                      : 'border-[#CECBC3] text-[#1A1A1A] hover:border-[#1A1A1A]'
                  }`}
                >
                  <Heart
                    size={16}
                    strokeWidth={favorited ? 0 : 1.5}
                    fill={favorited ? 'currentColor' : 'none'}
                  />
                  {favorited ? 'TERSIMPAN DI FAVORIT' : 'SIMPAN KE WISHLIST'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default ProductDetail;

