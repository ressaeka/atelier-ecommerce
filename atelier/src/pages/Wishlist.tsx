import React, { useMemo, useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Heart, X, AlertCircle } from 'lucide-react';

import AnnouncementBar from '../components/AnnouncementBar';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

import {
  Serif,
  SectionStrip,
  SquareCheckbox,
  formatRp,
  SERIF,
} from '../components/CommerceUI';

import { useWishlist } from '../contexts/WishlistContext';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';
import { resolveImageUrl } from '../lib/utils';
import { api } from '../lib/api';
import type { Product, ProductVariant } from '../types/api';

/* =========================================================
   VARIANT SELECTION MODAL
========================================================= */

interface VariantModalProps {
  product: Product;
  queueIndex?: number;
  queueTotal?: number;
  onClose: () => void;
  onConfirm: (variantId: number) => Promise<void>;
  submitting: boolean;
  error: string | null;
}

const VariantModal: React.FC<VariantModalProps> = ({
  product,
  queueIndex,
  queueTotal,
  onClose,
  onConfirm,
  submitting,
  error,
}) => {
  const variants = product.variants ?? [];
  const colors = useMemo(
    () => [...new Set(variants.map((v) => v.color).filter(Boolean))] as string[],
    [variants],
  );
  const sizes = useMemo(
    () => [...new Set(variants.map((v) => v.size).filter(Boolean))] as string[],
    [variants],
  );

  const [selectedColor, setSelectedColor] = useState<string | null>(colors[0] ?? null);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);

  // Set default size available for selected color
  useEffect(() => {
    if (sizes.length > 0) {
      const match =
        variants.find(
          (v) =>
            (selectedColor === null || v.color === selectedColor) &&
            v.size !== null &&
            v.stock > 0,
        ) ??
        variants.find(
          (v) =>
            (selectedColor === null || v.color === selectedColor) &&
            v.size !== null,
        );
      if (match?.size) {
        setSelectedSize(match.size);
      }
    }
  }, [selectedColor, sizes.length, variants]);

  const selectedVariant = useMemo((): ProductVariant | null => {
    return (
      variants.find(
        (v) =>
          (selectedColor === null || v.color === selectedColor) &&
          (selectedSize === null || v.size === selectedSize),
      ) ?? null
    );
  }, [variants, selectedColor, selectedSize]);

  const currentPrice = selectedVariant?.price ?? product.price;
  const currentStock = selectedVariant?.stock ?? 0;
  const isOutOfStock = selectedVariant ? selectedVariant.stock <= 0 : false;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200"
    >
      <div className="relative w-full max-w-[460px] bg-[#FAF9F5] border border-[#E3E0D9] p-5 sm:p-6 shadow-2xl">
        {/* Header */}
        <div className="flex items-start justify-between pb-3.5 border-b border-[#ECEAE4]">
          <div className="pr-4">
            <p className="text-[9px] font-semibold uppercase tracking-[0.16em] text-[#888]">
              {queueTotal && queueTotal > 1
                ? `PILIH VARIAN (${(queueIndex ?? 0) + 1} DARI ${queueTotal})`
                : 'PILIH VARIAN PRODUK'}
            </p>
            <Serif bold as="h3" className="mt-1 text-[16px] text-[#1A1A1A] leading-tight">
              {product.name}
            </Serif>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup"
            className="text-[#888] hover:text-[#1A1A1A] p-1 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Product preview */}
        <div className="flex gap-4 py-3.5 border-b border-[#ECEAE4]">
          <div className="h-[80px] w-[62px] shrink-0 overflow-hidden bg-[#ECEAE4]">
            <img
              src={resolveImageUrl(product.image, 100, 130, product.name)}
              alt={product.name}
              className="h-full w-full object-cover"
            />
          </div>
          <div className="flex-1 flex flex-col justify-center">
            <p className="text-[14px] font-bold text-[#1A1A1A]" style={{ fontFamily: SERIF }}>
              {formatRp(currentPrice)}
            </p>
            <p
              className={`mt-1 text-[11px] ${
                isOutOfStock ? 'text-[#C1603C] font-semibold' : 'text-[#777]'
              }`}
            >
              {selectedVariant
                ? isOutOfStock
                  ? 'Stok varian ini habis'
                  : `Stok tersedia: ${currentStock}`
                : 'Pilih warna & ukuran'}
            </p>
          </div>
        </div>

        {/* Error banner */}
        {error && (
          <div className="mt-3 flex items-start gap-2 bg-[#FBD9D3] p-2.5 text-[11px] text-[#8C3A1E]">
            <AlertCircle size={14} className="mt-0.5 shrink-0 text-[#C1603C]" />
            <p>{error}</p>
          </div>
        )}

        {/* Colors */}
        {colors.length > 0 && (
          <div className="mt-4">
            <p
              className="text-[10px] uppercase tracking-[0.12em] text-[#666] font-medium mb-1.5"
              style={{ fontFamily: SERIF }}
            >
              Warna: <span className="text-[#1A1A1A] font-bold">{selectedColor ?? '-'}</span>
            </p>
            <div className="flex flex-wrap gap-2">
              {colors.map((color) => {
                const isSelected = selectedColor === color;
                return (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setSelectedColor(color)}
                    className={`px-3 py-1.5 text-[10px] uppercase tracking-[0.08em] border transition-colors ${
                      isSelected
                        ? 'border-[#1A1A1A] bg-[#1A1A1A] text-white'
                        : 'border-[#CECBC3] text-[#1A1A1A] hover:border-[#1A1A1A] bg-white'
                    }`}
                  >
                    {color}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Sizes */}
        {sizes.length > 0 && (
          <div className="mt-3.5">
            <p
              className="text-[10px] uppercase tracking-[0.12em] text-[#666] font-medium mb-1.5"
              style={{ fontFamily: SERIF }}
            >
              Ukuran: <span className="text-[#1A1A1A] font-bold">{selectedSize ?? '-'}</span>
            </p>
            <div className="flex flex-wrap gap-2">
              {sizes.map((size) => {
                const variantExists = variants.some(
                  (v) =>
                    v.size === size &&
                    (selectedColor === null || v.color === selectedColor),
                );
                const isSelected = selectedSize === size;
                return (
                  <button
                    key={size}
                    type="button"
                    disabled={!variantExists}
                    onClick={() => variantExists && setSelectedSize(size)}
                    className={`min-w-[36px] px-3 py-1.5 text-[10px] uppercase tracking-[0.08em] border transition-colors ${
                      isSelected
                        ? 'border-[#1A1A1A] bg-[#1A1A1A] text-white'
                        : variantExists
                          ? 'border-[#CECBC3] text-[#1A1A1A] hover:border-[#1A1A1A] bg-white'
                          : 'border-[#E5E3DE] text-[#CCC] cursor-not-allowed bg-[#F3F2EE]'
                    }`}
                  >
                    {size}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="mt-5 flex items-center gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="flex-1 border border-[#CECBC3] px-4 py-2.5 text-[10px] uppercase font-bold tracking-[0.08em] text-[#555] hover:border-[#1A1A1A] hover:text-[#1A1A1A] transition-colors"
            style={{ fontFamily: SERIF }}
          >
            BATAL
          </button>
          <button
            type="button"
            disabled={!selectedVariant || isOutOfStock || submitting}
            onClick={() => selectedVariant && onConfirm(selectedVariant.id)}
            className="flex-1 bg-[#1A1A1A] px-4 py-2.5 text-[10px] uppercase font-bold tracking-[0.08em] text-white hover:bg-[#333] transition-colors disabled:cursor-not-allowed disabled:opacity-50"
            style={{ fontFamily: SERIF }}
          >
            {submitting ? 'MEMPROSES...' : 'MASUKKAN KERANJANG'}
          </button>
        </div>
      </div>
    </div>
  );
};

/* =========================================================
   WISHLIST COMPONENT
========================================================= */

const Wishlist: React.FC = () => {
  const { items, loading, remove } = useWishlist();
  const { addItem } = useCart();
  const { user } = useAuth();

  const [selected, setSelected] = useState<number[]>([]);
  const [adding, setAdding] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  // Variant Modal State
  const [activeModalProduct, setActiveModalProduct] = useState<Product | null>(null);
  const [pendingQueue, setPendingQueue] = useState<number[]>([]);
  const [queueTotal, setQueueTotal] = useState(1);
  const [queueIndex, setQueueIndex] = useState(0);
  const [modalSubmitting, setModalSubmitting] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  if (!user) {
    return (
      <div className="flex min-h-screen flex-col bg-[#FDFAF7]">
        <AnnouncementBar />
        <Navbar />

        <main className="flex flex-1 flex-col items-center justify-center px-6 py-24">
          <Heart
            size={44}
            strokeWidth={1}
            className="mb-5 text-[#CFCFCF]"
          />

          <Serif
            as="h1"
            className="mb-3 text-center text-[28px] text-[#1A1A1A] sm:text-[32px]"
          >
            Masuk untuk Melihat Favorit
          </Serif>

          <p className="mb-7 text-[13px] text-[#777]">
            Silakan masuk terlebih dahulu.
          </p>

          <Link
            to="/login"
            className="bg-[#1A1A1A] px-9 py-3.5 text-[11px] font-medium uppercase tracking-[0.16em] text-white transition-colors hover:bg-[#333]"
          >
            MASUK
          </Link>
        </main>

        <Footer />
      </div>
    );
  }

  const toggleRow = (productId: number) => {
    setSelected((prev) =>
      prev.includes(productId)
        ? prev.filter((id) => id !== productId)
        : [...prev, productId],
    );
  };

  const allSelected =
    items.length > 0 && selected.length === items.length;

  const toggleAll = () => {
    if (allSelected) {
      setSelected([]);
      return;
    }

    setSelected(items.map((item) => item.product.id));
  };

  const selectedTotal = useMemo(() => {
    return items
      .filter((item) => selected.includes(item.product.id))
      .reduce((sum, item) => sum + item.product.price, 0);
  }, [items, selected]);

  const handleRemove = async (productId: number) => {
    try {
      await remove(productId);

      setSelected((prev) =>
        prev.filter((id) => id !== productId),
      );
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gagal menghapus item dari favorit.';
      console.error('Error removing wishlist item:', err);
      setNotice(msg);
    }
  };

  const processQueue = async (queue: number[]) => {
    if (queue.length === 0) {
      setAdding(false);
      return;
    }

    setAdding(true);
    setNotice(null);

    const [currentId, ...rest] = queue;
    setPendingQueue(rest);

    try {
      const p = await api.get<Product>(`/product/${currentId}`);
      if (!p.variants || p.variants.length === 0) {
        // Direct add if product has no variants
        await addItem(p.id, 1, null);
        setSelected((prev) => prev.filter((id) => id !== p.id));
        setNotice(`"${p.name}" ditambahkan ke keranjang.`);
        if (rest.length > 0) {
          setQueueIndex((idx) => idx + 1);
          await processQueue(rest);
        } else {
          setAdding(false);
        }
      } else {
        // Needs variant selection
        setActiveModalProduct(p);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gagal memproses item favorit.';
      console.error('Error processing wishlist queue:', err);
      setNotice(msg);
      setAdding(false);
      setActiveModalProduct(null);
    }
  };

  const handleStartQueue = async (ids: number[]) => {
    if (ids.length === 0 || adding) return;
    setQueueTotal(ids.length);
    setQueueIndex(0);
    setModalError(null);
    await processQueue(ids);
  };

  const handleConfirmModal = async (variantId: number) => {
    if (!activeModalProduct) return;
    setModalSubmitting(true);
    setModalError(null);
    try {
      await addItem(activeModalProduct.id, 1, variantId);
      const productName = activeModalProduct.name;
      const finishedId = activeModalProduct.id;
      setSelected((prev) => prev.filter((id) => id !== finishedId));
      setNotice(`"${productName}" berhasil ditambahkan ke keranjang.`);

      const nextQueue = pendingQueue;
      setPendingQueue([]);
      if (nextQueue.length > 0) {
        setQueueIndex((idx) => idx + 1);
        await processQueue(nextQueue);
      } else {
        setActiveModalProduct(null);
        setAdding(false);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gagal menambahkan ke keranjang.';
      console.error('Error adding variant to cart:', err);
      setModalError(msg);
    } finally {
      setModalSubmitting(false);
    }
  };

  const handleCloseModal = () => {
    setActiveModalProduct(null);
    setPendingQueue([]);
    setAdding(false);
  };

  return (
    <div className="flex min-h-screen flex-col bg-[#F5F5F5]">
      <AnnouncementBar />
      <Navbar />

      <main className="flex-1">
        <div className="mx-auto max-w-[1100px] px-3 py-6 sm:px-6 sm:py-10">
          <div className="bg-[#FDFAF7] shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
            <SectionStrip>
              FAVORIT SAYA
            </SectionStrip>

            {loading ? (
              <div className="space-y-6 bg-[#D9D9D9] px-4 py-6 sm:px-6">
                {Array.from({ length: 3 }).map((_, index) => (
                  <div
                    key={index}
                    className="flex animate-pulse gap-5"
                  >
                    <div className="h-[26px] w-[26px] bg-[#C9C9C9]" />

                    <div className="h-[140px] w-[110px] bg-[#C9C9C9]" />

                    <div className="flex-1 space-y-3 pt-4">
                      <div className="h-3.5 w-1/2 bg-[#C9C9C9]" />
                      <div className="h-3 w-1/4 bg-[#C9C9C9]" />
                    </div>
                  </div>
                ))}
              </div>
            ) : items.length === 0 ? (
              <div className="flex flex-col items-center justify-center bg-[#D9D9D9] px-6 py-24 text-center">
                <Heart
                  size={40}
                  strokeWidth={1}
                  className="mb-4 text-[#A9A9A9]"
                />

                <Serif className="text-[16px] text-[#4A4A4A]">
                  Belum ada item favorit
                </Serif>

                <Link
                  to="/catalog"
                  className="mt-5 text-[11px] uppercase tracking-[0.12em] text-[#5A5A5A] underline underline-offset-4 transition-colors hover:text-[#1A1A1A]"
                >
                  Jelajahi Koleksi
                </Link>
              </div>
            ) : (
              <div className="bg-[#D9D9D9]">
                {items.map((item, index) => {
                  const product = item.product;

                  return (
                    <div
                      key={item.id}
                      className={`flex items-center gap-3 px-3 py-5 sm:gap-5 sm:px-6 ${
                        index > 0
                          ? 'border-t border-[#C9C9C9]'
                          : ''
                      }`}
                    >
                      {/* Remove from wishlist */}
                      <button
                        type="button"
                        onClick={() =>
                          handleRemove(product.id)
                        }
                        aria-label={`Hapus ${product.name} dari favorit`}
                        className="mt-1 flex-shrink-0 self-start text-[#F44336] transition-colors hover:text-[#C62828]"
                      >
                        <Heart
                          size={26}
                          strokeWidth={0}
                          fill="currentColor"
                        />
                      </button>

                      {/* Selector */}
                      <div className="flex-shrink-0 self-center">
                        <SquareCheckbox
                          checked={selected.includes(product.id)}
                          onChange={() =>
                            toggleRow(product.id)
                          }
                          label={`Pilih ${product.name}`}
                        />
                      </div>

                      {/* Thumbnail */}
                      <Link
                        to={`/product/${product.id}`}
                        className="flex-shrink-0"
                      >
                        <div className="h-[120px] w-[92px] overflow-hidden bg-[#ECEAE4] sm:h-[140px] sm:w-[105px]">
                          <img
                            src={resolveImageUrl(
                              product.image,
                              105,
                              140,
                              product.name,
                            )}
                            alt={product.name}
                            className="h-full w-full object-cover"
                          />
                        </div>
                      </Link>

                      {/* Product detail */}
                      <div className="min-w-0 flex-1 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                        <div>
                          <Link to={`/product/${product.id}`}>
                            <Serif
                              bold
                              as="h3"
                              className="break-words text-[13px] uppercase leading-snug tracking-[0.03em] text-[#1A1A1A] transition-colors hover:text-[#555] sm:text-[15px]"
                            >
                              {product.name}
                            </Serif>
                          </Link>

                          <Serif className="mt-2 block text-[12px] text-[#2A2A2A] sm:text-[13px]">
                            {formatRp(product.price)}
                          </Serif>
                        </div>

                        <div>
                          <button
                            type="button"
                            onClick={() => void handleStartQueue([product.id])}
                            disabled={adding}
                            className="border border-[#1A1A1A] px-3.5 py-1.5 text-[10px] uppercase tracking-[0.1em] font-medium text-[#1A1A1A] hover:bg-[#1A1A1A] hover:text-white transition-colors whitespace-nowrap disabled:opacity-50"
                            style={{ fontFamily: SERIF }}
                          >
                            + Keranjang
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {notice && (
              <div className="border-t border-[#E0DED8] bg-[#EFEEEA] px-4 py-2.5 text-[12px] text-[#4A4A4A] sm:px-6">
                {notice}
              </div>
            )}

            {/* Action bar */}
            <div className="flex items-center gap-3 bg-[#FDFAF7] px-4 py-5 sm:gap-6 sm:px-6">
              <SquareCheckbox
                checked={allSelected}
                onChange={toggleAll}
                label="Pilih semua favorit"
              />

              <span className="text-[13px] text-[#1A1A1A] sm:text-[14px]">
                Semua
              </span>

              <Serif
                bold
                className="ml-auto whitespace-nowrap text-[12px] text-[#1A1A1A] sm:text-[13px]"
              >
                {selectedTotal === 0
                  ? 'RP0'
                  : formatRp(selectedTotal)}
              </Serif>

              <button
                type="button"
                onClick={() => void handleStartQueue(selected)}
                disabled={selected.length === 0 || adding}
                className={`ml-2 whitespace-nowrap rounded-[4px] px-4 py-3 text-[10.5px] uppercase tracking-[0.06em] transition-colors duration-200 sm:ml-4 sm:px-8 sm:text-[12.5px] ${
                  selected.length === 0 || adding
                    ? 'cursor-not-allowed bg-[#D9D9D9] text-[#1A1A1A]'
                    : 'bg-[#1A1A1A] text-white hover:bg-[#333]'
                }`}
                style={{
                  fontFamily: SERIF,
                  fontWeight: 700,
                }}
              >
                {adding
                  ? 'MEMPROSES...'
                  : 'MASUKAN KERANJANG'}
              </button>
            </div>
          </div>
        </div>

        {/* Variant Selection Modal */}
        {activeModalProduct && (
          <VariantModal
            product={activeModalProduct}
            queueIndex={queueIndex}
            queueTotal={queueTotal}
            onClose={handleCloseModal}
            onConfirm={handleConfirmModal}
            submitting={modalSubmitting}
            error={modalError}
          />
        )}
      </main>

      <Footer />
    </div>
  );
};

export default Wishlist;
