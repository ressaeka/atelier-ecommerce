import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, MapPin, Package, ChevronRight } from 'lucide-react';

import AnnouncementBar from '../components/AnnouncementBar';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import {
  Serif,
  SERIF,
} from '../components/CommerceUI';

import { useAuth } from '../contexts/AuthContext';
import { resolveImageUrl } from '../lib/utils';
import { getOrderById, cancelOrder } from '../lib/orderApi';
import type { Order, OrderItem } from '../types/api';

/* =========================================================
   STATUS
========================================================= */

const STATUS_META: Record<
  string,
  {
    bg: string;
    text: string;
    dot: string;
    label: string;
  }
> = {
  PENDING: {
    bg: 'bg-[#F8F0D9]',
    text: 'text-[#9A7B42]',
    dot: 'bg-[#BB974F]',
    label: 'MENUNGGU PEMBAYARAN',
  },

  PAID: {
    bg: 'bg-[#E8EFF5]',
    text: 'text-[#557A9B]',
    dot: 'bg-[#6D98BC]',
    label: 'DIBAYAR',
  },

  PROCESSING: {
    bg: 'bg-[#E8EFF5]',
    text: 'text-[#557A9B]',
    dot: 'bg-[#6D98BC]',
    label: 'DIPROSES',
  },

  SHIPPED: {
    bg: 'bg-[#F7EDE0]',
    text: 'text-[#9A713D]',
    dot: 'bg-[#B9894A]',
    label: 'DIKIRIM',
  },

  DELIVERED: {
    bg: 'bg-[#E8F1EA]',
    text: 'text-[#4F805E]',
    dot: 'bg-[#61966E]',
    label: 'SELESAI',
  },

  CANCELLED: {
    bg: 'bg-[#F3E5E5]',
    text: 'text-[#9A5959]',
    dot: 'bg-[#B66C6C]',
    label: 'DIBATALKAN',
  },

  EXPIRED: {
    bg: 'bg-[#EEEEEE]',
    text: 'text-[#6A6A6A]',
    dot: 'bg-[#9A9A9A]',
    label: 'KEDALUARSA',
  },
};

/* =========================================================
   HELPERS
========================================================= */

const formatRp = (value: number) =>
  `Rp${new Intl.NumberFormat('id-ID').format(value)}`;

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

/* =========================================================
   ORDER DETAIL
========================================================= */

const OrderDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();

  const {
    user,
    loading: authLoading,
  } = useAuth();

  const [order, setOrder] = useState<Order | null>(null);
  const [orderLoading, setOrderLoading] = useState(false);
  const [orderError, setOrderError] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  const handleCancelOrder = async () => {
    if (!order || order.status !== 'PENDING' || cancelling) return;

    setCancelling(true);
    setFeedbackMessage(null);

    try {
      const updatedOrder = await cancelOrder(order.id);
      setOrder(updatedOrder);
      setShowCancelModal(false);
      setFeedbackMessage({
        type: 'success',
        text: `Pesanan #${order.id} berhasil dibatalkan.`,
      });
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : 'Gagal membatalkan pesanan. Silakan coba lagi.';
      setFeedbackMessage({
        type: 'error',
        text: message,
      });
    } finally {
      setCancelling(false);
    }
  };

  useEffect(() => {
    if (!user || !id) return;

    const numericId = Number(id);

    if (isNaN(numericId)) {
      setNotFound(true);
      return;
    }

    setOrderLoading(true);
    setOrderError(null);
    setNotFound(false);

    getOrderById(numericId)
      .then((data) => {
        setOrder(data);
      })
      .catch((err: unknown) => {
        const message =
          err instanceof Error ? err.message : 'Terjadi kesalahan.';

        if (
          message.toLowerCase().includes('tidak ditemukan') ||
          message.includes('404')
        ) {
          setNotFound(true);
        } else {
          setOrderError(message);
        }
      })
      .finally(() => {
        setOrderLoading(false);
      });
  }, [user, id]);

  /* =======================================================
     GUEST
  ======================================================== */

  if (!authLoading && !user) {
    return (
      <div className="flex min-h-screen flex-col bg-[#F5F5F2]">
        <AnnouncementBar />
        <Navbar />

        <main className="flex flex-1 items-center justify-center px-6 py-24">
          <div className="w-full max-w-[420px] text-center">
            <Package
              size={42}
              strokeWidth={1}
              className="mx-auto mb-5 text-[#CFCAC1]"
            />

            <Serif
              as="h1"
              className="mb-3 text-[28px] text-[#1A1A1A]"
            >
              Pesanan Anda
            </Serif>

            <p className="mb-7 text-[13px] leading-[1.7] text-[#777]">
              Masuk untuk melihat riwayat
              pesanan Anda.
            </p>

            <div className="flex justify-center gap-3">
              <Link
                to="/login"
                className="bg-[#1A1A1A] px-8 py-3.5 text-[10px] font-medium uppercase tracking-[0.16em] text-white transition-colors hover:bg-[#333]"
              >
                MASUK
              </Link>

              <Link
                to="/register"
                className="border border-[#1A1A1A] px-8 py-3.5 text-[10px] font-medium uppercase tracking-[0.16em] text-[#1A1A1A] transition-colors hover:bg-[#1A1A1A] hover:text-white"
              >
                DAFTAR
              </Link>
            </div>
          </div>
        </main>

        <Footer />
      </div>
    );
  }

  /* =======================================================
     LOADING
  ======================================================== */

  if (authLoading || orderLoading) {
    return (
      <div className="flex min-h-screen flex-col bg-[#F5F5F2]">
        <AnnouncementBar />
        <Navbar />

        <main className="flex-1">
          <div className="mx-auto max-w-[1180px] px-4 py-8 sm:px-6 lg:px-8">

            <div className="mb-6 h-4 w-[130px] animate-pulse bg-[#D9D9D9]" />

            <div className="mb-6 h-[105px] animate-pulse bg-[#FAF9F5]" />

            <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
              <div className="space-y-4">
                {Array.from({ length: 2 }).map((_, i) => (
                  <div
                    key={i}
                    className="flex gap-5 bg-[#FAF9F5] p-5"
                  >
                    <div className="h-[115px] w-[90px] shrink-0 animate-pulse bg-[#D9D9D9]" />

                    <div className="flex flex-1 flex-col justify-between py-1">
                      <div className="space-y-3">
                        <div className="h-4 w-[65%] animate-pulse bg-[#D9D9D9]" />
                        <div className="h-3 w-[35%] animate-pulse bg-[#D9D9D9]" />
                      </div>

                      <div className="h-3 w-[120px] animate-pulse bg-[#D9D9D9]" />
                    </div>
                  </div>
                ))}
              </div>

              <div className="h-[320px] animate-pulse bg-[#FAF9F5]" />
            </div>
          </div>
        </main>

        <Footer />
      </div>
    );
  }

  /* =======================================================
     ERROR
  ======================================================== */

  if (orderError) {
    return (
      <div className="flex min-h-screen flex-col bg-[#F5F5F2]">
        <AnnouncementBar />
        <Navbar />

        <main className="flex flex-1 items-center justify-center px-6 py-24">
          <div className="w-full max-w-[420px] text-center">
            <Package
              size={42}
              strokeWidth={1}
              className="mx-auto mb-5 text-[#CFCAC1]"
            />

            <Serif
              as="h1"
              className="mb-3 text-[28px] text-[#1A1A1A]"
            >
              Terjadi Kesalahan
            </Serif>

            <p className="mb-7 text-[13px] text-[#777]">
              {orderError}
            </p>

            <Link
              to="/orders"
              className="inline-flex items-center gap-2 bg-[#1A1A1A] px-8 py-3.5 text-[10px] font-medium uppercase tracking-[0.16em] text-white transition-colors hover:bg-[#333]"
            >
              KEMBALI KE PESANAN
            </Link>
          </div>
        </main>

        <Footer />
      </div>
    );
  }

  /* =======================================================
     NOT FOUND
  ======================================================== */

  if (notFound || (!orderLoading && !order)) {
    return (
      <div className="flex min-h-screen flex-col bg-[#F5F5F2]">
        <AnnouncementBar />
        <Navbar />

        <main className="flex flex-1 items-center justify-center px-6 py-24">
          <div className="w-full max-w-[420px] text-center">
            <Package
              size={42}
              strokeWidth={1}
              className="mx-auto mb-5 text-[#CFCAC1]"
            />

            <Serif
              as="h1"
              className="mb-3 text-[28px] text-[#1A1A1A]"
            >
              Pesanan Tidak Ditemukan
            </Serif>

            <p className="mb-7 text-[13px] text-[#777]">
              Pesanan yang Anda cari tidak tersedia atau bukan milik akun ini.
            </p>

            <Link
              to="/orders"
              className="inline-flex items-center gap-2 bg-[#1A1A1A] px-8 py-3.5 text-[10px] font-medium uppercase tracking-[0.16em] text-white transition-colors hover:bg-[#333]"
            >
              KEMBALI KE PESANAN
            </Link>
          </div>
        </main>

        <Footer />
      </div>
    );
  }

  if (!order) return null;

  const statusMeta = STATUS_META[order.status];

  return (
    <div className="flex min-h-screen flex-col bg-[#F5F5F2]">
      <AnnouncementBar />
      <Navbar />

      <main className="flex-1">

        <div className="mx-auto max-w-[1180px] px-4 py-6 sm:px-6 sm:py-8 lg:px-8">

          {/* =====================================================
              BACK + BREADCRUMB
          ====================================================== */}

          <div className="mb-5 flex items-center justify-between">
            <Link
              to="/orders"
              className="inline-flex items-center gap-2 text-[10px] font-medium uppercase tracking-[0.12em] text-[#777] transition-colors hover:text-[#1A1A1A]"
            >
              <ArrowLeft
                size={14}
                strokeWidth={1.5}
              />
              Kembali ke Pesanan
            </Link>

            <span className="hidden text-[10px] text-[#999] sm:block">
              Pesanan #{order.id}
            </span>
          </div>

          {/* FEEDBACK TOAST / BANNER */}
          {feedbackMessage && (
            <div
              className={`mb-5 flex items-center justify-between border px-4 py-3 text-[11px] ${
                feedbackMessage.type === 'success'
                  ? 'border-[#CDE3D1] bg-[#F0F7F2] text-[#3D7048]'
                  : 'border-[#F0C9C9] bg-[#FDF2F2] text-[#A33]'
              }`}
            >
              <span>{feedbackMessage.text}</span>
              <button
                type="button"
                onClick={() => setFeedbackMessage(null)}
                className="ml-3 text-[10px] font-bold uppercase tracking-wider hover:opacity-70"
              >
                ✕
              </button>
            </div>
          )}

          {/* =====================================================
              ORDER HEADER
          ====================================================== */}

          <section className="mb-5 border border-[#E3E0D9] bg-[#FAF9F5]">

            <div className="flex flex-col gap-5 px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-7 sm:py-6">

              <div>
                <p className="mb-2 text-[9px] font-medium uppercase tracking-[0.2em] text-[#999]">
                  DETAIL PESANAN
                </p>

                <div className="flex items-baseline gap-3">
                  <Serif
                    as="h1"
                    className="text-[28px] leading-none text-[#1A1A1A] sm:text-[34px]"
                  >
                    #{order.id}
                  </Serif>

                  <span className="text-[10px] text-[#999]">
                    {formatDate(order.createdAt)}
                  </span>
                </div>
              </div>

              {statusMeta && (
                <div
                  className={`inline-flex w-fit items-center gap-2 px-3.5 py-2.5 text-[9px] font-semibold uppercase tracking-[0.14em] ${statusMeta.bg} ${statusMeta.text}`}
                >
                  <span
                    className={`h-1.5 w-1.5 rounded-full ${statusMeta.dot}`}
                  />

                  {statusMeta.label}
                </div>
              )}
            </div>

            {/* SIMPLE STATUS PROGRESS */}
            <OrderProgress status={order.status} />
          </section>

          {/* =====================================================
              MAIN GRID
          ====================================================== */}

          <div className="grid grid-cols-1 items-start gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">

            {/* ===================================================
                LEFT
            ==================================================== */}

            <div className="space-y-5">

              {/* ITEMS */}
              <section className="border border-[#E3E0D9] bg-[#FAF9F5]">

                <div className="flex items-center justify-between border-b border-[#E3E0D9] px-5 py-4 sm:px-6">
                  <div>
                    <p className="text-[9px] font-semibold uppercase tracking-[0.18em] text-[#888]">
                      PRODUK
                    </p>

                    <p className="mt-1 text-[11px] text-[#999]">
                      {order.items.length} item dalam pesanan
                    </p>
                  </div>
                </div>

                <div className="px-5 sm:px-6">
                  {order.items.map((item) => (
                    <OrderItemRow
                      key={item.id}
                      item={item}
                    />
                  ))}
                </div>
              </section>

              {/* ADDRESS */}
              <section className="border border-[#E3E0D9] bg-[#FAF9F5]">

                <div className="border-b border-[#E3E0D9] px-5 py-4 sm:px-6">
                  <p className="text-[9px] font-semibold uppercase tracking-[0.18em] text-[#888]">
                    ALAMAT PENGIRIMAN
                  </p>
                </div>

                <div className="flex gap-4 px-5 py-5 sm:px-6">

                  <div className="flex h-8 w-8 shrink-0 items-center justify-center bg-[#F1EFE9]">
                    <MapPin
                      size={15}
                      strokeWidth={1.4}
                      className="text-[#777]"
                    />
                  </div>

                  <div>
                    <Serif
                      bold
                      className="text-[14px] text-[#1A1A1A]"
                    >
                      {order.recipientName}
                    </Serif>

                    <p className="mt-1.5 text-[11px] leading-[1.7] text-[#555]">
                      {order.addressLine}
                      <br />
                      {order.city}, {order.province} {order.postalCode}
                    </p>

                    <p className="mt-2 text-[10px] text-[#999]">
                      {order.phone}
                    </p>
                  </div>
                </div>
              </section>
            </div>

            {/* ===================================================
                RIGHT
            ==================================================== */}

            <aside className="space-y-5 lg:sticky lg:top-24">

              {/* SUMMARY */}
              <section className="border border-[#E3E0D9] bg-[#FAF9F5]">

                <div className="border-b border-[#E3E0D9] px-5 py-4">
                  <p className="text-[9px] font-semibold uppercase tracking-[0.18em] text-[#888]">
                    RINGKASAN PESANAN
                  </p>
                </div>

                <div className="px-5 py-5">

                  <div className="space-y-4">
                    <SummaryRow
                      label="Subtotal"
                      value={order.subtotal}
                    />

                    <SummaryRow
                      label="Ongkos Kirim"
                      value={order.shippingFee}
                    />
                  </div>

                  <div className="my-5 border-t border-[#E3E0D9]" />

                  <div className="flex items-end justify-between gap-4">
                    <div>
                      <p className="text-[9px] font-semibold uppercase tracking-[0.14em] text-[#777]">
                        TOTAL
                      </p>

                      <p className="mt-1 text-[9px] text-[#AAA]">
                        Sudah termasuk seluruh biaya
                      </p>
                    </div>

                    <Serif
                      bold
                      className="text-[21px] text-[#1A1A1A]"
                    >
                      {formatRp(order.total)}
                    </Serif>
                  </div>
                </div>
              </section>

              {/* STATUS PENDING CARD */}
              {order.status === 'PENDING' && (
                <section className="border border-[#DCCFAF] bg-[#FBF7EA]">
                  <div className="px-5 py-5">
                    <div className="mb-4 flex items-start gap-3">
                      <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center bg-[#F0E6C9]">
                        <span className="h-2 w-2 rounded-full bg-[#BB974F]" />
                      </div>

                      <div>
                        <p className="text-[9px] font-semibold uppercase tracking-[0.16em] text-[#9A7B42]">
                          MENUNGGU PEMBAYARAN
                        </p>

                        <Serif
                          bold
                          className="mt-1.5 text-[15px] leading-[1.35] text-[#1A1A1A]"
                        >
                          Pesanan #{order.id} telah berhasil dibuat dan tersimpan.
                        </Serif>
                      </div>
                    </div>

                    <button
                      type="button"
                      disabled
                      aria-disabled="true"
                      className="mt-2 flex w-full cursor-not-allowed items-center justify-center bg-[#1A1A1A] px-4 py-3.5 text-[9px] font-medium uppercase tracking-[0.16em] text-white opacity-40"
                    >
                      BAYAR SEKARANG
                    </button>

                    <div className="mt-3 space-y-1 text-center text-[10px] leading-[1.6] text-[#7A6B48]">
                      <p>Pembayaran online belum tersedia saat ini.</p>
                      <p className="text-[9px] text-[#9A8F78]">
                        Integrasi payment gateway akan tersedia pada tahap berikutnya.
                      </p>
                    </div>

                    <div className="mt-5 border-t border-[#E8DEC2] pt-4">
                      <button
                        type="button"
                        onClick={() => setShowCancelModal(true)}
                        disabled={cancelling}
                        className="flex w-full items-center justify-center border border-[#C54E4E] bg-transparent px-4 py-3 text-[9px] font-medium uppercase tracking-[0.16em] text-[#C54E4E] transition-colors hover:bg-[#C54E4E] hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        BATALKAN PESANAN
                      </button>
                    </div>
                  </div>
                </section>
              )}

              {/* STATUS PAID CARD */}
              {order.status === 'PAID' && (
                <section className="border border-[#CCD8E2] bg-[#F3F7FA]">
                  <div className="px-5 py-5">
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center bg-[#E1ECF4]">
                        <span className="h-2 w-2 rounded-full bg-[#557A9B]" />
                      </div>

                      <div>
                        <p className="text-[9px] font-semibold uppercase tracking-[0.16em] text-[#557A9B]">
                          PEMBAYARAN BERHASIL
                        </p>

                        <p className="mt-1.5 text-[11px] leading-[1.6] text-[#446682]">
                          Pembayaran untuk pesanan #{order.id} telah dikonfirmasi.
                        </p>
                      </div>
                    </div>
                  </div>
                </section>
              )}

              {/* STATUS CANCELLED CARD */}
              {order.status === 'CANCELLED' && (
                <section className="border border-[#E4CFCF] bg-[#FAF3F3]">
                  <div className="px-5 py-5">
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center bg-[#F3DDDD]">
                        <span className="h-2 w-2 rounded-full bg-[#B66C6C]" />
                      </div>

                      <div>
                        <p className="text-[9px] font-semibold uppercase tracking-[0.16em] text-[#9A5959]">
                          PESANAN DIBATALKAN
                        </p>

                        <p className="mt-1.5 text-[11px] leading-[1.6] text-[#777]">
                          Pesanan #{order.id} telah dibatalkan dan stok produk telah dikembalikan.
                        </p>
                      </div>
                    </div>
                  </div>
                </section>
              )}

              {/* INFO */}
              <section className="border border-[#E3E0D9] bg-[#F0EFEA] px-5 py-4">

                <div className="flex items-center justify-between">
                  <p className="text-[9px] font-semibold uppercase tracking-[0.16em] text-[#888]">
                    NOMOR PESANAN
                  </p>

                  <span
                    className="text-[12px] text-[#555]"
                    style={{ fontFamily: SERIF }}
                  >
                    #{order.id}
                  </span>
                </div>

                <div className="mt-3 flex items-center justify-between border-t border-[#DCD9D2] pt-3">
                  <p className="text-[9px] text-[#999]">
                    Dibuat
                  </p>

                  <p className="text-[10px] text-[#666]">
                    {formatDate(order.createdAt)}
                  </p>
                </div>
              </section>
            </aside>
          </div>
        </div>
      </main>

      {/* =========================================================
          CANCEL CONFIRMATION MODAL
      ========================================================= */}
      {showCancelModal && order && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center px-4">
          {/* Overlay */}
          <div
            className="absolute inset-0 bg-black/40 modal-overlay"
            onClick={() => !cancelling && setShowCancelModal(false)}
          />

          {/* Modal */}
          <div className="relative z-10 w-full max-w-[400px] border border-[#E3E0D9] bg-white shadow-[0_8px_30px_rgba(0,0,0,0.12)] modal-panel">
            <div className="px-6 py-6 sm:px-8 sm:py-7">
              <Serif
                as="h2"
                className="text-[18px] text-[#1A1A1A] sm:text-[20px]"
              >
                Batalkan pesanan?
              </Serif>

              <p className="mt-3 text-[12px] leading-[1.7] text-[#555]">
                Pesanan #{order.id} akan dibatalkan.
              </p>

              <p className="mt-2 text-[11px] leading-[1.7] text-[#999]">
                Setelah dibatalkan, pesanan tidak dapat dipulihkan.
              </p>
            </div>

            <div className="flex border-t border-[#E3E0D9]">
              <button
                type="button"
                onClick={() => setShowCancelModal(false)}
                disabled={cancelling}
                className="flex-1 px-6 py-3.5 text-[10px] font-medium uppercase tracking-[0.14em] text-[#777] transition-colors hover:bg-[#F5F5F2] disabled:opacity-40"
              >
                KEMBALI
              </button>

              <div className="w-px bg-[#E3E0D9]" />

              <button
                type="button"
                onClick={() => void handleCancelOrder()}
                disabled={cancelling}
                className="flex-1 px-6 py-3.5 text-[10px] font-medium uppercase tracking-[0.14em] text-[#C54E4E] transition-colors hover:bg-[#FDF2F2] disabled:opacity-40"
              >
                {cancelling ? 'MEMBATALKAN...' : 'YA, BATALKAN'}
              </button>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
};

/* =========================================================
   ORDER PROGRESS
========================================================= */

const OrderProgress: React.FC<{
  status: string;
}> = ({ status }) => {
  const steps = [
    {
      key: 'PENDING',
      label: 'Pesanan Dibuat',
    },
    {
      key: 'PAID',
      label: 'Dibayar',
    },
    {
      key: 'PROCESSING',
      label: 'Diproses',
    },
    {
      key: 'SHIPPED',
      label: 'Dikirim',
    },
    {
      key: 'DELIVERED',
      label: 'Selesai',
    },
  ];

  const statusOrder: Record<string, number> = {
    PENDING: 0,
    PAID: 1,
    PROCESSING: 2,
    SHIPPED: 3,
    DELIVERED: 4,
    CANCELLED: -1,
    EXPIRED: -1,
  };

  const current = statusOrder[status];

  if (current === -1) {
    return (
      <div className="border-t border-[#E3E0D9] px-5 py-3 sm:px-7">
        <p className="text-[9px] text-[#888]">
          Status pesanan: {STATUS_META[status]?.label ?? status}
        </p>
      </div>
    );
  }

  return (
    <div className="border-t border-[#E3E0D9] px-5 py-4 sm:px-7">
      <div className="flex items-center justify-between">

        {steps.map((step, index) => {
          const active = index <= current;

          return (
            <React.Fragment key={step.key}>

              <div className="flex min-w-0 items-center gap-2">
                <span
                  className={`h-2 w-2 shrink-0 rounded-full ${
                    active
                      ? 'bg-[#1A1A1A]'
                      : 'bg-[#D5D2CB]'
                  }`}
                />

                <span
                  className={`hidden text-[8px] uppercase tracking-[0.08em] sm:block ${
                    active
                      ? 'font-medium text-[#555]'
                      : 'text-[#AAA]'
                  }`}
                >
                  {step.label}
                </span>
              </div>

              {index < steps.length - 1 && (
                <div
                  className={`mx-2 h-px flex-1 ${
                    index < current
                      ? 'bg-[#555]'
                      : 'bg-[#DCD9D2]'
                  }`}
                />
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};

/* =========================================================
   ORDER ITEM ROW
========================================================= */

const OrderItemRow: React.FC<{
  item: OrderItem;
}> = ({ item }) => {
  const variantLabel = item.variant
    ? [item.variant.color, item.variant.size]
        .filter(Boolean)
        .join(' · ')
    : null;

  const productName = item.product?.name ?? 'Produk';
  const productImage = item.product?.image ?? null;

  return (
    <div className="flex gap-4 border-b border-[#E8E5DE] py-5 last:border-b-0 sm:gap-5 sm:py-6">

      {/* IMAGE */}
      <div className="h-[105px] w-[82px] shrink-0 overflow-hidden bg-[#ECEAE4] sm:h-[125px] sm:w-[96px]">
        <img
          src={resolveImageUrl(
            productImage,
            192,
            250,
            productName,
          )}
          alt={productName}
          className="h-full w-full object-cover"
          loading="lazy"
        />
      </div>

      {/* INFO */}
      <div className="flex min-w-0 flex-1 flex-col justify-between">

        <div className="flex items-start justify-between gap-4">

          <div className="min-w-0">
            <Serif
              as="h3"
              className="text-[15px] leading-[1.35] text-[#1A1A1A] sm:text-[17px]"
            >
              {productName}
            </Serif>

            {variantLabel && (
              <p className="mt-1.5 text-[9px] uppercase tracking-[0.08em] text-[#999]">
                {variantLabel}
              </p>
            )}
          </div>

          <Serif
            bold
            className="shrink-0 text-[13px] text-[#1A1A1A] sm:text-[14px]"
          >
            {formatRp(item.subtotal)}
          </Serif>
        </div>

        <div className="mt-5 flex items-center justify-between gap-4">
          <p className="text-[10px] text-[#777]">
            {formatRp(item.price)}
            {' × '}
            {item.quantity}
          </p>

          <span className="text-[9px] text-[#AAA]">
            {item.quantity} item
          </span>
        </div>
      </div>
    </div>
  );
};

/* =========================================================
   SUMMARY ROW
========================================================= */

const SummaryRow: React.FC<{
  label: string;
  value: number;
  negative?: boolean;
}> = ({
  label,
  value,
  negative = false,
}) => (
  <div className="flex items-center justify-between gap-4">
    <span className="text-[11px] text-[#777]">
      {label}
    </span>

    <span
      className={`text-[11px] ${
        negative
          ? 'text-[#A15A5A]'
          : 'text-[#333]'
      }`}
      style={{
        fontFamily: SERIF,
      }}
    >
      {negative ? '-' : ''}
      {formatRp(Math.abs(value))}
    </span>
  </div>
);

export default OrderDetail;