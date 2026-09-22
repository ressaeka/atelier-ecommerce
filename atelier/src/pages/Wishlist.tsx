import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Heart } from 'lucide-react';

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

const Wishlist: React.FC = () => {
  const { items, loading, remove } = useWishlist();
  const { addItem } = useCart();
  const { user } = useAuth();

  const [selected, setSelected] = useState<number[]>([]);
  const [adding, setAdding] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

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
    } catch {
      setNotice('Gagal menghapus item dari favorit.');
    }
  };

  const handleAddToCart = async () => {
    if (selected.length === 0 || adding) {
      return;
    }

    setAdding(true);
    setNotice(null);

    try {
      for (const productId of selected) {
        await addItem(productId, 1);
      }

      setNotice(
        `${selected.length} item ditambahkan ke keranjang.`,
      );

      setSelected([]);
    } catch {
      setNotice(
        'Gagal menambahkan ke keranjang. Silakan coba lagi.',
      );
    } finally {
      setAdding(false);
    }
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
                      <div className="min-w-0 flex-1">
                        <Link to={`/product/${product.id}`}>
                          <Serif
                            bold
                            as="h3"
                            className="break-words text-[13px] uppercase leading-snug tracking-[0.03em] text-[#1A1A1A] transition-colors hover:text-[#555] sm:text-[15px]"
                          >
                            {product.name}
                          </Serif>
                        </Link>

                        <Serif className="mt-4 block text-[12px] text-[#2A2A2A] sm:text-[13px]">
                          {formatRp(product.price)}
                        </Serif>
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
                onClick={handleAddToCart}
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
      </main>

      <Footer />
    </div>
  );
};

export default Wishlist;
