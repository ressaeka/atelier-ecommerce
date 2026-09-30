import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  MapPin,
  Plus,
  Pencil,
  Trash2,
  Check,
  AlertCircle,
  X,
  ArrowLeft,
} from 'lucide-react';

import AnnouncementBar from '../components/AnnouncementBar';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { Serif, SectionStrip, SERIF } from '../components/CommerceUI';
import { useAuth } from '../contexts/AuthContext';
import {
  getAddresses,
  createAddress,
  updateAddress,
  deleteAddress,
} from '../lib/addressApi';
import type { Address } from '../types/api';

const PHONE_REGEX = /^(?:\+62|62|0)8[1-9][0-9]{7,11}$/;
const POSTAL_REGEX = /^\d{5}$/;

interface AddressFormData {
  label: string;
  recipientName: string;
  phone: string;
  addressLine: string;
  city: string;
  province: string;
  postalCode: string;
  isDefault: boolean;
}

const emptyForm: AddressFormData = {
  label: '',
  recipientName: '',
  phone: '',
  addressLine: '',
  city: '',
  province: '',
  postalCode: '',
  isDefault: false,
};

const Addresses: React.FC = () => {
  const { user, loading: authLoading } = useAuth();

  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Form modal/drawer state
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState<AddressFormData>(emptyForm);
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Delete confirm modal
  const [deletingAddress, setDeletingAddress] = useState<Address | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const fetchAddressList = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError(null);
    try {
      const list = await getAddresses();
      setAddresses(list);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gagal memuat daftar alamat.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    void fetchAddressList();
  }, [fetchAddressList]);

  // Open Create Form
  const handleOpenCreate = () => {
    setEditingId(null);
    setFormData({
      ...emptyForm,
      isDefault: addresses.length === 0, // auto default if first address
    });
    setFormError(null);
    setShowForm(true);
  };

  // Open Edit Form
  const handleOpenEdit = (addr: Address) => {
    setEditingId(addr.id);
    setFormData({
      label: addr.label,
      recipientName: addr.recipientName,
      phone: addr.phone,
      addressLine: addr.addressLine,
      city: addr.city,
      province: addr.province,
      postalCode: addr.postalCode,
      isDefault: addr.isDefault,
    });
    setFormError(null);
    setShowForm(true);
  };

  // Submit Form (Create or Edit)
  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    // Validation matching backend addressSchema
    if (!formData.label.trim()) {
      setFormError('Label alamat harus diisi.');
      return;
    }
    if (!formData.recipientName.trim()) {
      setFormError('Nama penerima harus diisi.');
      return;
    }
    if (!PHONE_REGEX.test(formData.phone.trim())) {
      setFormError('Nomor telepon tidak valid (contoh: 08123456789 atau +628123456789).');
      return;
    }
    if (formData.addressLine.trim().length < 10) {
      setFormError('Alamat lengkap minimal 10 karakter.');
      return;
    }
    if (formData.city.trim().length < 2) {
      setFormError('Kota minimal 2 karakter.');
      return;
    }
    if (formData.province.trim().length < 2) {
      setFormError('Provinsi minimal 2 karakter.');
      return;
    }
    if (!POSTAL_REGEX.test(formData.postalCode.trim())) {
      setFormError('Kode pos harus 5 digit angka.');
      return;
    }

    setFormLoading(true);
    try {
      if (editingId) {
        // Update
        const updated = await updateAddress(editingId, {
          label: formData.label.trim(),
          recipientName: formData.recipientName.trim(),
          phone: formData.phone.trim(),
          addressLine: formData.addressLine.trim(),
          city: formData.city.trim(),
          province: formData.province.trim(),
          postalCode: formData.postalCode.trim(),
          isDefault: formData.isDefault,
        });

        setAddresses((prev) =>
          prev.map((a) => {
            if (a.id === editingId) return updated;
            // If updated was set to default, others become non-default
            if (formData.isDefault && a.id !== editingId) {
              return { ...a, isDefault: false };
            }
            return a;
          }),
        );
      } else {
        // Create
        const created = await createAddress({
          label: formData.label.trim(),
          recipientName: formData.recipientName.trim(),
          phone: formData.phone.trim(),
          addressLine: formData.addressLine.trim(),
          city: formData.city.trim(),
          province: formData.province.trim(),
          postalCode: formData.postalCode.trim(),
          isDefault: formData.isDefault,
        });

        setAddresses((prev) => {
          if (created.isDefault) {
            return [...prev.map((a) => ({ ...a, isDefault: false })), created];
          }
          return [...prev, created];
        });
      }

      setShowForm(false);
      // Background re-sync
      void fetchAddressList();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gagal menyimpan alamat.';
      setFormError(msg);
    } finally {
      setFormLoading(false);
    }
  };

  // Set as Default
  const handleSetDefault = async (addr: Address) => {
    if (addr.isDefault) return;
    try {
      await updateAddress(addr.id, { isDefault: true });
      setAddresses((prev) =>
        prev.map((a) => ({
          ...a,
          isDefault: a.id === addr.id,
        })),
      );
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gagal mengubah alamat default.';
      alert(msg);
    }
  };

  // Delete Address
  const handleConfirmDelete = async () => {
    if (!deletingAddress) return;
    setDeleteLoading(true);
    try {
      await deleteAddress(deletingAddress.id);
      setAddresses((prev) => prev.filter((a) => a.id !== deletingAddress.id));
      setDeletingAddress(null);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gagal menghapus alamat.';
      alert(msg);
    } finally {
      setDeleteLoading(false);
    }
  };

  /* ─── Guest Gate ─── */
  if (!authLoading && !user) {
    return (
      <div className="flex flex-col min-h-screen bg-[#FDFAF7]">
        <AnnouncementBar />
        <Navbar />
        <main className="flex-1 flex flex-col items-center justify-center py-24 px-6">
          <MapPin size={44} strokeWidth={1} className="text-[#CFCFCF] mb-5" />
          <Serif as="h1" className="text-[28px] sm:text-[32px] text-[#1A1A1A] mb-3 text-center">
            Alamat Pengiriman
          </Serif>
          <p className="text-[13px] text-[#777] mb-7">Masuk untuk melihat dan mengelola alamat pengiriman Anda.</p>
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

  return (
    <div className="flex min-h-screen flex-col bg-[#F5F5F5]">
      <AnnouncementBar />
      <Navbar />

      <main className="flex-1">
        <div className="max-w-[1100px] mx-auto px-4 sm:px-6 py-6 sm:py-10">
          {/* Back link */}
          <div className="mb-4">
            <Link
              to="/"
              className="inline-flex items-center gap-1.5 text-[10px] uppercase tracking-[0.14em] text-[#6A6A6A] hover:text-[#1A1A1A] transition-colors"
            >
              <ArrowLeft size={13} strokeWidth={1.75} />
              <span>Kembali ke Beranda</span>
            </Link>
          </div>

          <div className="bg-[#FDFAF7] shadow-[0_1px_3px_rgba(0,0,0,0.04)] overflow-hidden">
            <SectionStrip>BUKU ALAMAT</SectionStrip>

            <div className="p-4 sm:p-8">
              {/* Header with Title and Add Button */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-[#ECEAE4] gap-4">
                <div>
                  <Serif as="h1" className="text-[22px] sm:text-[26px] text-[#1A1A1A] uppercase tracking-[0.04em]">
                    ALAMAT PENGIRIMAN
                  </Serif>
                  <p className="text-[11px] text-[#7A7A7A] mt-1">
                    Kelola alamat untuk mempermudah proses checkout pesanan Anda.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleOpenCreate}
                  className="inline-flex items-center justify-center gap-2 bg-[#1A1A1A] hover:bg-[#333] text-white px-5 py-3 text-[10px] sm:text-[11px] font-bold tracking-[0.14em] uppercase transition-colors shrink-0"
                >
                  <Plus size={14} strokeWidth={2} />
                  <span>TAMBAH ALAMAT BARU</span>
                </button>
              </div>

              {/* Error banner */}
              {error && (
                <div className="mt-6 flex items-start gap-2.5 bg-[#FBD9D3] border border-[#F3B0A3] p-3 text-[#8C3A1E] text-xs">
                  <AlertCircle size={15} strokeWidth={2} className="shrink-0 mt-0.5" />
                  <p>{error}</p>
                </div>
              )}

              {/* Loading State */}
              {loading ? (
                <div className="py-16 text-center text-[#888] space-y-2">
                  <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-[#1A1A1A] border-t-transparent" />
                  <p className="text-xs uppercase tracking-widest text-[#666]">Memuat daftar alamat...</p>
                </div>
              ) : addresses.length === 0 ? (
                /* Empty State */
                <div className="py-16 text-center">
                  <MapPin size={42} strokeWidth={1} className="mx-auto text-[#CFCAC1] mb-3" />
                  <Serif className="text-[18px] text-[#1A1A1A] mb-2 uppercase">
                    BELUM ADA ALAMAT TERSIMPAN
                  </Serif>
                  <p className="text-[12px] text-[#777] max-w-sm mx-auto mb-6">
                    Tambahkan alamat pengiriman utama Anda untuk memulai berbelanja koleksi Atelier.
                  </p>
                  <button
                    type="button"
                    onClick={handleOpenCreate}
                    className="border border-[#1A1A1A] text-[#1A1A1A] hover:bg-[#1A1A1A] hover:text-white px-7 py-3 text-[10px] font-bold tracking-[0.14em] uppercase transition-colors"
                  >
                    + TAMBAH ALAMAT PERTAMA
                  </button>
                </div>
              ) : (
                /* Address List */
                <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                  {addresses.map((addr) => (
                    <div
                      key={addr.id}
                      className={`relative border p-5 flex flex-col justify-between transition-colors ${
                        addr.isDefault
                          ? 'border-[#1A1A1A] bg-white shadow-sm'
                          : 'border-[#E0DED8] bg-[#FAF9F5] hover:border-[#BFBCB3]'
                      }`}
                    >
                      <div>
                        {/* Top Badge & Label */}
                        <div className="flex items-center justify-between gap-2 mb-3">
                          <div className="flex items-center gap-2">
                            <span className="text-[11px] font-bold uppercase tracking-[0.12em] text-[#1A1A1A]">
                              {addr.label}
                            </span>
                            {addr.isDefault && (
                              <span className="bg-[#1A1A1A] text-white text-[8px] font-bold tracking-[0.1em] px-2 py-0.5 uppercase">
                                UTAMA
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => handleOpenEdit(addr)}
                              className="text-[#6A6A6A] hover:text-[#1A1A1A] p-1 transition-colors"
                              title="Edit Alamat"
                              aria-label="Edit Alamat"
                            >
                              <Pencil size={13} strokeWidth={1.75} />
                            </button>

                            <button
                              type="button"
                              onClick={() => setDeletingAddress(addr)}
                              className="text-[#999] hover:text-[#C1603C] p-1 transition-colors"
                              title="Hapus Alamat"
                              aria-label="Hapus Alamat"
                            >
                              <Trash2 size={13} strokeWidth={1.75} />
                            </button>
                          </div>
                        </div>

                        {/* Recipient Details */}
                        <p className="text-[13px] font-bold text-[#1A1A1A] leading-snug">
                          {addr.recipientName}
                        </p>
                        <p className="text-[11px] text-[#6A6A6A] mt-0.5 mb-3 font-mono">
                          {addr.phone}
                        </p>

                        {/* Address text */}
                        <p className="text-[11px] leading-relaxed text-[#4A4A4A]">
                          {addr.addressLine}
                        </p>
                        <p className="text-[11px] text-[#6A6A6A] mt-1">
                          {addr.city}, {addr.province} {addr.postalCode}
                        </p>
                      </div>

                      {/* Action footer */}
                      <div className="mt-5 pt-3 border-t border-[#ECEAE4] flex items-center justify-between">
                        {!addr.isDefault ? (
                          <button
                            type="button"
                            onClick={() => handleSetDefault(addr)}
                            className="text-[9.5px] uppercase tracking-[0.1em] text-[#6A6A6A] hover:text-[#1A1A1A] underline underline-offset-4 font-medium"
                          >
                            Atur sebagai utama
                          </button>
                        ) : (
                          <span className="flex items-center gap-1 text-[9.5px] uppercase tracking-[0.1em] text-[#3D8B5C] font-semibold">
                            <Check size={11} strokeWidth={2.5} /> Alamat Pengiriman Utama
                          </span>
                        )}

                        <span className="text-[9px] text-[#9A9A9A] font-mono">
                          #{addr.id}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* CREATE / EDIT MODAL */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-[2px] animate-fadeIn">
          <div className="bg-[#FAF9F5] w-full max-w-lg p-6 sm:p-8 relative shadow-2xl text-left border border-gray-200/60 max-h-[90vh] overflow-y-auto">
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="absolute top-6 right-6 text-gray-500 hover:text-black p-1 transition-colors"
              aria-label="Tutup form"
            >
              <X size={18} strokeWidth={2} />
            </button>

            <Serif as="h2" className="text-[18px] sm:text-[20px] text-[#1A1A1A] uppercase tracking-[0.06em] mb-1">
              {editingId ? 'UBAH ALAMAT' : 'TAMBAH ALAMAT BARU'}
            </Serif>
            <p className="text-[11px] text-[#7A7A7A] mb-5">
              Pastikan data alamat lengkap dan nomor telepon dapat dihubungi.
            </p>

            {formError && (
              <div className="mb-4 flex items-start gap-2 bg-[#FBD9D3] border border-[#F3B0A3] p-3 text-[#8C3A1E] text-xs">
                <AlertCircle size={14} strokeWidth={2} className="shrink-0 mt-0.5" />
                <p>{formError}</p>
              </div>
            )}

            <form onSubmit={handleFormSubmit} className="space-y-3.5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block mb-1 text-[9px] uppercase tracking-[0.12em] text-[#5A5A5A]" style={{ fontFamily: SERIF }}>
                    Label Alamat <span className="text-[#C1603C]">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.label}
                    onChange={(e) => setFormData((p) => ({ ...p, label: e.target.value }))}
                    placeholder="cth: Rumah, Kantor, Apartemen"
                    className="w-full border border-[#D5D2CA] bg-white px-3 py-2 text-[12px] text-[#1A1A1A] outline-none focus:border-[#1A1A1A]"
                  />
                </div>

                <div>
                  <label className="block mb-1 text-[9px] uppercase tracking-[0.12em] text-[#5A5A5A]" style={{ fontFamily: SERIF }}>
                    Nama Penerima <span className="text-[#C1603C]">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.recipientName}
                    onChange={(e) => setFormData((p) => ({ ...p, recipientName: e.target.value }))}
                    placeholder="Nama Lengkap Penerima"
                    className="w-full border border-[#D5D2CA] bg-white px-3 py-2 text-[12px] text-[#1A1A1A] outline-none focus:border-[#1A1A1A]"
                  />
                </div>
              </div>

              <div>
                <label className="block mb-1 text-[9px] uppercase tracking-[0.12em] text-[#5A5A5A]" style={{ fontFamily: SERIF }}>
                  Nomor Telepon <span className="text-[#C1603C]">*</span>
                </label>
                <input
                  type="tel"
                  required
                  value={formData.phone}
                  onChange={(e) => setFormData((p) => ({ ...p, phone: e.target.value }))}
                  placeholder="08123456789 atau +628123456789"
                  className="w-full border border-[#D5D2CA] bg-white px-3 py-2 text-[12px] text-[#1A1A1A] outline-none focus:border-[#1A1A1A]"
                />
              </div>

              <div>
                <label className="block mb-1 text-[9px] uppercase tracking-[0.12em] text-[#5A5A5A]" style={{ fontFamily: SERIF }}>
                  Alamat Lengkap <span className="text-[#C1603C]">*</span>
                </label>
                <textarea
                  required
                  rows={2}
                  value={formData.addressLine}
                  onChange={(e) => setFormData((p) => ({ ...p, addressLine: e.target.value }))}
                  placeholder="Nama jalan, nomor rumah, RT/RW, kelurahan, kecamatan (min 10 karakter)"
                  className="w-full border border-[#D5D2CA] bg-white px-3 py-2 text-[12px] text-[#1A1A1A] outline-none focus:border-[#1A1A1A]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block mb-1 text-[9px] uppercase tracking-[0.12em] text-[#5A5A5A]" style={{ fontFamily: SERIF }}>
                    Kota / Kab <span className="text-[#C1603C]">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.city}
                    onChange={(e) => setFormData((p) => ({ ...p, city: e.target.value }))}
                    placeholder="cth: Jakarta Selatan"
                    className="w-full border border-[#D5D2CA] bg-white px-3 py-2 text-[12px] text-[#1A1A1A] outline-none focus:border-[#1A1A1A]"
                  />
                </div>

                <div>
                  <label className="block mb-1 text-[9px] uppercase tracking-[0.12em] text-[#5A5A5A]" style={{ fontFamily: SERIF }}>
                    Provinsi <span className="text-[#C1603C]">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.province}
                    onChange={(e) => setFormData((p) => ({ ...p, province: e.target.value }))}
                    placeholder="cth: DKI Jakarta"
                    className="w-full border border-[#D5D2CA] bg-white px-3 py-2 text-[12px] text-[#1A1A1A] outline-none focus:border-[#1A1A1A]"
                  />
                </div>

                <div>
                  <label className="block mb-1 text-[9px] uppercase tracking-[0.12em] text-[#5A5A5A]" style={{ fontFamily: SERIF }}>
                    Kode Pos <span className="text-[#C1603C]">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={5}
                    value={formData.postalCode}
                    onChange={(e) => setFormData((p) => ({ ...p, postalCode: e.target.value }))}
                    placeholder="12345"
                    className="w-full border border-[#D5D2CA] bg-white px-3 py-2 text-[12px] text-[#1A1A1A] outline-none focus:border-[#1A1A1A]"
                  />
                </div>
              </div>

              <div className="pt-2">
                <label className="inline-flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={formData.isDefault}
                    onChange={(e) => setFormData((p) => ({ ...p, isDefault: e.target.checked }))}
                    className="h-4 w-4 rounded-none border-[#D5D2CA] accent-[#1A1A1A]"
                  />
                  <span className="text-[11px] text-[#3A3A3A] tracking-[0.04em]">
                    Jadikan sebagai alamat pengiriman utama
                  </span>
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-[#ECEAE4]">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  disabled={formLoading}
                  className="px-5 py-2.5 text-[10px] uppercase tracking-[0.12em] text-[#5A5A5A] hover:bg-[#ECEAE4] transition-colors"
                >
                  BATAL
                </button>
                <button
                  type="submit"
                  disabled={formLoading}
                  className="bg-[#1A1A1A] hover:bg-[#333] text-white px-6 py-2.5 text-[10px] font-bold uppercase tracking-[0.14em] transition-colors disabled:opacity-50"
                >
                  {formLoading ? 'MENYIMPAN...' : editingId ? 'SIMPAN PERUBAHAN' : 'TAMBAH ALAMAT'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {deletingAddress && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-[2px] animate-fadeIn">
          <div className="bg-[#FAF9F5] w-full max-w-sm p-6 relative shadow-2xl text-left border border-gray-200/60">
            <Serif as="h3" className="text-[16px] text-[#1A1A1A] uppercase tracking-[0.06em] mb-2">
              HAPUS ALAMAT
            </Serif>
            <p className="text-[12px] text-[#555] leading-relaxed mb-4">
              Apakah Anda yakin ingin menghapus alamat <strong className="text-[#1A1A1A]">"{deletingAddress.label}"</strong> ({deletingAddress.recipientName})?
            </p>

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setDeletingAddress(null)}
                disabled={deleteLoading}
                className="px-4 py-2 text-[10px] uppercase tracking-[0.12em] text-[#5A5A5A] hover:bg-[#ECEAE4] transition-colors"
              >
                BATAL
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={deleteLoading}
                className="bg-[#C1603C] hover:bg-[#A84F2E] text-white px-5 py-2 text-[10px] font-bold uppercase tracking-[0.14em] transition-colors disabled:opacity-50"
              >
                {deleteLoading ? 'MENGHAPUS...' : 'YA, HAPUS'}
              </button>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
};

export default Addresses;
