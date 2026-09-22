import React, { useState, useEffect, useMemo } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  MapPin,
  Pencil,
  Truck,
  Zap,
  Lock,
  Copy,
  Check,
  AlertCircle,
  X,
  ArrowRight,
  ArrowLeft,
  Printer,
} from 'lucide-react';

import AnnouncementBar from '../components/AnnouncementBar';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { Serif, SERIF } from '../components/CommerceUI';

import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';

import { api } from '../lib/api';
import { resolveImageUrl } from '../lib/utils';

import type { Address } from '../types/api';

import {
  saveOrder,
  newOrderId,
  makeVirtualAccount,
  type Order,
  type OrderLine,
} from '../lib/orders';

const SHIPPING_COST = 35000;

const BANKS = [
  'BCA',
  'MANDIRI',
  'BNI',
];

const VA_INSTRUCTIONS: Array<{
  title: string;
  steps: string[];
}> = [
  {
    title: '1. ATM BCA',
    steps: [
      'Pilih Transaksi Lainnya',
      'Transfer > ke Rekening BCA',
      'Virtual Account.',
    ],
  },
  {
    title: '2. M-BCA (MOBILE BANKING)',
    steps: [
      'Pilih m-Transfer > BCA Virtual',
      'Account > Masukkan nomor VA',
      'di atas.',
    ],
  },
  {
    title: '3. MYBCA',
    steps: [
      'Transfer Dana > Transfer ke BCA',
      'Virtual Account > Otorisasi',
      'KeyBCA.',
    ],
  },
];

const Payment: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const { user } = useAuth();
  const { items, clearCart } = useCart();

  /* ============================================================
     CHECKOUT STATE
  ============================================================ */

  const selectedKeys =
    (
      location.state as {
        productIds?: string[];
      } | null
    )?.productIds;

  const initialVoucher =
    (
      location.state as {
        voucher?: string;
      } | null
    )?.voucher ?? '';

  /* ============================================================
     BACK TO CART
  ============================================================ */

  const handleBackToCart = () => {
    const confirmed = window.confirm(
      'Apakah Anda yakin ingin kembali ke keranjang?',
    );

    if (confirmed) {
      navigate('/cart');
    }
  };

  /* ============================================================
     ORDER LINES
  ============================================================ */

  const lines: OrderLine[] = useMemo(() => {
    const source =
      selectedKeys &&
      selectedKeys.length > 0
        ? items.filter((item) => {
            const key = `${item.product.id}:${item.variantId ?? ''}`;

            return selectedKeys.includes(key);
          })
        : items;

    return source.map((item) => ({
      productId: item.product.id,
      name: item.product.name,
      image: item.product.image,
      variant: item.variant
        ? [
            item.variant.color,
            item.variant.size,
          ]
            .filter(Boolean)
            .join(' · ')
        : undefined,
      price:
        item.variant?.price ??
        item.product.price,
      quantity: item.quantity,
    }));
  }, [items, selectedKeys]);

  /* ============================================================
     PAYMENT STATE
  ============================================================ */

  const [address, setAddress] =
    useState<Address | null>(null);

  const [promoInput, setPromoInput] =
    useState(initialVoucher);

  const [promoApplied, setPromoApplied] =
    useState<string | null>(
      initialVoucher || null,
    );

  const [bank, setBank] =
    useState('BCA');

  const [method, setMethod] =
    useState<'VA' | 'EWALLET'>('VA');

  const [copied, setCopied] =
    useState(false);

  const [paid, setPaid] =
    useState(false);

  const [orderId] =
    useState(() => newOrderId());

  /* ============================================================
     ADDRESS
  ============================================================ */

  useEffect(() => {
    api
      .get<Address[]>('/address')
      .then((list) => {
        if (
          Array.isArray(list) &&
          list.length > 0
        ) {
          setAddress(
            list.find(
              (item) => item.isDefault,
            ) ?? list[0],
          );
        }
      })
      .catch(() => {
        setAddress(null);
      });
  }, []);

  /* ============================================================
     TOTALS
  ============================================================ */

  const subtotal = lines.reduce(
    (sum, line) =>
      sum +
      line.price * line.quantity,
    0,
  );

  const discount = promoApplied
    ? Math.round(subtotal * 0.1)
    : 0;

  const total =
    subtotal +
    SHIPPING_COST -
    discount;

  const virtualAccount =
    makeVirtualAccount(orderId);

  /* ============================================================
     COPY VA
  ============================================================ */

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(
        virtualAccount.replace(/\s/g, ''),
      );

      setCopied(true);

      setTimeout(() => {
        setCopied(false);
      }, 2000);
    } catch {
      setCopied(false);
    }
  };

  /* ============================================================
     PAY
  ============================================================ */

  const handlePay = async () => {
    if (lines.length === 0) {
      return;
    }

    const order: Order = {
      id: orderId,
      createdAt:
        new Date().toISOString(),
      status: 'PROSES',
      lines,
      shippingCost:
        SHIPPING_COST,
      discount,
      total,
      paymentMethod:
        method === 'VA'
          ? `VIRTUAL ACCOUNT ${bank}`
          : 'E-WALLET',
      virtualAccount,
    };

    saveOrder(order);
    setPaid(true);

    try {
      await clearCart();
    } catch {
      // Order sudah tersimpan.
      // Clearing cart bersifat best-effort.
    }
  };

  const stepState = paid
    ? 'Terverifikasi'
    : 'Menunggu';

  return (
    <div className="flex min-h-screen flex-col bg-[#F5F5F5]">
      <AnnouncementBar />

      <Navbar />

      <main className="flex-1">
        <div className="mx-auto max-w-[1100px] px-3 py-6 sm:px-6 sm:py-8">

          {/* ========================================================
              BREADCRUMB
          ========================================================= */}

          <nav
            aria-label="Breadcrumb"
            className="mb-4 flex flex-wrap items-center gap-y-1"
          >
            <Link
              to="/"
              className="text-[9px] font-medium uppercase tracking-[0.14em] text-[#999] transition-colors hover:text-[#1A1A1A]"
            >
              BERANDA
            </Link>

            <span
              className="mx-2 text-[9px] text-[#CCC]"
              aria-hidden="true"
            >
              /
            </span>

            <button
              type="button"
              onClick={handleBackToCart}
              className="text-[9px] font-medium uppercase tracking-[0.14em] text-[#999] transition-colors hover:text-[#1A1A1A]"
            >
              KERANJANG
            </button>

            <span
              className="mx-2 text-[9px] text-[#CCC]"
              aria-hidden="true"
            >
              /
            </span>

            <span className="text-[9px] font-medium uppercase tracking-[0.14em] text-[#1A1A1A]">
              PEMBAYARAN
            </span>
          </nav>

          {/* ========================================================
              BACK TO CART
          ========================================================= */}

          <button
            type="button"
            onClick={handleBackToCart}
            className="mb-6 inline-flex items-center gap-2 text-[10px] font-medium uppercase tracking-[0.12em] text-[#8A8A8A] transition-colors hover:text-[#1A1A1A]"
          >
            <ArrowLeft
              size={14}
              strokeWidth={1.5}
            />

            Kembali ke Keranjang
          </button>

          {/* ========================================================
              PAYMENT CONTAINER
          ========================================================= */}

          <div className="bg-[#FDFAF7] px-3 py-7 shadow-[0_1px_3px_rgba(0,0,0,0.04)] sm:px-8 sm:py-10">

            {/* ======================================================
                PROGRESS
            ======================================================= */}

            <ol className="mb-8 flex items-start justify-between gap-2 px-1 sm:px-6">
              {[
                {
                  n: '1.',
                  label: 'ALAMAT PENGIRIMAN',
                  state: 'Selesai',
                  done: true,
                },
                {
                  n: '2.',
                  label: 'KURIR & LOGISTIK',
                  state: 'Selesai',
                  done: true,
                },
                {
                  n: '3.',
                  label: 'PEMBAYARAN',
                  state: stepState,
                  done: paid,
                  current: true,
                },
              ].map(
                (step, index, array) => (
                  <React.Fragment
                    key={step.label}
                  >
                    <li className="flex min-w-0 flex-shrink flex-col items-center text-center">
                      <span
                        className={`mb-2 flex h-5 w-5 items-center justify-center rounded-full sm:h-6 sm:w-6 ${
                          step.current &&
                          !paid
                            ? 'bg-[#C1603C] text-white'
                            : 'bg-[#1A1A1A] text-white'
                        }`}
                      >
                        {step.done ? (
                          <Check
                            size={12}
                            strokeWidth={3}
                          />
                        ) : (
                          <Lock
                            size={10}
                            strokeWidth={2.5}
                          />
                        )}
                      </span>

                      <Serif
                        bold
                        className="text-[8px] uppercase leading-tight tracking-[0.1em] text-[#1A1A1A] sm:text-[10px]"
                      >
                        {step.n}{' '}
                        {step.label}
                      </Serif>

                      <Serif
                        className={`mt-0.5 text-[8px] tracking-[0.08em] sm:text-[9.5px] ${
                          step.current &&
                          !paid
                            ? 'text-[#C1603C]'
                            : 'text-[#7A7A7A]'
                        }`}
                      >
                        {step.state}
                      </Serif>
                    </li>

                    {index <
                      array.length - 1 && (
                      <li
                        aria-hidden
                        className="mt-3 h-px min-w-[16px] flex-1 bg-[#1A1A1A]"
                      />
                    )}
                  </React.Fragment>
                ),
              )}
            </ol>

            {/* ======================================================
                ADDRESS
            ======================================================= */}

            <section className="mb-6 bg-[#EFEEEA] p-4 sm:p-7">
              <header className="mb-4 flex items-center justify-between gap-3 sm:mb-6">
                <div className="flex min-w-0 items-center gap-2.5">
                  <MapPin
                    size={16}
                    strokeWidth={1.75}
                    className="shrink-0 text-[#1A1A1A]"
                  />

                  <Serif className="text-[14px] uppercase tracking-[0.06em] text-[#1A1A1A] sm:text-[19px]">
                    ALAMAT PENGIRIMAN
                  </Serif>
                </div>

                <Link
                  to="/profile/address"
                  className="flex shrink-0 items-center gap-1.5 text-[#1A1A1A] transition-colors hover:text-[#5A5A5A]"
                >
                  <Pencil
                    size={11}
                    strokeWidth={1.75}
                  />

                  <Serif
                    bold
                    className="text-[9px] uppercase tracking-[0.1em] underline underline-offset-2 sm:text-[11px]"
                  >
                    UBAH ALAMAT
                  </Serif>
                </Link>
              </header>

              <div className="bg-[#D9D9D9] p-4 sm:p-5">
                <div className="mb-2 flex flex-wrap items-center gap-2.5">
                  <span className="text-[11px] font-bold text-[#1A1A1A] sm:text-[12px]">
                    {address?.recipientName ??
                      user?.name ??
                      'Penerima'}
                  </span>

                  <span className="bg-[#C9C9C9] px-2 py-0.5 text-[8.5px] font-bold uppercase tracking-[0.12em] text-[#3A3A3A] sm:text-[9.5px]">
                    {address?.label ??
                      'UTAMA'}
                  </span>
                </div>

                <p className="text-[10.5px] leading-relaxed text-[#3A3A3A] sm:text-[11.5px]">
                  {address
                    ? `${address.addressLine}, ${address.city}, ${address.province} ${address.postalCode}`
                    : 'Alamat pengiriman belum diatur. Tambahkan alamat untuk melanjutkan.'}
                </p>

                <p className="mt-1 text-[10.5px] text-[#5A5A5A] sm:text-[11.5px]">
                  {address?.phone ??
                    user?.phone ??
                    '—'}
                </p>
              </div>
            </section>

            {/* ======================================================
                SHIPPING METHOD
            ======================================================= */}

            <section className="mb-6 bg-[#EFEEEA] p-4 sm:p-7">
              <header className="mb-4 flex items-center justify-between gap-3 sm:mb-6">
                <div className="flex min-w-0 items-center gap-2.5">
                  <Truck
                    size={16}
                    strokeWidth={1.75}
                    className="shrink-0 text-[#1A1A1A]"
                  />

                  <Serif className="text-[13px] uppercase tracking-[0.06em] text-[#1A1A1A] sm:text-[18px]">
                    METODE PENGIRIMAN TERPILIH
                  </Serif>
                </div>

                <Serif
                  bold
                  className="shrink-0 text-[9px] uppercase tracking-[0.1em] text-[#1A1A1A] underline underline-offset-2 sm:text-[11px]"
                >
                  KONFIRMASI PENGIRIMAN
                </Serif>
              </header>

              <div className="flex items-center gap-3 bg-[#D9D9D9] p-3 sm:gap-4 sm:p-4">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center bg-[#1A1A1A] sm:h-9 sm:w-9">
                  <Zap
                    size={15}
                    strokeWidth={2}
                    className="text-white"
                    fill="currentColor"
                  />
                </span>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[11px] font-bold text-[#1A1A1A] sm:text-[12.5px]">
                      Paxel Next Day Delivery
                    </span>

                    <span className="bg-[#E8916B] px-2 py-0.5 text-[8px] font-bold uppercase tracking-[0.1em] text-white sm:text-[9px]">
                      GARANSI TEPAT WAKTU
                    </span>
                  </div>

                  <p className="mt-1 text-[9.5px] text-[#4A4A4A] sm:text-[10.5px]">
                    Estimasi Tiba Besok
                    (1x24 Jam) · Termasuk
                    proteksi asuransi tanpa
                    garmen
                  </p>
                </div>

                <Serif
                  bold
                  className="shrink-0 whitespace-nowrap text-[12px] text-[#1A1A1A] sm:text-[15px]"
                >
                  RP.{' '}
                  {new Intl.NumberFormat(
                    'id-ID',
                  ).format(
                    SHIPPING_COST,
                  )}
                </Serif>
              </div>
            </section>

            {/* ======================================================
                ORDER SUMMARY
            ======================================================= */}

            <section className="mb-6 bg-[#EFEEEA] p-4 sm:p-7">
              <Serif className="mb-5 block text-[14px] uppercase leading-tight tracking-[0.06em] text-[#1A1A1A] sm:mb-6 sm:text-[18px]">
                RINGKASAN
                <br />
                PESANAN
              </Serif>

              <div className="grid grid-cols-1 gap-5 lg:grid-cols-2 lg:gap-8">

                {/* LINE ITEMS */}

                <div className="space-y-2.5">
                  {lines.length ===
                  0 ? (
                    <div className="bg-[#F7F6F3] p-6 text-center">
                      <p className="text-[12px] text-[#6A6A6A]">
                        Tidak ada item
                        untuk dibayar.
                      </p>

                      <button
                        type="button"
                        onClick={
                          handleBackToCart
                        }
                        className="mt-3 text-[10.5px] uppercase tracking-[0.12em] text-[#1A1A1A] underline underline-offset-4"
                      >
                        Kembali ke
                        Keranjang
                      </button>
                    </div>
                  ) : (
                    lines.map(
                      (line) => (
                        <div
                          key={`${line.productId}-${line.variant ?? ''}`}
                          className="flex gap-3 bg-[#F7F6F3] p-2.5"
                        >
                          <div className="h-[62px] w-[52px] shrink-0 overflow-hidden bg-[#ECEAE4] sm:h-[70px] sm:w-[58px]">
                            <img
                              src={resolveImageUrl(
                                line.image,
                                58,
                                70,
                                line.name,
                              )}
                              alt={
                                line.name
                              }
                              className="h-full w-full object-cover"
                            />
                          </div>

                          <div className="flex min-w-0 flex-1 flex-col justify-between py-0.5">
                            <div className="min-w-0">
                              <Serif
                                bold
                                className="block break-words text-[10px] uppercase leading-snug tracking-[0.04em] text-[#1A1A1A] sm:text-[11.5px]"
                              >
                                {
                                  line.name
                                }
                              </Serif>

                              {line.variant && (
                                <span className="mt-0.5 block text-[8px] uppercase tracking-[0.1em] text-[#7A7A7A] sm:text-[8.5px]">
                                  {
                                    line.variant
                                  }
                                </span>
                              )}
                            </div>

                            <div className="mt-1.5 flex items-end justify-between gap-2">
                              <span className="text-[8.5px] uppercase tracking-[0.08em] text-[#7A7A7A] sm:text-[9.5px]">
                                Kuantitas:{' '}
                                {
                                  line.quantity
                                }
                              </span>

                              <Serif className="whitespace-nowrap text-[10px] text-[#1A1A1A] sm:text-[11.5px]">
                                Rp{' '}
                                {new Intl.NumberFormat(
                                  'id-ID',
                                ).format(
                                  line.price *
                                    line.quantity,
                                )}
                              </Serif>
                            </div>
                          </div>
                        </div>
                      ),
                    )
                  )}
                </div>

                {/* PROMO + TOTAL */}

                <div>
                  <Serif
                    bold
                    className="mb-1.5 block text-[8.5px] uppercase tracking-[0.14em] text-[#5A5A5A] sm:text-[9.5px]"
                  >
                    KODE PROMO &
                    MEMBER
                  </Serif>

                  <div className="flex">
                    <input
                      value={
                        promoInput
                      }
                      onChange={(
                        event,
                      ) =>
                        setPromoInput(
                          event.target.value.toUpperCase(),
                        )
                      }
                      placeholder="ATELIERVIP"
                      className="min-w-0 flex-1 border border-[#E0DED8] bg-white px-3 py-2.5 text-[10px] uppercase tracking-[0.1em] text-[#1A1A1A] outline-none placeholder:text-[#B0B0B0] transition-colors focus:border-[#1A1A1A] sm:text-[11px]"
                    />

                    <button
                      type="button"
                      onClick={() => {
                        const value =
                          promoInput.trim();

                        if (value) {
                          setPromoApplied(
                            value,
                          );
                        }
                      }}
                      className="shrink-0 bg-[#1A1A1A] px-4 text-[9px] uppercase tracking-[0.12em] text-white transition-colors hover:bg-[#333] sm:px-6 sm:text-[10px]"
                      style={{
                        fontFamily: SERIF,
                        fontWeight: 700,
                      }}
                    >
                      TERAPKAN
                    </button>
                  </div>

                  {promoApplied && (
                    <div className="mt-2 flex items-center gap-2 bg-[#FBD9D3] px-3 py-2">
                      <Check
                        size={12}
                        strokeWidth={2.5}
                        className="shrink-0 text-[#C1603C]"
                      />

                      <span className="flex-1 truncate text-[9px] uppercase tracking-[0.06em] text-[#8C3A1E] sm:text-[10px]">
                        {
                          promoApplied
                        }{' '}
                        berhasil
                        diterapkan
                      </span>

                      <button
                        type="button"
                        onClick={() => {
                          setPromoApplied(
                            null,
                          );
                          setPromoInput('');
                        }}
                        aria-label="Hapus kode promo"
                        className="shrink-0 text-[#8C3A1E] hover:text-[#5A1F0A]"
                      >
                        <X
                          size={12}
                          strokeWidth={2.5}
                        />
                      </button>
                    </div>
                  )}

                  <dl className="mt-5 space-y-2.5">
                    <div className="flex justify-between gap-3 text-[10px] sm:text-[11px]">
                      <dt
                        className="text-[#3A3A3A]"
                        style={{
                          fontFamily: SERIF,
                        }}
                      >
                        Subtotal Produk
                      </dt>

                      <dd
                        className="whitespace-nowrap text-[#1A1A1A]"
                        style={{
                          fontFamily: SERIF,
                        }}
                      >
                        Rp{' '}
                        {new Intl.NumberFormat(
                          'id-ID',
                        ).format(
                          subtotal,
                        )}
                      </dd>
                    </div>

                    <div className="flex justify-between gap-3 text-[10px] sm:text-[11px]">
                      <dt
                        className="text-[#3A3A3A]"
                        style={{
                          fontFamily: SERIF,
                        }}
                      >
                        Ongkos Kirim Paxel
                        Next Day
                      </dt>

                      <dd
                        className="whitespace-nowrap text-[#1A1A1A]"
                        style={{
                          fontFamily: SERIF,
                        }}
                      >
                        Rp{' '}
                        {new Intl.NumberFormat(
                          'id-ID',
                        ).format(
                          SHIPPING_COST,
                        )}
                      </dd>
                    </div>

                    {discount > 0 && (
                      <div className="flex justify-between gap-3 text-[10px] text-[#C1603C] sm:text-[11px]">
                        <dt
                          style={{
                            fontFamily: SERIF,
                          }}
                        >
                          Diskon Member
                          Prive
                          <br />
                          <span className="text-[8.5px] tracking-[0.1em]">
                            ({promoApplied})
                          </span>
                        </dt>

                        <dd
                          className="whitespace-nowrap"
                          style={{
                            fontFamily: SERIF,
                          }}
                        >
                          – Rp{' '}
                          {new Intl.NumberFormat(
                            'id-ID',
                          ).format(
                            discount,
                          )}
                        </dd>
                      </div>
                    )}

                    <div className="flex justify-between gap-3 text-[10px] sm:text-[11px]">
                      <dt
                        className="text-[#3A3A3A]"
                        style={{
                          fontFamily: SERIF,
                        }}
                      >
                        Biaya Layanan
                        &amp; Asuransi
                      </dt>

                      <dd
                        className="whitespace-nowrap text-[#1A1A1A]"
                        style={{
                          fontFamily: SERIF,
                        }}
                      >
                        GRATIS
                      </dd>
                    </div>
                  </dl>

                  <button
                    type="button"
                    onClick={handlePay}
                    disabled={
                      lines.length === 0 ||
                      paid
                    }
                    className="mt-4 flex w-full items-center justify-between gap-3 bg-[#0A0A0A] px-4 py-4 text-white transition-colors hover:bg-[#242424] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <Serif
                      bold
                      className="text-left text-[11px] uppercase leading-tight tracking-[0.06em] sm:text-[14px]"
                    >
                      {paid ? (
                        'PEMBAYARAN DIBUAT'
                      ) : (
                        <>
                          BAYAR
                          <br />
                          SEKARANG
                        </>
                      )}
                    </Serif>

                    <ArrowRight
                      size={14}
                      strokeWidth={1.75}
                      className="shrink-0 opacity-70"
                    />

                    <Serif
                      bold
                      className="whitespace-nowrap text-right text-[11px] leading-tight tracking-[0.04em] sm:text-[14px]"
                    >
                      RP
                      <br />
                      {new Intl.NumberFormat(
                        'id-ID',
                      ).format(
                        total,
                      )}
                    </Serif>
                  </button>
                </div>
              </div>
            </section>

            {/* ======================================================
                PAYMENT METHOD
            ======================================================= */}

            <section className="mb-6 bg-[#EFEEEA] p-4 sm:p-7">
              <header className="mb-4 flex items-center gap-2 sm:mb-5">
                <Lock
                  size={13}
                  strokeWidth={2}
                  className="shrink-0 text-[#1A1A1A]"
                />

                <Serif
                  bold
                  className="text-[9.5px] uppercase tracking-[0.14em] text-[#1A1A1A] sm:text-[11px]"
                >
                  METODE PEMBAYARAN
                  TERENKRIPSI
                </Serif>
              </header>

              {/* METHOD TABS */}

              <div
                className="inline-flex"
                role="tablist"
                aria-label="Metode pembayaran"
              >
                {(
                  [
                    {
                      key: 'VA',
                      label: 'VIRTUAL ACCOUNT',
                    },
                    {
                      key: 'EWALLET',
                      label: 'E-WALLET',
                    },
                  ] as const
                ).map((paymentMethod) => (
                  <button
                    key={
                      paymentMethod.key
                    }
                    type="button"
                    role="tab"
                    aria-selected={
                      method ===
                      paymentMethod.key
                    }
                    onClick={() =>
                      setMethod(
                        paymentMethod.key,
                      )
                    }
                    className={`px-4 py-2.5 text-[8.5px] uppercase tracking-[0.12em] transition-colors sm:px-8 sm:py-3 sm:text-[10px] ${
                      method ===
                      paymentMethod.key
                        ? 'bg-[#0A0A0A] text-white'
                        : 'bg-[#D9D9D9] text-[#3A3A3A] hover:bg-[#CFCFCF]'
                    }`}
                    style={{
                      fontFamily: SERIF,
                      fontWeight: 700,
                    }}
                  >
                    {
                      paymentMethod.label
                    }
                  </button>
                ))}
              </div>

              {method ===
              'VA' ? (
                <>
                  {/* BANK */}

                  <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-2 bg-[#D9D9D9] px-3 py-2.5 sm:px-4">
                    <span className="text-[8px] uppercase tracking-[0.14em] text-[#5A5A5A] sm:text-[9px]">
                      PILIH BANK:
                    </span>

                    {BANKS.map(
                      (bankName) => (
                        <button
                          key={
                            bankName
                          }
                          type="button"
                          onClick={() =>
                            setBank(
                              bankName,
                            )
                          }
                          className={`px-2.5 py-1 text-[8.5px] uppercase tracking-[0.1em] transition-colors sm:text-[10px] ${
                            bank ===
                            bankName
                              ? 'bg-white text-[#1A1A1A]'
                              : 'text-[#5A5A5A] hover:text-[#1A1A1A]'
                          }`}
                          style={{
                            fontFamily:
                              SERIF,
                            fontWeight: 700,
                          }}
                        >
                          {bankName}
                        </button>
                      ),
                    )}

                    <span className="ml-auto flex items-center gap-1.5 text-[8px] uppercase tracking-[0.06em] text-[#C1603C] sm:text-[9px]">
                      <AlertCircle
                        size={10}
                        strokeWidth={2}
                        className="shrink-0"
                      />

                      Bayar sebelum
                      23 jam 59 menit
                    </span>
                  </div>

                  {/* VA NUMBER */}

                  <div className="mt-5 flex flex-wrap items-end justify-between gap-4 px-1 sm:mt-7 sm:px-4">
                    <div className="min-w-0">
                      <Serif className="mb-1.5 block text-[8px] uppercase tracking-[0.16em] text-[#6A6A6A] sm:text-[9px]">
                        NOMOR VIRTUAL
                        ACCOUNT{' '}
                        {bank}
                      </Serif>

                      <Serif
                        bold
                        className="block break-all text-[22px] leading-none tracking-[0.02em] text-[#0A0A0A] sm:text-[36px]"
                      >
                        {
                          virtualAccount
                        }
                      </Serif>

                      <p className="mt-2 text-[9px] text-[#4A4A4A] sm:text-[10.5px]">
                        Atas Nama:{' '}
                        <strong className="font-bold">
                          ATELIER COUTURE
                          INDONESIA
                        </strong>
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={
                        handleCopy
                      }
                      className="flex shrink-0 items-center gap-2 bg-[#0A0A0A] px-4 py-3 text-white transition-colors hover:bg-[#242424] sm:px-6"
                      style={{
                        fontFamily: SERIF,
                        fontWeight: 700,
                      }}
                    >
                      {copied ? (
                        <Check
                          size={12}
                          strokeWidth={
                            2.5
                          }
                        />
                      ) : (
                        <Copy
                          size={12}
                          strokeWidth={2}
                        />
                      )}

                      <span className="text-[8.5px] uppercase tracking-[0.12em] sm:text-[10px]">
                        {copied
                          ? 'TERSALIN'
                          : 'SALIN KODE'}
                      </span>
                    </button>
                  </div>

                  {/* INSTRUCTIONS */}

                  <div className="mt-5 grid grid-cols-1 gap-3 sm:mt-7 sm:grid-cols-3 sm:gap-4">
                    {VA_INSTRUCTIONS.map(
                      (column) => (
                        <div
                          key={
                            column.title
                          }
                          className="bg-[#D9D9D9] p-3 sm:p-4"
                        >
                          <Serif
                            bold
                            className="mb-2 block text-[8px] uppercase tracking-[0.12em] text-[#1A1A1A] sm:text-[9px]"
                          >
                            {
                              column.title
                            }
                          </Serif>

                          <ul className="space-y-0.5">
                            {column.steps.map(
                              (
                                step,
                              ) => (
                                <li
                                  key={
                                    step
                                  }
                                  className="text-[8.5px] leading-relaxed text-[#3A3A3A] sm:text-[10px]"
                                >
                                  {
                                    step
                                  }
                                </li>
                              ),
                            )}
                          </ul>
                        </div>
                      ),
                    )}
                  </div>
                </>
              ) : (
                <div className="mt-4 bg-[#D9D9D9] p-6 text-center sm:p-8">
                  <Serif className="mb-1.5 block text-[12px] text-[#1A1A1A] sm:text-[14px]">
                    Pembayaran E-Wallet
                  </Serif>

                  <p className="text-[10px] text-[#4A4A4A] sm:text-[11px]">
                    Pilih Virtual
                    Account untuk
                    menyelesaikan
                    pembayaran saat
                    ini.
                  </p>
                </div>
              )}
            </section>

            {/* ======================================================
                RECEIPT
            ======================================================= */}

            <div className="flex justify-end pt-1">
              <button
                type="button"
                onClick={() =>
                  window.print()
                }
                disabled={!paid}
                title={
                  paid
                    ? undefined
                    : 'Selesaikan pembayaran untuk mencetak bukti'
                }
                className="flex items-center gap-2.5 rounded-[6px] bg-[#0A0A0A] px-6 py-3.5 text-white transition-colors hover:bg-[#242424] disabled:cursor-not-allowed disabled:opacity-45 sm:px-10 sm:py-4"
                style={{
                  fontFamily: SERIF,
                  fontWeight: 700,
                }}
              >
                <Printer
                  size={14}
                  strokeWidth={1.75}
                  className="shrink-0"
                />

                <span className="text-[10px] uppercase tracking-[0.1em] sm:text-[13px]">
                  CETAK BUKTI PEMBAYARAN
                </span>
              </button>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Payment;