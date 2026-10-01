import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Check, Package, Printer, RefreshCw, ShoppingBag } from 'lucide-react';

import AnnouncementBar from '../components/AnnouncementBar';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import {
  Serif,
  SERIF,
} from '../components/CommerceUI';

import { useAuth } from '../contexts/AuthContext';
import { getOrderById } from '../lib/orderApi';
import type { Order } from '../types/api';

/* =========================================================
   POLLING — terbatas, berhenti saat status final
========================================================= */

const POLL_INTERVAL_MS = 2000;
const POLL_MAX_ATTEMPTS = 10;

/** Debug sementara — hanya di dev build. */
const DEBUG_PAYMENT_SUCCESS = import.meta.env.DEV;

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

/**
 * Resolve order id (number) dari:
 * 1. Path param  /payment/success/:orderId  → "12"
 * 2. Query param ?order_id=ATELIER-12-1     → "12"
 *
 * Midtrans mengirim query order_id berformat ATELIER-{orderId}-{attempt}
 * ke finish URL bila finish URL dashboard tanpa path param.
 */
function resolveNumericOrderId(
  pathOrderId?: string,
  queryOrderId?: string | null,
): number | null {
  if (pathOrderId) {
    const fromPath = Number(pathOrderId);
    if (!Number.isNaN(fromPath) && fromPath > 0) return fromPath;
  }

  if (queryOrderId) {
    const match = queryOrderId.match(/^ATELIER-(\d+)-\d+$/i);
    if (match) {
      const fromQuery = Number(match[1]);
      if (!Number.isNaN(fromQuery) && fromQuery > 0) return fromQuery;
    }

    const direct = Number(queryOrderId);
    if (!Number.isNaN(direct) && direct > 0) return direct;
  }

  return null;
}

/** Status pembayaran dari data backend (prioritaskan payment PAID jika berhasil, lalu latest attempt). */
function resolvePaymentStatus(order: Order): string {
  const paidPayment = order.payments?.find((p) => p.status === 'PAID');
  if (paidPayment?.status) return paidPayment.status;

  const latestPayment = order.payments?.[0];
  if (latestPayment?.status) return latestPayment.status;

  return order.status;
}

/** True jika payment ATAU order sudah mencapai status final. */
function isFinalStatus(paymentStatus: string, orderStatus: string): boolean {
  return (
    paymentStatus === 'PAID' ||
    paymentStatus === 'CANCELLED' ||
    paymentStatus === 'EXPIRED' ||
    orderStatus === 'PAID' ||
    orderStatus === 'CANCELLED' ||
    orderStatus === 'EXPIRED'
  );
}


/* =========================================================
   PAYMENT SUCCESS PAGE
   - Route: /payment/success/:orderId  dan  /payment/success
   - Status SELALU dari backend (GET /order/:id)
   - Browser kembali dari Midtrans BUKAN berarti PAID
========================================================= */

const PaymentSuccess: React.FC = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const [searchParams] = useSearchParams();
  const queryOrderId = searchParams.get('order_id');

  const {
    user,
    loading: authLoading,
  } = useAuth();

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [pollAttempts, setPollAttempts] = useState(0);

  const pollTimerRef = useRef<number | null>(null);
  /** Guard urutan response — response basi tidak boleh menimpa data baru. */
  const fetchSeqRef = useRef(0);
  /** Nomor urut request status (untuk debug log). */
  const statusCheckRef = useRef(0);

  const numericId = useMemo(
    () => resolveNumericOrderId(orderId, queryOrderId),
    [orderId, queryOrderId],
  );

  const fetchOrder = useCallback(async (): Promise<Order | null> => {
    if (!user || numericId === null) return null;

    const seq = ++fetchSeqRef.current;
    setLoading(true);
    setError(null);
    setNotFound(false);

    try {
      const data = await getOrderById(numericId);
      if (seq !== fetchSeqRef.current) return null;

      setOrder(data);

      const paymentStatus = resolvePaymentStatus(data);
      if (DEBUG_PAYMENT_SUCCESS) {
        const checkNo = ++statusCheckRef.current;
        console.log('[PAYMENT POLLING]');
        console.log(`orderId: ${data.id}`);
        console.log(`paymentStatus: ${paymentStatus}`);
        console.log(`orderStatus: ${data.status}`);
        console.log(`attempt: ${checkNo}`);
        if (isFinalStatus(paymentStatus, data.status)) {
          console.log(`Polling stopped: ${paymentStatus}`);
        }
      }

      return data;
    } catch (err: unknown) {
      if (seq !== fetchSeqRef.current) return null;

      const message =
        err instanceof Error ? err.message : 'Terjadi kesalahan.';

      if (
        message.toLowerCase().includes('tidak ditemukan') ||
        message.includes('404')
      ) {
        setNotFound(true);
      } else {
        setError(message);
      }
      return null;
    } finally {
      if (seq === fetchSeqRef.current) {
        setLoading(false);
      }
    }
  }, [user, numericId]);

  useEffect(() => {
    void fetchOrder();
  }, [fetchOrder]);

  // Polling terbatas saat status belum final (webhook mungkin belum masuk).
  // Berhenti: status final (payment/order), jumlah percobaan habis, atau unmount.
  useEffect(() => {
    if (!order) return;

    const paymentStatus = resolvePaymentStatus(order);
    if (isFinalStatus(paymentStatus, order.status)) {
      if (DEBUG_PAYMENT_SUCCESS) {
        console.log(`Polling stopped: ${paymentStatus}`);
      }
      return;
    }
    if (pollAttempts >= POLL_MAX_ATTEMPTS) {
      if (DEBUG_PAYMENT_SUCCESS) {
        console.log(
          `Polling stopped: max attempts (${POLL_MAX_ATTEMPTS})`,
        );
      }
      return;
    }

    pollTimerRef.current = window.setTimeout(() => {
      setPollAttempts((prev) => prev + 1);
      void fetchOrder();
    }, POLL_INTERVAL_MS);

    return () => {
      if (pollTimerRef.current !== null) {
        window.clearTimeout(pollTimerRef.current);
        pollTimerRef.current = null;
      }
    };
  }, [order, pollAttempts, fetchOrder]);

  const handleManualRefresh = async () => {
    if (refreshing) return;
    setRefreshing(true);
    try {
      const data = await fetchOrder();
      if (data && !isFinalStatus(resolvePaymentStatus(data), data.status)) {
        setPollAttempts(0);
      }
    } finally {
      setRefreshing(false);
    }
  };

  /* =======================================================
     GUEST
  ======================================================== */

  if (!authLoading && !user) {
    return (
      <div className="flex min-h-screen flex-col bg-[#F5F5F2]">
        <div className="no-print">
          <AnnouncementBar />
          <Navbar />
        </div>

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
              Status Pembayaran
            </Serif>

            <p className="mb-7 text-[13px] leading-[1.7] text-[#777]">
              Masuk untuk melihat status pembayaran Anda.
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

        <div className="no-print">
          <Footer />
        </div>
      </div>
    );
  }

  /* =======================================================
     LOADING
  ======================================================== */

  if (authLoading || (loading && !order)) {
    return (
      <div className="flex min-h-screen flex-col bg-[#F5F5F2]">
        <div className="no-print">
          <AnnouncementBar />
          <Navbar />
        </div>

        <main className="flex flex-1 items-center justify-center px-6 py-24">
          <div className="w-full max-w-[420px] text-center">
            <RefreshCw
              size={36}
              strokeWidth={1.2}
              className="mx-auto mb-5 animate-spin text-[#CFCAC1]"
            />

            <Serif
              as="h1"
              className="mb-3 text-[24px] text-[#1A1A1A]"
            >
              Memverifikasi Pembayaran
            </Serif>

            <p className="text-[12px] text-[#999]">
              Mohon tunggu sebentar...
            </p>
          </div>
        </main>

        <div className="no-print">
          <Footer />
        </div>
      </div>
    );
  }

  /* =======================================================
     INVALID ORDER ID
  ======================================================== */

  if (numericId === null) {
    return (
      <div className="flex min-h-screen flex-col bg-[#F5F5F2]">
        <div className="no-print">
          <AnnouncementBar />
          <Navbar />
        </div>

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
              Tautan Tidak Valid
            </Serif>

            <p className="mb-7 text-[13px] text-[#777]">
              Nomor pesanan tidak ditemukan pada tautan pembayaran.
            </p>

            <Link
              to="/orders"
              className="inline-flex items-center gap-2 bg-[#1A1A1A] px-8 py-3.5 text-[10px] font-medium uppercase tracking-[0.16em] text-white transition-colors hover:bg-[#333]"
            >
              KE HALAMAN PESANAN
            </Link>
          </div>
        </main>

        <div className="no-print">
          <Footer />
        </div>
      </div>
    );
  }

  /* =======================================================
     ERROR
  ======================================================== */

  if (error) {
    return (
      <div className="flex min-h-screen flex-col bg-[#F5F5F2]">
        <div className="no-print">
          <AnnouncementBar />
          <Navbar />
        </div>

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
              Gagal Memeriksa Pembayaran
            </Serif>

            <p className="mb-7 text-[13px] text-[#777]">
              Gagal memeriksa status pembayaran.
              {error && (
                <span className="mt-2 block text-[11px] leading-[1.7] text-[#999]">
                  {error}
                </span>
              )}
            </p>

            <div className="flex justify-center gap-3">
              <button
                type="button"
                onClick={() => void handleManualRefresh()}
                className="bg-[#1A1A1A] px-8 py-3.5 text-[10px] font-medium uppercase tracking-[0.16em] text-white transition-colors hover:bg-[#333]"
              >
                COBA LAGI
              </button>

              <Link
                to="/orders"
                className="border border-[#1A1A1A] px-8 py-3.5 text-[10px] font-medium uppercase tracking-[0.16em] text-[#1A1A1A] transition-colors hover:bg-[#1A1A1A] hover:text-white"
              >
                KE HALAMAN PESANAN
              </Link>
            </div>
          </div>
        </main>

        <div className="no-print">
          <Footer />
        </div>
      </div>
    );
  }

  /* =======================================================
     NOT FOUND
  ======================================================== */

  if (notFound || (!loading && !order)) {
    return (
      <div className="flex min-h-screen flex-col bg-[#F5F5F2]">
        <div className="no-print">
          <AnnouncementBar />
          <Navbar />
        </div>

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
              KE HALAMAN PESANAN
            </Link>
          </div>
        </main>

        <div className="no-print">
          <Footer />
        </div>
      </div>
    );
  }

  if (!order) return null;

  const paymentStatus = resolvePaymentStatus(order);
  const isPaid = paymentStatus === 'PAID';
  const isPending = paymentStatus === 'PENDING';
  const isCancelled = paymentStatus === 'CANCELLED';
  const isExpired = paymentStatus === 'EXPIRED';

  const displayedPayment =
    order.payments?.find((p) => p.status === 'PAID') ??
    order.payments?.[0];

  const pollingActive = isPending && pollAttempts < POLL_MAX_ATTEMPTS;

  /* =======================================================
     STATUS META (UI per status — backend = source of truth)
  ======================================================== */

  const statusUi = (() => {
    if (isPaid) {
      return {
        badgeBg: 'bg-[#E8EFF5]',
        badgeText: 'text-[#557A9B]',
        dot: 'bg-[#6D98BC]',
        badgeLabel: 'PEMBAYARAN BERHASIL',
        title: 'Pembayaran Berhasil',
        description:
          'Terima kasih, pembayaran Anda telah berhasil diproses.',
        icon: <Check size={28} strokeWidth={2} className="text-[#3D8B5C]" />,
      };
    }

    if (isPending) {
      return {
        badgeBg: 'bg-[#F8F0D9]',
        badgeText: 'text-[#9A7B42]',
        dot: 'bg-[#BB974F]',
        badgeLabel: 'MENUNGGU PEMBAYARAN',
        title: 'Pembayaran Sedang Diproses',
        description:
          'Kami sedang menunggu konfirmasi pembayaran dari Midtrans. Halaman ini memeriksa ulang status secara otomatis.',
        icon: <RefreshCw size={28} strokeWidth={1.5} className="text-[#BB974F]" />,
      };
    }

    if (isCancelled) {
      return {
        badgeBg: 'bg-[#F3E5E5]',
        badgeText: 'text-[#9A5959]',
        dot: 'bg-[#B66C6C]',
        badgeLabel: 'PEMBAYARAN DIBATALKAN',
        title: 'Pembayaran Dibatalkan',
        description: `Pembayaran untuk Order #${order.id} tidak berhasil.`,
        icon: <Package size={28} strokeWidth={1.5} className="text-[#B66C6C]" />,
      };
    }

    if (isExpired) {
      return {
        badgeBg: 'bg-[#EEEEEE]',
        badgeText: 'text-[#6A6A6A]',
        dot: 'bg-[#9A9A9A]',
        badgeLabel: 'PEMBAYARAN KEDALUARSA',
        title: 'Pembayaran Kedaluwarsa',
        description: 'Waktu pembayaran telah berakhir.',
        icon: <Package size={28} strokeWidth={1.5} className="text-[#9A9A9A]" />,
      };
    }

    return {
      badgeBg: 'bg-[#EEEEEE]',
      badgeText: 'text-[#6A6A6A]',
      dot: 'bg-[#9A9A9A]',
      badgeLabel: order.status,
      title: 'Status Pesanan',
      description: `Status pesanan saat ini: ${order.status}.`,
      icon: <Package size={28} strokeWidth={1.5} className="text-[#9A9A9A]" />,
    };
  })();

  /* =======================================================
     RENDER
  ======================================================== */

  return (
    <div className="flex min-h-screen flex-col bg-[#F5F5F2] print:bg-white">
      <div className="no-print">
        <AnnouncementBar />
        <Navbar />
      </div>

      <main className="flex-1">
        <div className="mx-auto max-w-[640px] px-4 py-10 sm:px-6 sm:py-14 print:max-w-none print:px-0 print:py-0">

          <div className="no-print">
            <Link
              to={`/orders/${order.id}`}
              className="mb-8 inline-flex items-center gap-2 text-[10px] font-medium uppercase tracking-[0.12em] text-[#777] transition-colors hover:text-[#1A1A1A]"
            >
              <ArrowLeft size={14} strokeWidth={1.5} />
              Kembali
            </Link>
          </div>

          {/* =====================================================
              RECEIPT / STATUS CARD
          ====================================================== */}
          <section
            id="payment-receipt"
            className="border border-[#E3E0D9] bg-[#FAF9F5] px-5 py-8 text-center sm:px-10 sm:py-12 print:border-0 print:bg-white print:px-0 print:py-0"
          >
            <span
              className={`mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full ${statusUi.badgeBg} print:h-12 print:w-12`}
            >
              {statusUi.icon}
            </span>

            <span
              className={`mb-4 inline-flex items-center gap-2 px-3 py-1.5 text-[9px] font-semibold uppercase tracking-[0.14em] ${statusUi.badgeBg} ${statusUi.badgeText}`}
            >
              <span className={`h-1.5 w-1.5 rounded-full ${statusUi.dot}`} />
              {statusUi.badgeLabel}
            </span>

            <Serif
              as="h1"
              className="mb-3 text-[26px] leading-tight text-[#1A1A1A] sm:text-[32px]"
            >
              {statusUi.title}
            </Serif>

            <p className="mx-auto mb-8 max-w-[420px] text-[12px] leading-[1.75] text-[#666] sm:text-[13px]">
              {statusUi.description}
            </p>

            {/* Summary — ikut tercetak */}
            <div className="mx-auto mb-8 max-w-[360px] space-y-3 border-t border-[#E3E0D9] pt-6 text-left print:border-[#CCC]">
              <div className="flex items-center justify-between gap-3">
                <span className="text-[10px] uppercase tracking-[0.12em] text-[#999]">
                  Order ID
                </span>
                <span
                  className="text-[13px] text-[#1A1A1A]"
                  style={{ fontFamily: SERIF }}
                >
                  #{order.id}
                </span>
              </div>

              <div className="flex items-center justify-between gap-3">
                <span className="text-[10px] uppercase tracking-[0.12em] text-[#999]">
                  Tanggal
                </span>
                <span className="text-[11px] text-[#555]">
                  {formatDate(order.createdAt)}
                </span>
              </div>

              <div className="flex items-center justify-between gap-3">
                <span className="text-[10px] uppercase tracking-[0.12em] text-[#999]">
                  Status Pembayaran
                </span>
                <span
                  className={`text-[11px] font-semibold uppercase tracking-[0.08em] ${statusUi.badgeText}`}
                >
                  {paymentStatus}
                </span>
              </div>

              {displayedPayment?.transactionStatus && (
                <div className="flex items-center justify-between gap-3">
                  <span className="text-[10px] uppercase tracking-[0.12em] text-[#999]">
                    Transaksi
                  </span>
                  <span className="text-[11px] text-[#555]">
                    {displayedPayment.transactionStatus}
                  </span>
                </div>
              )}

              <div className="flex items-center justify-between gap-3">
                <span className="text-[10px] uppercase tracking-[0.12em] text-[#999]">
                  Total
                </span>
                <Serif
                  bold
                  className="text-[15px] text-[#1A1A1A]"
                >
                  {formatRp(order.total)}
                </Serif>
              </div>

              {displayedPayment?.midtransOrderId && (
                <div className="flex items-center justify-between gap-3">
                  <span className="text-[10px] uppercase tracking-[0.12em] text-[#999]">
                    Ref. Midtrans
                  </span>
                  <span className="text-[11px] text-[#555]">
                    {displayedPayment.midtransOrderId}
                  </span>
                </div>
              )}

            </div>

            {/* =====================================================
                ACTIONS — disembunyikan saat print
            ====================================================== */}
            <div className="no-print flex flex-col items-stretch justify-center gap-3 sm:flex-row">
              {/* PAID */}
              {isPaid && (
                <>
                  <Link
                    to={`/orders/${order.id}`}
                    className="inline-flex items-center justify-center bg-[#1A1A1A] px-8 py-3.5 text-[10px] font-medium uppercase tracking-[0.16em] text-white transition-colors hover:bg-[#333]"
                  >
                    LIHAT PESANAN
                  </Link>

                  <button
                    type="button"
                    onClick={() => window.print()}
                    className="inline-flex items-center justify-center gap-2 border border-[#1A1A1A] px-8 py-3.5 text-[10px] font-medium uppercase tracking-[0.16em] text-[#1A1A1A] transition-colors hover:bg-[#1A1A1A] hover:text-white"
                  >
                    <Printer size={13} strokeWidth={1.75} />
                    CETAK PEMBAYARAN
                  </button>

                  <Link
                    to="/catalog"
                    className="inline-flex items-center justify-center gap-2 border border-[#1A1A1A] px-8 py-3.5 text-[10px] font-medium uppercase tracking-[0.16em] text-[#1A1A1A] transition-colors hover:bg-[#1A1A1A] hover:text-white"
                  >
                    <ShoppingBag size={13} strokeWidth={1.75} />
                    LANJUT BELANJA
                  </Link>
                </>
              )}

              {/* PENDING */}
              {isPending && (
                <>
                  <button
                    type="button"
                    onClick={() => void handleManualRefresh()}
                    disabled={refreshing || loading}
                    className="inline-flex items-center justify-center gap-2 bg-[#1A1A1A] px-8 py-3.5 text-[10px] font-medium uppercase tracking-[0.16em] text-white transition-colors hover:bg-[#333] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <RefreshCw
                      size={13}
                      strokeWidth={2}
                      className={refreshing ? 'animate-spin' : ''}
                    />
                    {refreshing ? 'MEMUAT...' : 'REFRESH STATUS'}
                  </button>

                  <Link
                    to={`/orders/${order.id}`}
                    className="inline-flex items-center justify-center border border-[#1A1A1A] px-8 py-3.5 text-[10px] font-medium uppercase tracking-[0.16em] text-[#1A1A1A] transition-colors hover:bg-[#1A1A1A] hover:text-white"
                  >
                    LIHAT PESANAN
                  </Link>
                </>
              )}

              {/* CANCELLED */}
              {isCancelled && (
                <>
                  <Link
                    to="/cart"
                    className="inline-flex items-center justify-center bg-[#1A1A1A] px-8 py-3.5 text-[10px] font-medium uppercase tracking-[0.16em] text-white transition-colors hover:bg-[#333]"
                  >
                    COBA BAYAR LAGI
                  </Link>

                  <Link
                    to={`/orders/${order.id}`}
                    className="inline-flex items-center justify-center border border-[#1A1A1A] px-8 py-3.5 text-[10px] font-medium uppercase tracking-[0.16em] text-[#1A1A1A] transition-colors hover:bg-[#1A1A1A] hover:text-white"
                  >
                    LIHAT PESANAN
                  </Link>
                </>
              )}

              {/* EXPIRED */}
              {isExpired && (
                <>
                  <Link
                    to="/cart"
                    className="inline-flex items-center justify-center bg-[#1A1A1A] px-8 py-3.5 text-[10px] font-medium uppercase tracking-[0.16em] text-white transition-colors hover:bg-[#333]"
                  >
                    BAYAR LAGI
                  </Link>

                  <Link
                    to={`/orders/${order.id}`}
                    className="inline-flex items-center justify-center border border-[#1A1A1A] px-8 py-3.5 text-[10px] font-medium uppercase tracking-[0.16em] text-[#1A1A1A] transition-colors hover:bg-[#1A1A1A] hover:text-white"
                  >
                    LIHAT PESANAN
                  </Link>
                </>
              )}

              {/* Status lain (PROCESSING dll) */}
              {!isPaid && !isPending && !isCancelled && !isExpired && (
                <Link
                  to={`/orders/${order.id}`}
                  className="inline-flex items-center justify-center bg-[#1A1A1A] px-8 py-3.5 text-[10px] font-medium uppercase tracking-[0.16em] text-white transition-colors hover:bg-[#333]"
                >
                  LIHAT PESANAN
                </Link>
              )}
            </div>

            {isPending && (
              <div className="no-print mt-6 space-y-1">
                <p className="text-[10px] leading-[1.7] text-[#9A8F78]">
                  {pollingActive
                    ? `Memeriksa ulang status secara otomatis (${pollAttempts}/${POLL_MAX_ATTEMPTS})…`
                    : 'Pemeriksaan otomatis selesai. Klik Refresh Status jika konfirmasi belum diterima.'}
                </p>
                <p className="text-[9px] leading-[1.7] text-[#9A8F78]">
                  Status pembayaran hanya dianggap berhasil setelah dikonfirmasi
                  oleh sistem — bukan hanya karena Anda kembali dari Midtrans.
                </p>
              </div>
            )}
          </section>
        </div>
      </main>

      <div className="no-print">
        <Footer />
      </div>
    </div>
  );
};

export default PaymentSuccess;
