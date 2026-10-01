import React, { useState, useEffect, useMemo } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  MapPin,
  Pencil,
  Truck,
  Zap,
  Lock,
  Check,
  AlertCircle,
  X,
  ArrowRight,
  ArrowLeft,
  Printer,
  Plus,
  Trash2,
} from 'lucide-react';

import AnnouncementBar from '../components/AnnouncementBar';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { Serif, SERIF } from '../components/CommerceUI';

import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';

import { resolveImageUrl } from '../lib/utils';

import type { Address } from '../types/api';

import { createOrder } from '../lib/orderApi';
import { createPayment } from '../lib/paymentApi';
import {
  getAddresses,
  createAddress,
  updateAddress,
  deleteAddress,
} from '../lib/addressApi';

interface OrderLine {
  productId: number;
  name: string;
  image: string;
  variant?: string;
  price: number;
  quantity: number;
}

// Sesuai backend order.service.ts: shippingFee = 0 (integrasi kurir belum tersedia)
const SHIPPING_COST = 0;


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

  const [addressList, setAddressList] =
    useState<Address[]>([]);

  const [showAddressPicker, setShowAddressPicker] =
    useState(false);

  const [showAddressForm, setShowAddressForm] =
    useState(false);

  const [editingAddrId, setEditingAddrId] =
    useState<number | null>(null);

  // Form state untuk tambah/edit address
  const [addrForm, setAddrForm] = useState({
    label: '',
    recipientName: '',
    phone: '',
    addressLine: '',
    city: '',
    province: '',
    postalCode: '',
    isDefault: false,
  });

  const [addrFormError, setAddrFormError] =
    useState<string | null>(null);

  const [addrFormLoading, setAddrFormLoading] =
    useState(false);

  const [promoInput, setPromoInput] =
    useState(initialVoucher);

  const [promoNotice, setPromoNotice] =
    useState<string | null>(null);

  const [orderError, setOrderError] =
    useState<string | null>(null);

  // 'order' = membuat order, 'payment' = membuat transaksi Midtrans
  const [payStage, setPayStage] = useState<
    'idle' | 'order' | 'payment'
  >('idle');

  const orderLoading = payStage !== 'idle';

  /* ============================================================
     ADDRESS
  ============================================================ */

  // Refresh list dan jaga address terpilih tetap valid
  const refreshAddresses = async () => {
    try {
      const list = await getAddresses();
      setAddressList(list);
      setAddress((prev) => {
        if (!prev) {
          return list.find((item) => item.isDefault) ?? list[0] ?? null;
        }
        const fresh = list.find((item) => item.id === prev.id);
        return fresh ?? list.find((item) => item.isDefault) ?? list[0] ?? null;
      });
    } catch {
      setAddress(null);
      setAddressList([]);
    }
  };

  const handleAddrSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddrFormError(null);
    setAddrFormLoading(true);
    try {
      if (editingAddrId) {
        const updated = await updateAddress(editingAddrId, addrForm);
        setAddressList((prev) =>
          prev.map((a) => (a.id === editingAddrId ? updated : a)),
        );
        if (address?.id === editingAddrId) {
          setAddress(updated);
        }
      } else {
        const created = await createAddress(addrForm);
        setAddressList((prev) => [...prev, created]);
        setAddress(created);
      }
      await refreshAddresses();
      setShowAddressForm(false);
      setEditingAddrId(null);
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : 'Gagal menyimpan alamat.';
      setAddrFormError(msg);
    } finally {
      setAddrFormLoading(false);
    }
  };

  const handleDeleteAddress = async (addrId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    const confirmed = window.confirm('Apakah Anda yakin ingin menghapus alamat ini?');
    if (!confirmed) return;
    try {
      await deleteAddress(addrId);
      const remaining = addressList.filter((a) => a.id !== addrId);
      setAddressList(remaining);
      if (address?.id === addrId) {
        setAddress(remaining.find((a) => a.isDefault) ?? remaining[0] ?? null);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gagal menghapus alamat.';
      alert(msg);
    }
  };

  const handleStartEditAddress = (addr: Address, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingAddrId(addr.id);
    setAddrForm({
      label: addr.label,
      recipientName: addr.recipientName,
      phone: addr.phone,
      addressLine: addr.addressLine,
      city: addr.city,
      province: addr.province,
      postalCode: addr.postalCode,
      isDefault: addr.isDefault,
    });
    setAddrFormError(null);
    setShowAddressForm(true);
    setShowAddressPicker(false);
  };

  useEffect(() => {
    refreshAddresses();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ============================================================
     TOTALS
     Sesuai backend order.service.ts: total = subtotal + shippingFee (0)
  ============================================================ */

  const subtotal = lines.reduce(
    (sum, line) =>
      sum +
      line.price * line.quantity,
    0,
  );

  // Backend belum memiliki modul voucher promo
  const discount = 0;

  const total =
    subtotal +
    SHIPPING_COST -
    discount;

  /* ============================================================
     PAY — create order → create Midtrans payment → redirect
  ============================================================ */

  const handlePay = async () => {
    if (lines.length === 0 || !address) {
      setOrderError('Pilih alamat pengiriman terlebih dahulu.');
      return;
    }

    if (orderLoading) return;

    setOrderError(null);
    setPayStage('order');

    let createdOrderId: number | null = null;
    let stage: 'order' | 'payment' = 'order';

    try {
      // Backend membaca cart user dari JWT, hanya butuh addressId
      const createdOrder = await createOrder({
        addressId: address.id,
      });

      createdOrderId = createdOrder.id ?? null;

      // Clear cart best-effort setelah order sukses
      try {
        await clearCart();
      } catch {
        // Cart clearing bersifat best-effort, order sudah dibuat
      }

      // Buat transaksi Midtrans untuk order yang baru dibuat
      stage = 'payment';
      setPayStage('payment');
      const payment = await createPayment(createdOrder.id);

      if (!payment.redirectUrl) {
        throw new Error(
          'Link pembayaran tidak tersedia. Silakan coba lagi.',
        );
      }

      // Redirect ke halaman Snap Midtrans Sandbox
      window.location.href = payment.redirectUrl;
    } catch (err: unknown) {
      let message =
        err instanceof Error
          ? err.message
          : 'Pembayaran gagal dibuat. Silakan coba lagi.';

      // Fallback pesan yang jelas bila error tidak spesifik
      if (
        stage === 'payment' &&
        (!message || message === 'Terjadi kesalahan' || message === 'Terjadi kesalahan jaringan')
      ) {
        message = 'Pembayaran gagal dibuat. Silakan coba lagi.';
      }

      // Order sudah terbisa tetapi payment gagal → arahkan user ke detail order
      if (createdOrderId && stage === 'payment') {
        message += ` Pesanan #${createdOrderId} sudah dibuat — Anda dapat menyelesaikan pembayaran dari halaman detail pesanan.`;
      }

      setOrderError(message);
    } finally {
      setPayStage('idle');
    }
  };

  const stepState =
    payStage !== 'idle'
      ? 'Memproses'
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
                  done: false,
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
                          step.current
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
                          step.current
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

                {/* Header actions */}
                <div className="flex items-center gap-3 shrink-0">
                  {/* Pilih address (muncul jika >1 address & form tidak terbuka) */}
                  {addressList.length > 1 && !showAddressForm && (
                    <button
                      type="button"
                      onClick={() => {
                        setShowAddressPicker((v) => !v);
                      }}
                      className="flex items-center gap-1.5 text-[#1A1A1A] transition-colors hover:text-[#5A5A5A]"
                    >
                      <Pencil size={11} strokeWidth={1.75} />
                      <Serif bold className="text-[9px] uppercase tracking-[0.1em] underline underline-offset-2 sm:text-[11px]">
                        {showAddressPicker ? 'TUTUP' : 'UBAH'}
                      </Serif>
                    </button>
                  )}

                  {/* Tambah address baru */}
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddressForm((v) => !v);
                      setShowAddressPicker(false);
                      setEditingAddrId(null);
                      setAddrFormError(null);
                      // Reset form saat dibuka
                      if (!showAddressForm) {
                        setAddrForm({
                          label: '',
                          recipientName: '',
                          phone: '',
                          addressLine: '',
                          city: '',
                          province: '',
                          postalCode: '',
                          isDefault: false,
                        });
                      }
                    }}
                    className="flex items-center gap-1.5 text-[#1A1A1A] transition-colors hover:text-[#5A5A5A]"
                  >
                    {showAddressForm
                      ? <X size={12} strokeWidth={2} />
                      : <Plus size={12} strokeWidth={2} />}
                    <Serif bold className="text-[9px] uppercase tracking-[0.1em] underline underline-offset-2 sm:text-[11px]">
                      {showAddressForm ? 'BATAL' : 'TAMBAH ALAMAT'}
                    </Serif>
                  </button>
                </div>
              </header>

              {/* ── Form Tambah / Edit Address ── */}
              {showAddressForm && (
                <form
                  onSubmit={handleAddrSubmit}
                  className="mb-4 bg-white p-4 sm:p-5 space-y-3"
                >
                  <div className="flex items-center justify-between pb-2 border-b border-[#ECEAE4]">
                    <span className="text-[10px] font-bold uppercase tracking-[0.1em] text-[#1A1A1A]">
                      {editingAddrId ? 'UBAH ALAMAT' : 'TAMBAH ALAMAT BARU'}
                    </span>
                  </div>
                  {/* Error */}
                  {addrFormError && (
                    <div className="flex items-start gap-2 bg-[#FBD9D3] px-3 py-2.5">
                      <AlertCircle size={12} strokeWidth={2} className="mt-0.5 shrink-0 text-[#C1603C]" />
                      <p className="text-[10px] leading-relaxed text-[#8C3A1E]">{addrFormError}</p>
                    </div>
                  )}

                  {/* Row 1: Label + Nama Penerima */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block mb-1 text-[9px] uppercase tracking-[0.12em] text-[#5A5A5A]" style={{ fontFamily: SERIF }}>
                        Label <span className="text-[#C1603C]">*</span>
                      </label>
                      <input
                        required
                        maxLength={50}
                        placeholder="cth. Rumah, Kantor"
                        value={addrForm.label}
                        onChange={(e) => setAddrForm((f) => ({ ...f, label: e.target.value }))}
                        className="w-full border border-[#D9D9D9] bg-[#FAFAF9] px-3 py-2 text-[11px] text-[#1A1A1A] outline-none focus:border-[#1A1A1A] placeholder:text-[#BABABA] transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block mb-1 text-[9px] uppercase tracking-[0.12em] text-[#5A5A5A]" style={{ fontFamily: SERIF }}>
                        Nama Penerima <span className="text-[#C1603C]">*</span>
                      </label>
                      <input
                        required
                        maxLength={100}
                        placeholder="Nama lengkap"
                        value={addrForm.recipientName}
                        onChange={(e) => setAddrForm((f) => ({ ...f, recipientName: e.target.value }))}
                        className="w-full border border-[#D9D9D9] bg-[#FAFAF9] px-3 py-2 text-[11px] text-[#1A1A1A] outline-none focus:border-[#1A1A1A] placeholder:text-[#BABABA] transition-colors"
                      />
                    </div>
                  </div>

                  {/* Row 2: No HP */}
                  <div>
                    <label className="block mb-1 text-[9px] uppercase tracking-[0.12em] text-[#5A5A5A]" style={{ fontFamily: SERIF }}>
                      Nomor Telepon <span className="text-[#C1603C]">*</span>
                    </label>
                    <input
                      required
                      type="tel"
                      placeholder="08xxxxxxxxxx"
                      value={addrForm.phone}
                      onChange={(e) => setAddrForm((f) => ({ ...f, phone: e.target.value }))}
                      className="w-full border border-[#D9D9D9] bg-[#FAFAF9] px-3 py-2 text-[11px] text-[#1A1A1A] outline-none focus:border-[#1A1A1A] placeholder:text-[#BABABA] transition-colors"
                    />
                    <p className="mt-0.5 text-[9px] text-[#9A9A9A]">Format: 08xx, +62xx, atau 62xx</p>
                  </div>

                  {/* Row 3: Alamat */}
                  <div>
                    <label className="block mb-1 text-[9px] uppercase tracking-[0.12em] text-[#5A5A5A]" style={{ fontFamily: SERIF }}>
                      Alamat Lengkap <span className="text-[#C1603C]">*</span>
                    </label>
                    <input
                      required
                      minLength={10}
                      maxLength={255}
                      placeholder="Jl. Contoh No. 1, RT/RW, Kelurahan"
                      value={addrForm.addressLine}
                      onChange={(e) => setAddrForm((f) => ({ ...f, addressLine: e.target.value }))}
                      className="w-full border border-[#D9D9D9] bg-[#FAFAF9] px-3 py-2 text-[11px] text-[#1A1A1A] outline-none focus:border-[#1A1A1A] placeholder:text-[#BABABA] transition-colors"
                    />
                  </div>

                  {/* Row 4: Kota + Provinsi + Kode Pos */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block mb-1 text-[9px] uppercase tracking-[0.12em] text-[#5A5A5A]" style={{ fontFamily: SERIF }}>
                        Kota <span className="text-[#C1603C]">*</span>
                      </label>
                      <input
                        required
                        minLength={2}
                        maxLength={100}
                        placeholder="Jakarta Selatan"
                        value={addrForm.city}
                        onChange={(e) => setAddrForm((f) => ({ ...f, city: e.target.value }))}
                        className="w-full border border-[#D9D9D9] bg-[#FAFAF9] px-3 py-2 text-[11px] text-[#1A1A1A] outline-none focus:border-[#1A1A1A] placeholder:text-[#BABABA] transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block mb-1 text-[9px] uppercase tracking-[0.12em] text-[#5A5A5A]" style={{ fontFamily: SERIF }}>
                        Provinsi <span className="text-[#C1603C]">*</span>
                      </label>
                      <input
                        required
                        minLength={2}
                        maxLength={100}
                        placeholder="DKI Jakarta"
                        value={addrForm.province}
                        onChange={(e) => setAddrForm((f) => ({ ...f, province: e.target.value }))}
                        className="w-full border border-[#D9D9D9] bg-[#FAFAF9] px-3 py-2 text-[11px] text-[#1A1A1A] outline-none focus:border-[#1A1A1A] placeholder:text-[#BABABA] transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block mb-1 text-[9px] uppercase tracking-[0.12em] text-[#5A5A5A]" style={{ fontFamily: SERIF }}>
                        Kode Pos <span className="text-[#C1603C]">*</span>
                      </label>
                      <input
                        required
                        pattern="\d{5}"
                        maxLength={5}
                        placeholder="12345"
                        value={addrForm.postalCode}
                        onChange={(e) => setAddrForm((f) => ({ ...f, postalCode: e.target.value.replace(/\D/g, '') }))}
                        className="w-full border border-[#D9D9D9] bg-[#FAFAF9] px-3 py-2 text-[11px] text-[#1A1A1A] outline-none focus:border-[#1A1A1A] placeholder:text-[#BABABA] transition-colors"
                      />
                    </div>
                  </div>

                  {/* Row 5: Jadikan utama */}
                  <label className="flex items-center gap-2.5 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={addrForm.isDefault}
                      onChange={(e) => setAddrForm((f) => ({ ...f, isDefault: e.target.checked }))}
                      className="w-3.5 h-3.5 accent-[#1A1A1A]"
                    />
                    <span className="text-[10px] text-[#3A3A3A]" style={{ fontFamily: SERIF }}>
                      Jadikan alamat utama
                    </span>
                  </label>

                  {/* Submit */}
                  <button
                    type="submit"
                    disabled={addrFormLoading}
                    className="w-full bg-[#1A1A1A] text-white py-2.5 text-[10px] uppercase tracking-[0.12em] font-bold hover:bg-[#333] transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                    style={{ fontFamily: SERIF }}
                  >
                    {addrFormLoading ? 'MENYIMPAN...' : editingAddrId ? 'SIMPAN PERUBAHAN' : 'SIMPAN ALAMAT'}
                  </button>
                </form>
              )}

              {/* ── Address Picker ── */}
              {showAddressPicker && !showAddressForm && (
                <div className="mb-4 space-y-2">
                  <div className="flex justify-between items-center px-1 mb-2">
                    <span className="text-[10px] font-bold uppercase tracking-[0.1em] text-[#5A5A5A]">
                      PILIH DARI DAFTAR ALAMAT ({addressList.length})
                    </span>
                    <Link
                      to="/addresses"
                      className="text-[9px] uppercase tracking-[0.1em] text-[#1A1A1A] underline underline-offset-2 hover:text-[#5A5A5A]"
                    >
                      Buka Buku Alamat →
                    </Link>
                  </div>

                  {addressList.map((addr) => {
                    const isSelected = address?.id === addr.id;
                    return (
                      <div
                        key={addr.id}
                        className={`p-3 sm:p-4 border transition-colors ${
                          isSelected
                            ? 'border-[#1A1A1A] bg-white'
                            : 'border-[#D9D9D9] bg-[#F5F5F3] hover:border-[#9A9A9A]'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <div className="flex items-center gap-2">
                            <span className="text-[11px] font-bold text-[#1A1A1A]">
                              {addr.recipientName}
                            </span>
                            <span className="bg-[#C9C9C9] px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-[0.1em] text-[#3A3A3A]">
                              {addr.label}
                            </span>
                            {addr.isDefault && (
                              <span className="bg-[#1A1A1A] px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-[0.1em] text-white">
                                UTAMA
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={(e) => handleStartEditAddress(addr, e)}
                              className="text-[#6A6A6A] hover:text-[#1A1A1A] p-1 text-[9px] font-medium uppercase tracking-wider inline-flex items-center gap-1"
                              title="Edit Alamat"
                            >
                              <Pencil size={11} strokeWidth={1.75} />
                              <span className="hidden sm:inline">UBAH</span>
                            </button>

                            <button
                              type="button"
                              onClick={(e) => handleDeleteAddress(addr.id, e)}
                              className="text-[#999] hover:text-[#C1603C] p-1 text-[9px] font-medium uppercase tracking-wider inline-flex items-center gap-1"
                              title="Hapus Alamat"
                            >
                              <Trash2 size={11} strokeWidth={1.75} />
                              <span className="hidden sm:inline">HAPUS</span>
                            </button>

                            {!isSelected ? (
                              <button
                                type="button"
                                onClick={() => {
                                  setAddress(addr);
                                  setShowAddressPicker(false);
                                }}
                                className="bg-[#1A1A1A] hover:bg-[#333] text-white text-[9px] font-bold uppercase tracking-wider px-2.5 py-1"
                              >
                                PILIH
                              </button>
                            ) : (
                              <span className="text-[8.5px] uppercase tracking-[0.1em] text-[#3D8B5C] font-bold">
                                ✓ TERPILIH
                              </span>
                            )}
                          </div>
                        </div>

                        <p className="text-[10px] leading-relaxed text-[#3A3A3A]">
                          {addr.addressLine}, {addr.city}, {addr.province} {addr.postalCode}
                        </p>
                        <p className="mt-0.5 text-[10px] text-[#777]">{addr.phone}</p>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* ── Selected address display ── */}
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
                    : 'Alamat pengiriman belum diatur. Klik TAMBAH ALAMAT untuk menambahkan.'}
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
                      Standar Delivery
                    </span>

                    <span className="bg-[#7A756D] px-2 py-0.5 text-[8px] font-bold uppercase tracking-[0.1em] text-white sm:text-[9px]">
                      INTEGRASI KURIR BELUM TERSEDIA
                    </span>
                  </div>

                  <p className="mt-1 text-[9.5px] text-[#4A4A4A] sm:text-[10.5px]">
                    Backend Atelier API belum terintegrasi kurir pihak ketiga. Ongkos kirim saat ini Rp 0.
                  </p>
                </div>

                <Serif
                  bold
                  className="shrink-0 whitespace-nowrap text-[12px] text-[#1A1A1A] sm:text-[15px]"
                >
                  GRATIS (RP 0)
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
                      placeholder="ATELIERFIRST"
                      className="min-w-0 flex-1 border border-[#E0DED8] bg-white px-3 py-2.5 text-[10px] uppercase tracking-[0.1em] text-[#1A1A1A] outline-none placeholder:text-[#B0B0B0] transition-colors focus:border-[#1A1A1A] sm:text-[11px]"
                    />

                    <button
                      type="button"
                      onClick={() => {
                        const value =
                          promoInput.trim();

                        if (value) {
                          setPromoNotice('Voucher belum didukung oleh backend Atelier API.');
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

                  {promoNotice && (
                    <div className="mt-2 flex items-center gap-2 bg-[#F5EDE8] px-3 py-2">
                      <AlertCircle
                        size={12}
                        strokeWidth={2}
                        className="shrink-0 text-[#8C3A1E]"
                      />

                      <span className="flex-1 text-[9px] uppercase tracking-[0.06em] text-[#8C3A1E] sm:text-[10px]">
                        {promoNotice}
                      </span>

                      <button
                        type="button"
                        onClick={() => {
                          setPromoNotice(null);
                          setPromoInput('');
                        }}
                        aria-label="Tutup notifikasi promo"
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
                        Ongkos Kirim
                      </dt>

                      <dd
                        className="whitespace-nowrap text-[#1A1A1A]"
                        style={{
                          fontFamily: SERIF,
                        }}
                      >
                        Gratis (Rp 0)
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

                  {orderError && (
                    <div className="mb-3 flex items-start gap-2 bg-[#FBD9D3] px-3 py-2.5">
                      <AlertCircle
                        size={13}
                        strokeWidth={2}
                        className="mt-0.5 shrink-0 text-[#C1603C]"
                      />
                      <p className="text-[10px] leading-relaxed text-[#8C3A1E]">
                        {orderError}
                      </p>
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={handlePay}
                    disabled={
                      lines.length === 0 ||
                      orderLoading ||
                      !address
                    }
                    className="mt-4 flex w-full items-center justify-between gap-3 bg-[#0A0A0A] px-4 py-4 text-white transition-colors hover:bg-[#242424] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <Serif
                      bold
                      className="text-left text-[11px] uppercase leading-tight tracking-[0.06em] sm:text-[14px]"
                    >
                      {payStage === 'payment' ? (
                        'MEMPROSES PEMBAYARAN...'
                      ) : payStage === 'order' ? (
                        'MEMBUAT PESANAN...'
                      ) : (
                        <>
                          KONFIRMASI
                          <br />
                          & BAYAR SEKARANG
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
                PAYMENT METHOD (MIDTRANS SNAP)
            ======================================================= */}

            <section className="mb-6 bg-[#EFEEEA] p-4 sm:p-7">
              <header className="mb-4 flex items-center justify-between gap-2 sm:mb-5">
                <div className="flex items-center gap-2">
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
                  </Serif>
                </div>

                <span className="bg-[#3D8B5C] text-white text-[8px] sm:text-[9px] font-bold uppercase tracking-[0.1em] px-2 py-0.5">
                  MIDTRANS SANDBOX
                </span>
              </header>

              <div className="border border-[#CBC7BD] bg-[#DFDCD4] p-4 sm:p-5 text-left">
                <p className="mb-2 text-[11px] sm:text-[12px] font-medium leading-relaxed text-[#2A2A2A]">
                  Pembayaran diproses melalui Midtrans Snap (Sandbox).
                </p>
                <p className="text-[10px] sm:text-[11px] leading-relaxed text-[#555]">
                  Setelah Anda menekan tombol di atas, pesanan dibuat ke backend
                  (status <strong className="text-[#1A1A1A]">PENDING</strong>),
                  lalu Anda akan diarahkan ke halaman pembayaran Midtrans.
                  Status pembayaran diperbarui otomatis oleh notifikasi Midtrans
                  ke backend — bukan dari halaman ini.
                </p>
              </div>
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
                disabled={orderLoading}
                title={
                  orderLoading
                    ? 'Sedang memproses pesanan'
                    : undefined
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
                  CETAK RINGKASAN
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