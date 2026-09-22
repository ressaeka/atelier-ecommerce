import React, { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  ShoppingBag,
  Ticket,
  Trash2,
} from 'lucide-react';

import AnnouncementBar from '../components/AnnouncementBar';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import Breadcrumb from '../components/Breadcrumb';

import {
  Serif,
  SectionStrip,
  SquareCheckbox,
  QuantityStepper,
  ColumnLabel,
  formatRp,
  SERIF,
} from '../components/CommerceUI';

import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';
import { resolveImageUrl } from '../lib/utils';

const Cart: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const {
    items,
    loading,
    updateItem,
    removeItem,
    updatingItemKey,
  } = useCart();

  const [selected, setSelected] =
    useState<string[]>([]);

  const [voucher, setVoucher] =
    useState('');

  const [voucherOpen, setVoucherOpen] =
    useState(false);

  const itemKey = (
    productId: number,
    variantId: number | null | undefined,
  ) =>
    `${productId}:${variantId ?? ''}`;

  const toggleRow = (
    productId: number,
    variantId: number | null | undefined,
  ) => {
    const key = itemKey(
      productId,
      variantId,
    );

    setSelected((prev) =>
      prev.includes(key)
        ? prev.filter(
            (value) => value !== key,
          )
        : [...prev, key],
    );
  };

  const allSelected =
    items.length > 0 &&
    items.every((item) =>
      selected.includes(
        itemKey(
          item.productId,
          item.variantId,
        ),
      ),
    );

  const toggleAll = () => {
    if (allSelected) {
      setSelected([]);
      return;
    }

    setSelected(
      items.map((item) =>
        itemKey(
          item.productId,
          item.variantId,
        ),
      ),
    );
  };

  const selectedTotal = useMemo(
    () =>
      items
        .filter((item) =>
          selected.includes(
            itemKey(
              item.productId,
              item.variantId,
            ),
          ),
        )
        .reduce(
          (sum, item) =>
            sum +
            (item.variant?.price ??
              item.product.price) *
              item.quantity,
          0,
        ),
    [items, selected],
  );

  const handleCheckout = () => {
    if (selected.length === 0) return;

    navigate('/payment', {
      state: {
        productIds: selected,
        voucher,
      },
    });
  };

  /* ============================================================
     GUEST
  ============================================================ */

  if (!user) {
    return (
      <div className="flex min-h-screen flex-col bg-[#FDFAF7]">
        <AnnouncementBar />
        <Navbar />

        <main className="flex flex-1 flex-col items-center justify-center px-6 py-24">
          <ShoppingBag
            size={44}
            strokeWidth={1}
            className="mb-5 text-[#CFCFCF]"
          />

          <Serif
            as="h1"
            className="mb-3 text-center text-[28px] text-[#1A1A1A] sm:text-[32px]"
          >
            Masuk untuk Melihat Keranjang
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

  return (
    <div className="flex min-h-screen flex-col bg-[#F5F5F5]">
      <AnnouncementBar />
      <Navbar />

      <main className="flex-1">
        <div className="mx-auto max-w-[1100px] px-3 py-6 sm:px-6 sm:py-10">

          {/* =====================================================
              BREADCRUMB
          ====================================================== */}

          <Breadcrumb
            items={[
              {
                label: 'BERANDA',
                href: '/',
              },
              {
                label: 'KERANJANG',
              },
            ]}
          />

          {/* =====================================================
              BACK TO CATALOG
          ====================================================== */}

          <div className="mb-4">
            <Link
              to="/catalog"
              className="inline-flex items-center gap-1.5 text-[11px] uppercase tracking-[0.12em] text-[#5A5A5A] transition-colors hover:text-[#1A1A1A]"
            >
              <ArrowLeft
                size={12}
                strokeWidth={1.5}
              />
              Lanjut Belanja
            </Link>
          </div>

          {/* =====================================================
              CART CONTAINER
          ====================================================== */}

          <div className="bg-[#FDFAF7] shadow-[0_1px_3px_rgba(0,0,0,0.04)]">

            {/* =================================================
                HEADER
            ================================================== */}

            <SectionStrip>
              KERANJANG SAYA
            </SectionStrip>

            {/* =================================================
                CART ITEMS
            ================================================== */}

            {loading ? (
              <div className="space-y-6 bg-[#D9D9D9] px-4 py-6 sm:px-6">
                {Array.from({
                  length: 3,
                }).map((_, index) => (
                  <div
                    key={index}
                    className="flex animate-pulse gap-5"
                  >
                    <div className="h-[130px] w-[110px] bg-[#C9C9C9]" />

                    <div className="flex-1 space-y-3 pt-2">
                      <div className="h-3.5 w-1/2 bg-[#C9C9C9]" />

                      <div className="h-8 w-[130px] bg-[#C9C9C9]" />

                      <div className="h-3 w-1/3 bg-[#C9C9C9]" />
                    </div>
                  </div>
                ))}
              </div>
            ) : items.length === 0 ? (
              <div className="flex flex-col items-center justify-center bg-[#D9D9D9] px-6 py-24 text-center">
                <ShoppingBag
                  size={40}
                  strokeWidth={1}
                  className="mb-4 text-[#A9A9A9]"
                />

                <Serif className="text-[16px] text-[#4A4A4A]">
                  Keranjang Anda masih kosong
                </Serif>

                <Link
                  to="/catalog"
                  className="mt-5 inline-flex items-center gap-1.5 text-[11px] uppercase tracking-[0.12em] text-[#5A5A5A] underline underline-offset-4 transition-colors hover:text-[#1A1A1A]"
                >
                  <ArrowLeft
                    size={12}
                    strokeWidth={1.5}
                  />
                  Lanjut Belanja
                </Link>
              </div>
            ) : (
              <div className="bg-[#D9D9D9]">
                {items.map(
                  (item, index) => {
                    const currentItemKey =
                      itemKey(
                        item.productId,
                        item.variantId,
                      );

                    const unitPrice =
                      item.variant?.price ??
                      item.product.price;

                    const lineTotal =
                      unitPrice *
                      item.quantity;

                    const isUpdating =
                      updatingItemKey ===
                      currentItemKey;

                    return (
                      <div
                        key={item.id}
                        className={`flex items-stretch gap-3 px-3 py-5 sm:gap-5 sm:px-6 ${
                          index > 0
                            ? 'border-t border-[#C9C9C9]'
                            : ''
                        }`}
                      >

                        {/* =================================================
                            CHECKBOX
                        ================================================== */}

                        <div className="flex flex-col justify-end pb-1">
                          <SquareCheckbox
                            checked={selected.includes(
                              currentItemKey,
                            )}
                            onChange={() =>
                              toggleRow(
                                item.productId,
                                item.variantId,
                              )
                            }
                            label={`Pilih ${item.product.name}`}
                          />
                        </div>

                        {/* =================================================
                            IMAGE
                        ================================================== */}

                        <Link
                          to={`/product/${item.productId}`}
                          className="shrink-0"
                        >
                          <div className="h-[110px] w-[92px] overflow-hidden bg-[#ECEAE4] sm:h-[130px] sm:w-[110px]">
                            <img
                              src={resolveImageUrl(
                                item.product.image,
                                110,
                                130,
                                item.product.name,
                              )}
                              alt={item.product.name}
                              className="h-full w-full object-cover"
                            />
                          </div>
                        </Link>

                        {/* =================================================
                            INFO
                        ================================================== */}

                        <div className="flex min-w-0 flex-1 flex-col sm:flex-row sm:gap-4">

                          {/* PRODUCT */}

                          <div className="flex min-w-0 flex-1 flex-col">

                            <Link
                              to={`/product/${item.productId}`}
                              className="min-w-0"
                            >
                              <Serif
                                bold
                                as="h3"
                                className="break-words text-[13px] uppercase leading-snug tracking-[0.03em] text-[#1A1A1A] transition-colors hover:text-[#555] sm:text-[15px]"
                              >
                                {
                                  item.product
                                    .name
                                }
                              </Serif>
                            </Link>

                            {/* VARIANT */}

                            {item.variant && (
                              <div className="mt-2.5">
                                <span className="inline-flex items-center gap-1.5 rounded-[6px] border border-[#E0DED8] bg-[#EFEEEA] px-3 py-1.5 text-[11px] uppercase tracking-[0.1em] text-[#2A2A2A] sm:text-[12px]">
                                  {[
                                    item.variant
                                      .color,
                                    item.variant
                                      .size,
                                  ]
                                    .filter(
                                      Boolean,
                                    )
                                    .join(
                                      ' · ',
                                    )}
                                </span>
                              </div>
                            )}

                            {/* UNIT PRICE */}

                            <Serif
                              className="mt-3 text-[12px] text-[#2A2A2A] sm:text-[13px]"
                            >
                              {formatRp(
                                unitPrice,
                              )}
                            </Serif>
                          </div>

                          {/* =================================================
                              QUANTITY / TOTAL
                          ================================================== */}

                          <div className="mt-3 flex flex-row items-center justify-between gap-3 sm:mt-0 sm:min-w-[180px] sm:flex-col sm:items-end">

                            {/* QUANTITY */}

                            <div className="flex flex-col items-center gap-2">
                              <ColumnLabel>
                                JUMLAH
                              </ColumnLabel>

                              <QuantityStepper
                                quantity={
                                  item.quantity
                                }
                                disabled={
                                  isUpdating
                                }
                                onDecrease={() => {
                                  if (
                                    isUpdating
                                  ) {
                                    return;
                                  }

                                  if (
                                    item.quantity <=
                                    1
                                  ) {
                                    void removeItem(
                                      item.productId,
                                      item.variantId,
                                    );
                                    return;
                                  }

                                  void updateItem(
                                    item.productId,
                                    item.quantity -
                                      1,
                                    item.variantId,
                                  );
                                }}
                                onIncrease={() => {
                                  if (
                                    isUpdating
                                  ) {
                                    return;
                                  }

                                  void updateItem(
                                    item.productId,
                                    item.quantity +
                                      1,
                                    item.variantId,
                                  );
                                }}
                              />
                            </div>

                            {/* TOTAL + REMOVE */}

                            <div className="flex items-center gap-3 sm:mt-auto">

                              <Serif
                                bold
                                className="whitespace-nowrap text-[12px] text-[#1A1A1A] sm:text-[13px]"
                              >
                                TOTAL :{' '}
                                {formatRp(
                                  lineTotal,
                                )}
                              </Serif>

                              <button
                                type="button"
                                onClick={() => {
                                  if (
                                    isUpdating
                                  ) {
                                    return;
                                  }

                                  void removeItem(
                                    item.productId,
                                    item.variantId,
                                  );
                                }}
                                disabled={
                                  isUpdating
                                }
                                aria-label={`Hapus ${item.product.name}`}
                                className="text-[#8A8A8A] transition-colors hover:text-[#1A1A1A] disabled:cursor-not-allowed disabled:opacity-50"
                              >
                                <Trash2
                                  size={15}
                                  strokeWidth={1.5}
                                />
                              </button>

                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  },
                )}
              </div>
            )}

            {/* =====================================================
                VOUCHER
            ====================================================== */}

            <div className="flex items-center gap-3 border-t border-[#C9C9C9] bg-[#D9D9D9] px-4 py-3 sm:px-6">

              <Ticket
                size={18}
                strokeWidth={2}
                className="shrink-0 text-[#1A1A1A]"
              />

              <span className="text-[13px] text-[#1A1A1A]">
                Voucher
              </span>

              {voucherOpen ? (
                <input
                  autoFocus
                  value={voucher}
                  onChange={(event) =>
                    setVoucher(
                      event.target.value.toUpperCase(),
                    )
                  }
                  onBlur={() =>
                    setVoucherOpen(false)
                  }
                  placeholder="MASUKKAN KODE"
                  className="ml-auto w-[190px] max-w-[55%] border border-[#BFBFBF] bg-white px-3 py-1.5 text-[12px] tracking-[0.08em] text-[#1A1A1A] placeholder:text-[#A0A0A0] outline-none focus:border-[#1A1A1A]"
                />
              ) : (
                <button
                  type="button"
                  onClick={() =>
                    setVoucherOpen(true)
                  }
                  className="ml-auto text-right text-[13px] text-[#8A8A8A] transition-colors hover:text-[#1A1A1A]"
                >
                  {voucher ||
                    'Gunakan/Masukkan Kode'}
                </button>
              )}

            </div>

            {/* =====================================================
                SUMMARY
            ====================================================== */}

            <div className="flex items-center gap-3 bg-[#FDFAF7] px-4 py-5 sm:gap-6 sm:px-6">

              <SquareCheckbox
                checked={allSelected}
                onChange={toggleAll}
                label="Pilih semua item"
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
                  : formatRp(
                      selectedTotal,
                    )}
              </Serif>

              <button
                type="button"
                onClick={
                  handleCheckout
                }
                disabled={
                  selected.length === 0
                }
                className={`ml-2 rounded-[4px] px-5 py-3 text-[11px] uppercase tracking-[0.08em] transition-colors sm:ml-4 sm:px-10 sm:text-[13px] ${
                  selected.length === 0
                    ? 'cursor-not-allowed bg-[#D9D9D9] text-[#1A1A1A]'
                    : 'bg-[#1A1A1A] text-white hover:bg-[#333]'
                }`}
                style={{
                  fontFamily: SERIF,
                  fontWeight: 700,
                }}
              >
                CHECKOUT(
                {selected.length})
              </button>

            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Cart;