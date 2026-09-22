import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Package, ShoppingBag } from 'lucide-react';
import AnnouncementBar from '../components/AnnouncementBar';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { Serif, SectionStrip, SERIF } from '../components/CommerceUI';
import { useAuth } from '../contexts/AuthContext';
import { resolveImageUrl } from '../lib/utils';
import { mockOrders, type MockOrder, type MockOrderStatus } from '../mocks/orders';

type TabKey = 'SEMUA' | MockOrderStatus;

const TABS: Array<{ key: TabKey; label: string }> = [
  { key: 'SEMUA', label: 'SEMUA' },
  { key: 'BELUM_BAYAR', label: 'BELUM BAYAR' },
  { key: 'DIPROSES', label: 'DIPROSES' },
  { key: 'DIKIRIM', label: 'DIKIRIM' },
  { key: 'DIBATALKAN', label: 'DIBATALKAN' },
  { key: 'SELESAI', label: 'SELESAI' },
];

const STATUS_META: Record<string, { color: string; dot: string; label: string }> = {
  DIKIRIM: { color: 'bg-[#FDF0E0] text-[#A67C3D]', dot: 'bg-[#C9944A]', label: 'DIKIRIM' },
  DIPROSES: { color: 'bg-[#E3EEF8] text-[#4A7BA8]', dot: 'bg-[#5E96C8]', label: 'DIPROSES' },
  SELESAI: { color: 'bg-[#E4F4EA] text-[#3D8B5C]', dot: 'bg-[#4DA66D]', label: 'SELESAI' },
  DIBATALKAN: { color: 'bg-[#F6E0E0] text-[#A05050]', dot: 'bg-[#C06060]', label: 'DIBATALKAN' },
  BELUM_BAYAR: { color: 'bg-[#FDF3D9] text-[#A67C3D]', dot: 'bg-[#C9944A]', label: 'BELUM BAYAR' },
};

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }).toUpperCase();

const formatRp = (n: number) => `Rp${new Intl.NumberFormat('id-ID').format(n)}`;

/* ─── Orders Page ─────────────────────────────────────────── */
const Orders: React.FC = () => {
  const { user, loading: authLoading } = useAuth();
  const [activeTab, setActiveTab] = useState<TabKey>('SEMUA');

  const visible =
    activeTab === 'SEMUA'
      ? mockOrders
      : mockOrders.filter((o) => o.status === activeTab);

  /* ─── Guest gate ─── */
  if (!authLoading && !user) {
    return (
      <div className="flex flex-col min-h-screen bg-[#FDFAF7]">
        <AnnouncementBar />
        <Navbar />
        <main className="flex-1 flex flex-col items-center justify-center py-24 px-6">
          <Package size={44} strokeWidth={1} className="text-[#CFCFCF] mb-5" />
          <Serif as="h1" className="text-[28px] sm:text-[32px] text-[#1A1A1A] mb-3 text-center">
            Pesanan Anda
          </Serif>
          <p className="text-[13px] text-[#777] mb-7">Masuk untuk melihat riwayat pesanan Anda.</p>
          <div className="flex gap-3">
            <Link
              to="/login"
              className="bg-[#1A1A1A] text-white text-[11px] tracking-[0.16em] uppercase font-medium px-8 py-3.5 hover:bg-[#333] transition-colors"
            >
              MASUK
            </Link>
            <Link
              to="/register"
              className="border border-[#1A1A1A] text-[#1A1A1A] text-[11px] tracking-[0.16em] uppercase font-medium px-8 py-3.5 hover:bg-[#1A1A1A] hover:text-white transition-colors"
            >
              DAFTAR
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  /* ─── Loading state ─── */
  if (authLoading) {
    return (
      <div className="flex flex-col min-h-screen bg-[#F5F5F5]">
        <AnnouncementBar />
        <Navbar />
        <main className="flex-1">
          <div className="max-w-[1100px] mx-auto px-3 sm:px-6 py-6 sm:py-10">
            <div className="bg-[#FDFAF7] shadow-[0_1px_3px_rgba(0,0,0,0.04)] overflow-hidden">
              <SectionStrip>PESANAN </SectionStrip>
              <div className="px-3 sm:px-6 py-5 sm:py-7 space-y-4">
                {Array.from({ length: 3 }).map((_, i) => (
                  <SkeletonCard key={i} />
                ))}
              </div>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-[#F5F5F5]">
      <AnnouncementBar />
      <Navbar />

      <main className="flex-1">
        <div className="max-w-[1100px] mx-auto px-3 sm:px-6 py-6 sm:py-10">
          <div className="bg-[#FDFAF7] shadow-[0_1px_3px_rgba(0,0,0,0.04)] overflow-hidden">

            {/* ─── Header ─── */}
            <div className="bg-[#EFEEEA] px-5 sm:px-7 py-3 flex items-center justify-between">
              <Serif bold className="text-[11px] sm:text-[12px] tracking-[0.12em] uppercase text-[#3A3A3A]">
                PESANAN
              </Serif>
              {visible.length > 0 && (
                <span className="text-[10px] tracking-[0.08em] uppercase text-[#9A9A9A]">
                  {visible.length} {visible.length === 1 ? 'PESANAN' : 'PESANAN'}
                </span>
              )}
            </div>

            {/* ─── Status tabs ─── */}
            <nav
              className="bg-[#EFEEEA] border-t border-[#E2E0DA] flex items-stretch overflow-x-auto scrollbar-hide"
              aria-label="Filter status pesanan"
            >
              {TABS.map((tab) => {
                const isActive = activeTab === tab.key;
                return (
                  <button
                    key={tab.key}
                    type="button"
                    onClick={() => setActiveTab(tab.key)}
                    aria-current={isActive ? 'true' : undefined}
                    className={`flex-1 min-w-[90px] px-3 sm:px-4 py-3 text-[10px] sm:text-[11px] tracking-[0.08em] uppercase whitespace-nowrap transition-colors duration-200 relative ${
                      isActive ? 'text-[#1A1A1A]' : 'text-[#9A9A9A] hover:text-[#5A5A5A]'
                    }`}
                    style={{ fontFamily: SERIF, fontWeight: isActive ? 600 : 400 }}
                  >
                    {tab.label}
                    <span
                      className={`absolute bottom-0 left-1/2 -translate-x-1/2 h-[2px] bg-[#1A1A1A] transition-all duration-300 ${
                        isActive ? 'w-[50%]' : 'w-0'
                      }`}
                    />
                  </button>
                );
              })}
            </nav>

            {/* ─── Content ─── */}
            <div className="px-3 sm:px-6 py-4 sm:py-5">
              {visible.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
                  <span className="text-[28px] text-[#C9C9C9] mb-4">&#10022;</span>
                  <Serif className="text-[15px] sm:text-[16px] text-[#4A4A4A]">
                    {activeTab === 'SEMUA'
                      ? 'Belum ada pesanan'
                      : `Tidak ada pesanan berstatus ${TABS.find((t) => t.key === activeTab)?.label}`}
                  </Serif>
                  <p className="text-[12px] text-[#9A9A9A] mt-2 mb-5">
                    Pesanan Anda akan muncul di sini.
                  </p>
                  <Link
                    to="/catalog"
                    className="bg-[#1A1A1A] text-white text-[11px] tracking-[0.12em] uppercase font-medium px-8 py-3 hover:bg-[#333] transition-colors"
                  >
                    JELAJAHI KOLEKSI
                  </Link>
                </div>
              ) : (
                <div className="space-y-3 sm:space-y-4">
                  {visible.map((order) => (
                    <OrderCard key={order.id} order={order} />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

/* ─── Order Card (compact horizontal) ────────────────────── */
const OrderCard: React.FC<{ order: MockOrder }> = ({ order }) => {
  const firstItem = order.items[0];
  const previewImage = firstItem?.image ?? null;
  const meta = STATUS_META[order.status];
  const remainingCount = order.items.length - 1;

  return (
    <article className="bg-[#D9D9D9] overflow-hidden">
      <div className="flex flex-col sm:flex-row sm:items-stretch">

        {/* ─── Preview image ─── */}
        <div className="w-full sm:w-[100px] h-[100px] sm:h-auto bg-[#ECEAE4] overflow-hidden flex-shrink-0">
          {previewImage ? (
            <img
              src={resolveImageUrl(previewImage, 200, 200, firstItem?.productName)}
              alt={firstItem?.productName ?? 'Produk'}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Package size={28} className="text-[#C9C9C9]" />
            </div>
          )}
        </div>

        {/* ─── Card body ─── */}
        <div className="flex-1 min-w-0 px-4 sm:px-5 py-3 sm:py-3.5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">

          {/* Left: product info */}
          <div className="flex-1 min-w-0">
            <Serif
              bold
              as="h3"
              className="text-[12px] sm:text-[13px] text-[#1A1A1A] tracking-[0.02em] uppercase truncate"
            >
              {firstItem?.productName ?? 'Pesanan'}
            </Serif>
            {remainingCount > 0 && (
              <p className="text-[10px] sm:text-[11px] text-[#9A9A9A] mt-0.5">
                + {remainingCount} produk lainnya
              </p>
            )}

            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2">
              <span
                className="text-[9px] sm:text-[10px] tracking-[0.08em] uppercase text-[#8A8A8A]"
                style={{ fontFamily: SERIF, fontWeight: 400 }}
              >
                {order.orderNumber}
              </span>
              <span
                className="text-[9px] sm:text-[10px] tracking-[0.08em] uppercase text-[#B0B0B0]"
              >
                •
              </span>
              <span
                className="text-[9px] sm:text-[10px] tracking-[0.08em] uppercase text-[#8A8A8A]"
                style={{ fontFamily: SERIF, fontWeight: 400 }}
              >
                {formatDate(order.createdAt)}
              </span>
            </div>
          </div>

          {/* Right: status + meta + button */}
          <div className="flex sm:flex-col items-center sm:items-end gap-3 sm:gap-1.5 flex-shrink-0">
            {/* Status badge */}
            {meta && (
              <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 text-[9px] tracking-[0.08em] uppercase font-medium ${meta.color}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${meta.dot}`} />
                {meta.label}
              </span>
            )}

            {/* Product count */}
            <span className="text-[9px] sm:text-[10px] tracking-[0.08em] uppercase text-[#9A9A9A]">
              {order.items.length} PRODUK
            </span>

            {/* Total */}
            <Serif bold className="text-[13px] sm:text-[14px] text-[#1A1A1A]">
              {formatRp(order.total)}
            </Serif>

            {/* Detail button */}
            <Link
              to={`/orders/${order.id}`}
              className="mt-1 text-center bg-[#1A1A1A] text-white text-[10px] sm:text-[11px] tracking-[0.1em] uppercase font-medium px-5 sm:px-6 py-2 sm:py-2.5 hover:bg-[#333] transition-colors whitespace-nowrap"
            >
              DETAIL PESANAN
            </Link>
          </div>
        </div>
      </div>
    </article>
  );
};

/* ─── Skeleton Card ───────────────────────────────────────── */
const SkeletonCard: React.FC = () => (
  <div className="bg-[#D9D9D9] overflow-hidden animate-pulse">
    <div className="flex flex-col sm:flex-row sm:items-stretch">
      <div className="w-full sm:w-[100px] h-[100px] sm:h-[110px] bg-[#C9C9C9]" />
      <div className="flex-1 px-4 sm:px-5 py-3 sm:py-3.5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex-1 space-y-2.5">
          <div className="h-3 bg-[#C9C9C9] w-[60%]" />
          <div className="h-2.5 bg-[#C9C9C9] w-[35%]" />
          <div className="flex gap-3 mt-1">
            <div className="h-2 bg-[#C9C9C9] w-[70px]" />
            <div className="h-2 bg-[#C9C9C9] w-[60px]" />
          </div>
        </div>
        <div className="flex sm:flex-col items-center sm:items-end gap-2 sm:gap-2">
          <div className="h-4 bg-[#C9C9C9] w-[60px] rounded" />
          <div className="h-2 bg-[#C9C9C9] w-[40px]" />
          <div className="h-3.5 bg-[#C9C9C9] w-[80px]" />
          <div className="h-7 bg-[#C9C9C9] w-[110px] mt-1" />
        </div>
      </div>
    </div>
  </div>
);

export default Orders;
