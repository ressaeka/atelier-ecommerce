import React from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Package, MapPin } from 'lucide-react';

import AnnouncementBar from '../components/AnnouncementBar';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import {
  Serif,
  SectionStrip,
  SERIF,
} from '../components/CommerceUI';

import { useAuth } from '../contexts/AuthContext';
import { resolveImageUrl } from '../lib/utils';
import {
  mockOrders,
  type MockOrder,
} from '../mocks/orders';

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
  DIKIRIM: {
    bg: 'bg-[#F7EDE0]',
    text: 'text-[#9A713D]',
    dot: 'bg-[#B9894A]',
    label: 'DIKIRIM',
  },

  DIPROSES: {
    bg: 'bg-[#E8EFF5]',
    text: 'text-[#557A9B]',
    dot: 'bg-[#6D98BC]',
    label: 'DIPROSES',
  },

  SELESAI: {
    bg: 'bg-[#E8F1EA]',
    text: 'text-[#4F805E]',
    dot: 'bg-[#61966E]',
    label: 'SELESAI',
  },

  DIBATALKAN: {
    bg: 'bg-[#F3E5E5]',
    text: 'text-[#9A5959]',
    dot: 'bg-[#B66C6C]',
    label: 'DIBATALKAN',
  },

  BELUM_BAYAR: {
    bg: 'bg-[#F8F0D9]',
    text: 'text-[#9A7B42]',
    dot: 'bg-[#BB974F]',
    label: 'BELUM BAYAR',
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
  const { id } = useParams<{
    id: string;
  }>();

  const {
    user,
    loading: authLoading,
  } = useAuth();

  const order: MockOrder | undefined =
    mockOrders.find(
      (item) => item.id === id,
    );

  /* =======================================================
     GUEST
  ======================================================== */

  if (!authLoading && !user) {
    return (
      <div className="flex min-h-screen flex-col bg-[#FAF9F5]">
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
              className="mb-3 text-[28px] text-[#1A1A1A] sm:text-[32px]"
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
     NOT FOUND
  ======================================================== */

  if (!authLoading && user && !order) {
    return (
      <div className="flex min-h-screen flex-col bg-[#FAF9F5]">
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
              Pesanan yang Anda cari tidak tersedia.
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

  if (!order) {
    return null;
  }

  const status =
    STATUS_META[order.status];

  return (
    <div className="flex min-h-screen flex-col bg-[#F5F5F2]">
      <AnnouncementBar />
      <Navbar />

      <main className="flex-1">
        <div className="mx-auto max-w-[1180px] px-4 py-7 sm:px-6 sm:py-10 lg:px-8">

          {/* =================================================
              BACK
          ================================================== */}

          <Link
            to="/orders"
            className="mb-7 inline-flex items-center gap-2 text-[10px] font-medium uppercase tracking-[0.12em] text-[#8A8A8A] transition-colors hover:text-[#1A1A1A]"
          >
            <ArrowLeft
              size={14}
              strokeWidth={1.5}
            />
            Kembali ke Pesanan
          </Link>

          {/* =================================================
              MAIN CARD
          ================================================== */}

          <div className="overflow-hidden border border-[#E3E0D9] bg-[#FAF9F5] shadow-[0_2px_10px_rgba(0,0,0,0.025)]">

            {/* =================================================
                ORDER HEADER
            ================================================== */}

            <div className="border-b border-[#E3E0D9] px-5 py-5 sm:px-8 sm:py-6">
              <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">

                <div>
                  <p className="mb-2 text-[9px] font-medium uppercase tracking-[0.2em] text-[#AAA]">
                    DETAIL PESANAN
                  </p>

                  <Serif
                    as="h1"
                    className="text-[24px] leading-tight text-[#1A1A1A] sm:text-[30px]"
                  >
                    {order.orderNumber}
                  </Serif>

                  <p className="mt-2 text-[11px] text-[#8A8A8A]">
                    {formatDate(order.createdAt)}
                  </p>
                </div>

                {status && (
                  <div
                    className={`inline-flex w-fit items-center gap-2 px-3 py-2 text-[9px] font-semibold uppercase tracking-[0.14em] ${status.bg} ${status.text}`}
                  >
                    <span
                      className={`h-1.5 w-1.5 rounded-full ${status.dot}`}
                    />
                    {status.label}
                  </div>
                )}
              </div>
            </div>

            {/* =================================================
                BREADCRUMB
            ================================================== */}

            <div className="border-b border-[#E3E0D9] px-5 py-4 sm:px-8">
              <nav
                aria-label="Breadcrumb"
                className="flex flex-wrap items-center gap-x-2 gap-y-1"
              >
                <Link
                  to="/catalog"
                  className="text-[9px] font-medium uppercase tracking-[0.14em] text-[#999] transition-colors hover:text-[#1A1A1A]"
                >
                  KATEGORI
                </Link>

                <span className="text-[9px] text-[#CCC]">
                  /
                </span>

                <span className="text-[9px] font-medium uppercase tracking-[0.14em] text-[#777]">
                  PESANAN
                </span>

                <span className="text-[9px] text-[#CCC]">
                  /
                </span>

                <span className="truncate text-[9px] font-medium uppercase tracking-[0.14em] text-[#1A1A1A]">
                  {order.orderNumber}
                </span>
              </nav>
            </div>

            {/* =================================================
                CONTENT GRID
            ================================================== */}

            <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px]">

              {/* =================================================
                  LEFT — ITEMS
              ================================================== */}

              <section className="border-b border-[#E3E0D9] lg:border-b-0 lg:border-r">

                <SectionStrip>
                  ITEM PESANAN
                </SectionStrip>

                <div className="px-5 sm:px-8">
                  {order.items.map(
                    (item) => (
                      <OrderItemRow
                        key={item.id}
                        item={item}
                      />
                    ),
                  )}
                </div>

              </section>

              {/* =================================================
                  RIGHT — SUMMARY
              ================================================== */}

              <aside className="bg-[#F7F5F0]">

                {/* PAYMENT */}

                <section className="border-b border-[#E3E0D9] px-5 py-6 sm:px-7">

                  <p className="mb-5 text-[9px] font-semibold uppercase tracking-[0.18em] text-[#999]">
                    RINGKASAN PEMBAYARAN
                  </p>

                  <div className="space-y-3.5">

                    <SummaryRow
                      label="Subtotal"
                      value={
                        order.subtotal
                      }
                    />

                    <SummaryRow
                      label="Ongkos Kirim"
                      value={
                        order.shippingFee
                      }
                    />

                    {order.discount >
                      0 && (
                      <SummaryRow
                        label="Diskon"
                        value={
                          -order.discount
                        }
                        negative
                      />
                    )}

                  </div>

                  <div className="my-5 border-t border-[#D8D4CC]" />

                  <div className="flex items-end justify-between gap-4">

                    <span className="text-[9px] font-semibold uppercase tracking-[0.14em] text-[#888]">
                      TOTAL
                    </span>

                    <Serif
                      bold
                      className="text-[20px] text-[#1A1A1A]"
                    >
                      {formatRp(
                        order.total,
                      )}
                    </Serif>

                  </div>

                </section>

                {/* ADDRESS */}

                <section className="px-5 py-6 sm:px-7">

                  <div className="mb-5 flex items-center gap-2">

                    <MapPin
                      size={14}
                      strokeWidth={1.5}
                      className="text-[#888]"
                    />

                    <p className="text-[9px] font-semibold uppercase tracking-[0.18em] text-[#999]">
                      ALAMAT PENGIRIMAN
                    </p>

                  </div>

                  {order.shippingAddress ? (
                    <div>

                      <div className="mb-3">

                        <Serif
                          bold
                          className="text-[14px] text-[#1A1A1A]"
                        >
                          {
                            order
                              .shippingAddress
                              .label
                          }
                        </Serif>

                        <p className="mt-1 text-[11px] text-[#6F6F6F]">
                          {
                            order
                              .shippingAddress
                              .recipient
                          }
                        </p>

                      </div>

                      <p className="text-[11px] leading-[1.75] text-[#555]">
                        {
                          order
                            .shippingAddress
                            .street
                        }

                        <br />

                        {
                          order
                            .shippingAddress
                            .district
                        }
                        ,{' '}
                        {
                          order
                            .shippingAddress
                            .city
                        }

                        <br />

                        {
                          order
                            .shippingAddress
                            .province
                        }
                        ,{' '}
                        {
                          order
                            .shippingAddress
                            .postalCode
                        }
                      </p>

                      <p className="mt-3 text-[11px] text-[#999]">
                        {
                          order
                            .shippingAddress
                            .phone
                        }
                      </p>

                    </div>
                  ) : (
                    <p className="text-[11px] text-[#999]">
                      Alamat tidak tersedia
                    </p>
                  )}

                </section>
              </aside>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

/* =========================================================
   ORDER ITEM ROW
========================================================= */

const OrderItemRow: React.FC<{
  item: {
    id: number;
    productName: string;
    image: string;
    price: number;
    quantity: number;
    color?: string;
    size?: string;
  };
}> = ({ item }) => {

  const variant = [
    item.color,
    item.size,
  ]
    .filter(Boolean)
    .join(' · ');

  return (
    <div className="flex gap-4 border-b border-[#E6E3DC] py-5 last:border-b-0 sm:gap-5 sm:py-6">

      {/* IMAGE */}

      <div className="h-[105px] w-[80px] shrink-0 overflow-hidden bg-[#ECEAE4] sm:h-[125px] sm:w-[95px]">
        <img
          src={resolveImageUrl(
            item.image,
            190,
            250,
            item.productName,
          )}
          alt={item.productName}
          className="h-full w-full object-cover"
          loading="lazy"
        />
      </div>

      {/* INFO */}

      <div className="flex min-w-0 flex-1 flex-col justify-between">

        <div>
          <Serif
            as="h3"
            className="text-[15px] leading-[1.3] text-[#1A1A1A] sm:text-[17px]"
          >
            {item.productName}
          </Serif>

          {variant && (
            <p className="mt-1.5 text-[10px] uppercase tracking-[0.08em] text-[#999]">
              {variant}
            </p>
          )}
        </div>

        <div className="flex items-end justify-between gap-4">

          <p className="text-[11px] text-[#777]">
            {formatRp(item.price)}
            {' × '}
            {item.quantity}
          </p>

          <Serif
            bold
            className="shrink-0 text-[13px] text-[#1A1A1A] sm:text-[14px]"
          >
            {formatRp(
              item.price *
                item.quantity,
            )}
          </Serif>

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
      {formatRp(
        Math.abs(value),
      )}
    </span>

  </div>
);

export default OrderDetail;