import React from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Mail,
  MessageCircle,
  Instagram,
  Truck,
  RotateCcw,
  HelpCircle,
  ShieldCheck,
} from 'lucide-react';

import AnnouncementBar from '../components/AnnouncementBar';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

const DISPLAY_FONT =
  "'Libre Bodoni', 'Bodoni Moda', 'Playfair Display', Georgia, serif";

const BODY_FONT =
  "'Inter', 'Plus Jakarta Sans', system-ui, sans-serif";

interface PlaceholderPageProps {
  title: string;
  description?: string;
}

const PlaceholderPage: React.FC<
  PlaceholderPageProps
> = ({
  title,
  description,
}) => {
  return (
    <div className="flex min-h-screen flex-col bg-[#FAF9F5]">
      <AnnouncementBar />
      <Navbar />

      <main className="flex-1">
        <div className="mx-auto max-w-[1400px] px-6 lg:px-12">

          {/* =====================================================
              HERO / INTRO
          ====================================================== */}

          <section className="pb-14 pt-8 sm:pb-16 sm:pt-10 lg:pb-20 lg:pt-12">

            <div className="mx-auto max-w-[900px] text-center">

              <p
                className="mb-3 text-[9px] font-medium uppercase tracking-[0.3em] text-[#A8A090]"
                style={{
                  fontFamily: BODY_FONT,
                }}
              >
                ATELIER JAKARTA
              </p>

              <h1
                className="text-[42px] font-normal leading-[1.05] tracking-[-0.02em] text-[#1A1A1A] sm:text-[52px] lg:text-[64px]"
                style={{
                  fontFamily: DISPLAY_FONT,
                  fontWeight: 400,
                }}
              >
                {title}
              </h1>

              <div className="mx-auto mt-6 h-px w-12 bg-[#C9C3B8]" />

              <p
                className="mx-auto mt-6 max-w-[680px] text-[12px] leading-[1.9] text-[#777] sm:text-[13px]"
                style={{
                  fontFamily: BODY_FONT,
                }}
              >
                {description ??
                  'Mengenal ATELIER lebih dekat — sebuah pendekatan terhadap fashion yang mengutamakan kesederhanaan, kualitas, dan karakter yang bertahan melampaui musim.'}
              </p>

            </div>
          </section>

          {/* =====================================================
              OUR STORY
          ====================================================== */}

          <section className="border-t border-[#DDD8CF] py-14 sm:py-16 lg:py-20">

            <div className="grid grid-cols-1 gap-10 lg:grid-cols-[0.85fr_1.15fr] lg:gap-20">

              <div>
                <p
                  className="mb-3 text-[9px] font-medium uppercase tracking-[0.25em] text-[#A8A090]"
                  style={{
                    fontFamily: BODY_FONT,
                  }}
                >
                  01 — OUR STORY
                </p>

                <h2
                  className="text-[30px] font-normal leading-[1.15] text-[#1A1A1A] sm:text-[38px]"
                  style={{
                    fontFamily: DISPLAY_FONT,
                    fontWeight: 400,
                  }}
                >
                  Sederhana dalam bentuk,
                  <span className="block italic">
                    berkarakter dalam gaya.
                  </span>
                </h2>
              </div>

              <div
                className="space-y-5 text-[12px] leading-[1.95] text-[#666] sm:text-[13px]"
                style={{
                  fontFamily: BODY_FONT,
                }}
              >
                <p>
                  ATELIER lahir dari gagasan sederhana:
                  pakaian yang baik tidak harus
                  berlebihan. Setiap koleksi dirancang
                  untuk menghadirkan keseimbangan
                  antara siluet modern, kenyamanan,
                  dan karakter yang tetap relevan
                  dari waktu ke waktu.
                </p>

                <p>
                  Kami melihat fashion bukan hanya
                  sebagai tren, tetapi sebagai bagian
                  dari cara seseorang mengekspresikan
                  dirinya. Karena itu, setiap pilihan
                  material, proporsi, dan detail
                  memiliki tujuan.
                </p>

                <p>
                  Pendekatan kami menggabungkan
                  estetika editorial dengan kebutuhan
                  gaya sehari-hari untuk menciptakan
                  koleksi yang terasa personal,
                  refined, dan mudah dikenakan.
                </p>
              </div>

            </div>
          </section>

          {/* =====================================================
              PHILOSOPHY
          ====================================================== */}

          <section className="border-y border-[#DDD8CF]">

            <div className="grid grid-cols-1 sm:grid-cols-3">

              <PhilosophyCard
                number="01"
                title="Simplicity"
                description="Potongan yang bersih, detail yang tenang, dan tidak berlebihan."
              />

              <PhilosophyCard
                number="02"
                title="Quality"
                description="Material dan konstruksi dipilih dengan perhatian pada fungsi dan kenyamanan."
                bordered
              />

              <PhilosophyCard
                number="03"
                title="Timelessness"
                description="Desain yang tetap relevan setelah satu musim berakhir."
                bordered
              />

            </div>
          </section>

          {/* =====================================================
              CRAFTSMANSHIP
          ====================================================== */}

          <section className="py-14 sm:py-16 lg:py-20">

            <div className="grid grid-cols-1 gap-10 lg:grid-cols-2 lg:gap-20">

              <div>

                <p
                  className="mb-3 text-[9px] font-medium uppercase tracking-[0.25em] text-[#A8A090]"
                  style={{
                    fontFamily: BODY_FONT,
                  }}
                >
                  02 — CRAFTSMANSHIP
                </p>

                <h2
                  className="text-[30px] font-normal leading-[1.15] text-[#1A1A1A] sm:text-[38px]"
                  style={{
                    fontFamily: DISPLAY_FONT,
                  }}
                >
                  Detail yang terlihat,
                  <span className="block italic">
                    kualitas yang terasa.
                  </span>
                </h2>

              </div>

              <div
                className="space-y-6"
                style={{
                  fontFamily: BODY_FONT,
                }}
              >

                <CraftItem
                  number="01"
                  title="Material"
                  description="Kami memilih material berdasarkan tekstur, daya tahan, kenyamanan, dan karakter visualnya."
                />

                <CraftItem
                  number="02"
                  title="Construction"
                  description="Setiap potongan diperhatikan dari sisi proporsi, struktur, dan detail finishing."
                />

                <CraftItem
                  number="03"
                  title="Quality Control"
                  description="Produk melalui pemeriksaan sebelum dikirim agar detail akhir tetap sesuai standar ATELIER."
                />

              </div>

            </div>
          </section>

          {/* =====================================================
              COLLECTIONS
          ====================================================== */}

          <section className="border-t border-[#DDD8CF] py-14 sm:py-16 lg:py-20">

            <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">

              <div>

                <p
                  className="mb-3 text-[9px] font-medium uppercase tracking-[0.25em] text-[#A8A090]"
                  style={{
                    fontFamily: BODY_FONT,
                  }}
                >
                  03 — COLLECTIONS
                </p>

                <h2
                  className="text-[30px] font-normal leading-[1.15] text-[#1A1A1A] sm:text-[38px]"
                  style={{
                    fontFamily: DISPLAY_FONT,
                  }}
                >
                  Koleksi ATELIER
                </h2>

              </div>

              <Link
                to="/catalog"
                className="inline-flex items-center gap-2 text-[10px] font-medium uppercase tracking-[0.14em] text-[#777] transition-colors hover:text-[#1A1A1A]"
                style={{
                  fontFamily: BODY_FONT,
                }}
              >
                Lihat Kategori
                <ArrowRight
                  size={13}
                  strokeWidth={1.5}
                />
              </Link>

            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">

              <CollectionCard
                number="01"
                title="Autumn / Winter 2026"
                description="Siluet modern, lapisan hangat, dan material bertekstur."
              />

              <CollectionCard
                number="02"
                title="Tailoring"
                description="Potongan structured yang dirancang untuk tampilan refined."
              />

              <CollectionCard
                number="03"
                title="Everyday Essentials"
                description="Pilihan wardrobe sehari-hari dengan pendekatan minimal."
              />

            </div>
          </section>

          {/* =====================================================
              CUSTOMER INFORMATION
          ====================================================== */}

          <section className="border-t border-[#DDD8CF] py-14 sm:py-16 lg:py-20">

            <div className="mb-8">

              <p
                className="mb-3 text-[9px] font-medium uppercase tracking-[0.25em] text-[#A8A090]"
                style={{
                  fontFamily: BODY_FONT,
                }}
              >
                CUSTOMER INFORMATION
              </p>

              <h2
                className="text-[30px] font-normal leading-[1.15] text-[#1A1A1A] sm:text-[38px]"
                style={{
                  fontFamily: DISPLAY_FONT,
                }}
              >
                Bantuan & Informasi
              </h2>

            </div>

            <div className="grid grid-cols-1 border-y border-[#DDD8CF] sm:grid-cols-2 lg:grid-cols-4">

              <InfoCard
                icon={<HelpCircle size={18} strokeWidth={1.4} />}
                title="FAQ"
                description="Jawaban untuk pertanyaan yang paling sering diajukan."
                href="#faq"
              />

              <InfoCard
                icon={<Truck size={18} strokeWidth={1.4} />}
                title="Pengiriman"
                description="Informasi estimasi, proses, dan area pengiriman."
                href="#pengiriman"
                bordered
              />

              <InfoCard
                icon={<RotateCcw size={18} strokeWidth={1.4} />}
                title="Pengembalian"
                description="Ketentuan return dan exchange produk."
                href="#pengembalian"
                bordered
              />

              <InfoCard
                icon={<ShieldCheck size={18} strokeWidth={1.4} />}
                title="Privasi"
                description="Bagaimana informasi pelanggan kami lindungi."
                href="#privasi"
                bordered
              />

            </div>
          </section>

          {/* =====================================================
              FAQ
          ====================================================== */}

          <section
            id="faq"
            className="border-t border-[#DDD8CF] py-14 sm:py-16 lg:py-20"
          >

            <p
              className="mb-3 text-[9px] font-medium uppercase tracking-[0.25em] text-[#A8A090]"
              style={{
                fontFamily: BODY_FONT,
              }}
            >
              04 — FAQ
            </p>

            <div className="grid grid-cols-1 gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:gap-20">

              <h2
                className="text-[30px] font-normal leading-[1.15] text-[#1A1A1A] sm:text-[38px]"
                style={{
                  fontFamily: DISPLAY_FONT,
                }}
              >
                Pertanyaan
                <span className="block italic">
                  yang sering muncul.
                </span>
              </h2>

              <div className="divide-y divide-[#DDD8CF]">

                <FaqItem
                  question="Berapa lama proses pengiriman?"
                  answer="Estimasi pengiriman mengikuti metode kurir yang tersedia saat checkout. Detail estimasi ditampilkan sebelum pembayaran."
                />

                <FaqItem
                  question="Apakah produk dapat dikembalikan?"
                  answer="Produk dapat mengikuti ketentuan pengembalian ATELIER. Pastikan produk memenuhi kondisi dan periode yang ditentukan."
                />

                <FaqItem
                  question="Bagaimana cara memilih ukuran?"
                  answer="Panduan ukuran tersedia pada halaman produk apabila produk memiliki pilihan size."
                />

                <FaqItem
                  question="Bagaimana cara menghubungi ATELIER?"
                  answer="Customer service dapat dihubungi melalui email, WhatsApp, atau Instagram pada informasi kontak di bawah."
                />

              </div>

            </div>
          </section>

          {/* =====================================================
              DELIVERY
          ====================================================== */}

          <section
            id="pengiriman"
            className="border-t border-[#DDD8CF] py-14 sm:py-16 lg:py-20"
          >

            <div className="grid grid-cols-1 gap-8 sm:grid-cols-2">

              <div>
                <p
                  className="mb-3 text-[9px] font-medium uppercase tracking-[0.25em] text-[#A8A090]"
                  style={{
                    fontFamily: BODY_FONT,
                  }}
                >
                  05 — DELIVERY
                </p>

                <h2
                  className="text-[30px] font-normal text-[#1A1A1A] sm:text-[38px]"
                  style={{
                    fontFamily: DISPLAY_FONT,
                  }}
                >
                  Pengiriman
                </h2>
              </div>

              <div
                className="text-[12px] leading-[1.9] text-[#666] sm:text-[13px]"
                style={{
                  fontFamily: BODY_FONT,
                }}
              >
                <p>
                  Pesanan diproses setelah pembayaran
                  berhasil diverifikasi. Estimasi waktu
                  pengiriman bergantung pada layanan
                  kurir yang dipilih saat checkout.
                </p>

                <p className="mt-4">
                  Informasi pengiriman seperti alamat,
                  metode kurir, dan estimasi akan
                  ditampilkan pada proses pembayaran.
                </p>
              </div>

            </div>
          </section>

          {/* =====================================================
              RETURNS
          ====================================================== */}

          <section
            id="pengembalian"
            className="border-t border-[#DDD8CF] py-14 sm:py-16 lg:py-20"
          >

            <div className="grid grid-cols-1 gap-8 sm:grid-cols-2">

              <div>
                <p
                  className="mb-3 text-[9px] font-medium uppercase tracking-[0.25em] text-[#A8A090]"
                  style={{
                    fontFamily: BODY_FONT,
                  }}
                >
                  06 — RETURNS
                </p>

                <h2
                  className="text-[30px] font-normal text-[#1A1A1A] sm:text-[38px]"
                  style={{
                    fontFamily: DISPLAY_FONT,
                  }}
                >
                  Pengembalian
                </h2>
              </div>

              <div
                className="text-[12px] leading-[1.9] text-[#666] sm:text-[13px]"
                style={{
                  fontFamily: BODY_FONT,
                }}
              >
                <p>
                  Kami memahami bahwa keputusan
                  berbelanja secara online terkadang
                  membutuhkan fleksibilitas.
                </p>

                <p className="mt-4">
                  Permintaan return atau exchange harus
                  mengikuti kondisi produk, periode
                  pengajuan, serta ketentuan yang berlaku
                  pada saat pembelian.
                </p>
              </div>

            </div>
          </section>

          {/* =====================================================
              CONTACT
          ====================================================== */}

          <section
            id="contact"
            className="border-t border-[#DDD8CF] py-14 sm:py-16 lg:py-20"
          >

            <div className="mb-10 text-center">

              <p
                className="mb-3 text-[9px] font-medium uppercase tracking-[0.25em] text-[#A8A090]"
                style={{
                  fontFamily: BODY_FONT,
                }}
              >
                07 — CONTACT
              </p>

              <h2
                className="text-[30px] font-normal text-[#1A1A1A] sm:text-[38px]"
                style={{
                  fontFamily: DISPLAY_FONT,
                }}
              >
                Kami siap membantu.
              </h2>

              <p
                className="mx-auto mt-4 max-w-[560px] text-[12px] leading-[1.8] text-[#777] sm:text-[13px]"
                style={{
                  fontFamily: BODY_FONT,
                }}
              >
                Hubungi tim ATELIER untuk pertanyaan
                mengenai produk, pesanan, ukuran,
                pengiriman, atau informasi lainnya.
              </p>

            </div>

            <div className="grid grid-cols-1 border-y border-[#DDD8CF] sm:grid-cols-3">

              <ContactCard
                icon={
                  <Mail
                    size={18}
                    strokeWidth={1.4}
                  />
                }
                label="EMAIL"
                value="hello@atelier.id"
              />

              <ContactCard
                icon={
                  <MessageCircle
                    size={18}
                    strokeWidth={1.4}
                  />
                }
                label="WHATSAPP"
                value="+62 812 0000 0000"
                bordered
              />

              <ContactCard
                icon={
                  <Instagram
                    size={18}
                    strokeWidth={1.4}
                  />
                }
                label="INSTAGRAM"
                value="@atelier"
                bordered
              />

            </div>

            <div className="mt-8 text-center">

              <p
                className="text-[10px] uppercase tracking-[0.16em] text-[#999]"
                style={{
                  fontFamily: BODY_FONT,
                }}
              >
                CUSTOMER SERVICE
              </p>

              <p
                className="mt-2 text-[12px] text-[#666]"
                style={{
                  fontFamily: BODY_FONT,
                }}
              >
                Senin – Jumat · 09.00 – 18.00 WIB
              </p>

            </div>
          </section>

          {/* =====================================================
              PRIVACY / TERMS
          ====================================================== */}

          <section
            id="privasi"
            className="border-t border-[#DDD8CF] py-12"
          >

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">

              <div>
                <p
                  className="text-[9px] font-medium uppercase tracking-[0.22em] text-[#A8A090]"
                  style={{
                    fontFamily: BODY_FONT,
                  }}
                >
                  PRIVACY
                </p>

                <p
                  className="mt-3 text-[11px] leading-[1.8] text-[#777]"
                  style={{
                    fontFamily: BODY_FONT,
                  }}
                >
                  Informasi pribadi pelanggan digunakan
                  hanya untuk kebutuhan akun, pesanan,
                  pembayaran, dan layanan ATELIER.
                </p>
              </div>

              <div id="syarat">
                <p
                  className="text-[9px] font-medium uppercase tracking-[0.22em] text-[#A8A090]"
                  style={{
                    fontFamily: BODY_FONT,
                  }}
                >
                  TERMS & CONDITIONS
                </p>

                <p
                  className="mt-3 text-[11px] leading-[1.8] text-[#777]"
                  style={{
                    fontFamily: BODY_FONT,
                  }}
                >
                  Penggunaan website dan pembelian
                  produk mengikuti syarat dan ketentuan
                  ATELIER yang berlaku.
                </p>
              </div>

            </div>
          </section>

          {/* =====================================================
              CLOSING
          ====================================================== */}

          <section className="pb-16 pt-6 text-center sm:pb-20">

            <p
              className="text-[10px] font-medium uppercase tracking-[0.25em] text-[#A8A090]"
              style={{
                fontFamily: BODY_FONT,
              }}
            >
              ATELIER OFFICIAL
            </p>

            <p
              className="mx-auto mt-4 max-w-[720px] text-[22px] font-normal leading-[1.45] text-[#1A1A1A] sm:text-[28px]"
              style={{
                fontFamily: DISPLAY_FONT,
              }}
            >
              “Gaya bukan tentang menjadi yang paling
              terlihat, tetapi tentang menjadi diri sendiri
              dengan cara yang tepat.”
            </p>

          </section>

        </div>
      </main>

      <Footer />
    </div>
  );
};

/* =========================================================
   PHILOSOPHY CARD
========================================================= */

const PhilosophyCard: React.FC<{
  number: string;
  title: string;
  description: string;
  bordered?: boolean;
}> = ({
  number,
  title,
  description,
  bordered = false,
}) => {
  return (
    <div
      className={`px-6 py-9 text-center sm:py-10 ${
        bordered
          ? 'border-t border-[#DDD8CF] sm:border-l sm:border-t-0'
          : ''
      }`}
    >
      <p
        className="text-[9px] font-medium uppercase tracking-[0.22em] text-[#A8A090]"
        style={{
          fontFamily: BODY_FONT,
        }}
      >
        {number}
      </p>

      <h3
        className="mt-3 text-[22px] font-normal text-[#1A1A1A]"
        style={{
          fontFamily: DISPLAY_FONT,
        }}
      >
        {title}
      </h3>

      <p
        className="mx-auto mt-2 max-w-[220px] text-[11px] leading-[1.7] text-[#888]"
        style={{
          fontFamily: BODY_FONT,
        }}
      >
        {description}
      </p>
    </div>
  );
};

/* =========================================================
   CRAFT ITEM
========================================================= */

const CraftItem: React.FC<{
  number: string;
  title: string;
  description: string;
}> = ({
  number,
  title,
  description,
}) => {
  return (
    <div className="flex gap-5 border-b border-[#DDD8CF] pb-5 last:border-b-0">

      <span
        className="pt-0.5 text-[9px] font-medium tracking-[0.18em] text-[#A8A090]"
        style={{
          fontFamily: BODY_FONT,
        }}
      >
        {number}
      </span>

      <div>
        <h3
          className="text-[20px] text-[#1A1A1A]"
          style={{
            fontFamily: DISPLAY_FONT,
          }}
        >
          {title}
        </h3>

        <p
          className="mt-1.5 text-[11px] leading-[1.75] text-[#777] sm:text-[12px]"
          style={{
            fontFamily: BODY_FONT,
          }}
        >
          {description}
        </p>
      </div>

    </div>
  );
};

/* =========================================================
   COLLECTION CARD
========================================================= */

const CollectionCard: React.FC<{
  number: string;
  title: string;
  description: string;
}> = ({
  number,
  title,
  description,
}) => {
  return (
    <div className="group border border-[#DDD8CF] bg-[#F3F1EB] px-6 py-7 transition-colors hover:border-[#BEB7AA]">

      <p
        className="text-[9px] font-medium tracking-[0.18em] text-[#A8A090]"
        style={{
          fontFamily: BODY_FONT,
        }}
      >
        {number}
      </p>

      <h3
        className="mt-6 text-[22px] leading-[1.25] text-[#1A1A1A]"
        style={{
          fontFamily: DISPLAY_FONT,
        }}
      >
        {title}
      </h3>

      <p
        className="mt-3 text-[11px] leading-[1.75] text-[#777]"
        style={{
          fontFamily: BODY_FONT,
        }}
      >
        {description}
      </p>

      <Link
        to="/catalog"
        className="mt-6 inline-flex items-center gap-2 text-[9px] font-medium uppercase tracking-[0.14em] text-[#666] transition-colors group-hover:text-[#1A1A1A]"
        style={{
          fontFamily: BODY_FONT,
        }}
      >
        Explore
        <ArrowRight
          size={12}
          strokeWidth={1.4}
        />
      </Link>

    </div>
  );
};

/* =========================================================
   INFO CARD
========================================================= */

const InfoCard: React.FC<{
  icon: React.ReactNode;
  title: string;
  description: string;
  href: string;
  bordered?: boolean;
}> = ({
  icon,
  title,
  description,
  href,
  bordered = false,
}) => {
  return (
    <a
      href={href}
      className={`px-5 py-7 transition-colors hover:bg-[#F4F1EB] ${
        bordered
          ? 'border-t border-[#DDD8CF] sm:border-l sm:border-t-0'
          : ''
      }`}
    >
      <div className="text-[#1A1A1A]">
        {icon}
      </div>

      <h3
        className="mt-4 text-[16px] text-[#1A1A1A]"
        style={{
          fontFamily: DISPLAY_FONT,
        }}
      >
        {title}
      </h3>

      <p
        className="mt-2 text-[10.5px] leading-[1.7] text-[#888]"
        style={{
          fontFamily: BODY_FONT,
        }}
      >
        {description}
      </p>
    </a>
  );
};

/* =========================================================
   FAQ ITEM
========================================================= */

const FaqItem: React.FC<{
  question: string;
  answer: string;
}> = ({
  question,
  answer,
}) => {
  return (
    <div className="py-5 first:pt-0 last:pb-0">

      <h3
        className="text-[16px] leading-[1.4] text-[#1A1A1A] sm:text-[18px]"
        style={{
          fontFamily: DISPLAY_FONT,
        }}
      >
        {question}
      </h3>

      <p
        className="mt-2 text-[11px] leading-[1.8] text-[#777] sm:text-[12px]"
        style={{
          fontFamily: BODY_FONT,
        }}
      >
        {answer}
      </p>

    </div>
  );
};

/* =========================================================
   CONTACT CARD
========================================================= */

const ContactCard: React.FC<{
  icon: React.ReactNode;
  label: string;
  value: string;
  bordered?: boolean;
}> = ({
  icon,
  label,
  value,
  bordered = false,
}) => {
  return (
    <div
      className={`px-6 py-8 text-center ${
        bordered
          ? 'border-t border-[#DDD8CF] sm:border-l sm:border-t-0'
          : ''
      }`}
    >
      <div className="flex justify-center text-[#1A1A1A]">
        {icon}
      </div>

      <p
        className="mt-3 text-[9px] font-medium uppercase tracking-[0.18em] text-[#A8A090]"
        style={{
          fontFamily: BODY_FONT,
        }}
      >
        {label}
      </p>

      <p
        className="mt-2 text-[12px] text-[#444]"
        style={{
          fontFamily: BODY_FONT,
        }}
      >
        {value}
      </p>
    </div>
  );
};

export default PlaceholderPage;