import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ShoppingBag, ArrowLeft, Star, ShieldCheck, Sparkles } from 'lucide-react';

export const GuestDashboard: React.FC = () => {
  const navigate = useNavigate();

  const collections = [
    {
      id: 1,
      title: 'L’Art de Vivre Coat - Beige Cream',
      category: 'HAUTE COUTURE',
      price: 'RP 14.500.000',
      image: '/images/atelier-hero.jpg',
    },
    {
      id: 2,
      title: 'Tailored Minimalist Blazer',
      category: 'AUTUMN / WINTER 2026',
      price: 'RP 9.800.000',
      image: '/images/atelier-hero.jpg',
    },
    {
      id: 3,
      title: 'Monochrome Editorial Suit',
      category: 'RUNWAY EXCLUSIVE',
      price: 'RP 18.200.000',
      image: '/images/atelier-hero.jpg',
    },
  ];

  return (
    <div className="min-h-screen bg-[#FAF9F5] text-gray-900 font-sans selection:bg-black selection:text-white">
      {/* Header Navigation */}
      <header className="border-b border-gray-200 bg-white/80 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/login')}
              className="inline-flex items-center gap-1.5 text-xs font-bold tracking-widest text-gray-700 hover:text-black uppercase cursor-pointer transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>KEMBALI KE LOGIN</span>
            </button>
          </div>

          <div className="text-center">
            <h1 className="font-editorial text-2xl font-bold tracking-[0.25em] text-black">
              ATELIER
            </h1>
            <p className="text-[9px] tracking-[0.2em] font-medium text-gray-500 uppercase">
              JAKARTA &bull; PARIS &bull; TOKYO
            </p>
          </div>

          <div className="flex items-center gap-3">
            <span className="bg-gray-100 text-gray-800 text-[10px] font-bold tracking-widest px-3 py-1 border border-gray-300 uppercase">
              MODE TAMU (GUEST)
            </span>
          </div>
        </div>
      </header>

      {/* Hero Banner for Guest */}
      <section className="relative bg-black text-white py-16 sm:py-24 px-4 overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center opacity-30 blur-xs"
          style={{ backgroundImage: `url('/images/atelier-hero.jpg')` }}
        />
        <div className="relative z-10 max-w-4xl mx-auto text-center space-y-4">
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md px-3.5 py-1 text-[10px] font-bold tracking-[0.2em] text-white border border-white/20 uppercase">
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>AKSES TAMU SPESIAL EXCLUSIVITY</span>
          </div>

          <h2 className="font-editorial text-3xl sm:text-5xl font-normal leading-tight tracking-tight">
            Selamat Datang di Lemari Privat Atelier
          </h2>
          <p className="text-xs sm:text-sm text-gray-300 max-w-2xl mx-auto leading-relaxed">
            Anda sedang menjelajahi koleksi busana premium sebagai Tamu Terhormat. Anda dapat meninjau catalog runway dan melakukan checkout instan tanpa mendaftar terlebih dahulu.
          </p>

          <div className="pt-4 flex flex-wrap justify-center gap-4">
            <button
              onClick={() => navigate('/register')}
              className="bg-white hover:bg-gray-100 text-black font-bold text-xs tracking-[0.15em] py-3.5 px-8 uppercase transition-luxury shadow-lg cursor-pointer"
            >
              DAFTAR AKUN KEANGGOTAAN RESMI →
            </button>
          </div>
        </div>
      </section>

      {/* Guest Catalog Showcase */}
      <main className="max-w-7xl mx-auto px-4 sm:px-8 py-12 space-y-10">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end border-b border-gray-200 pb-4 gap-4">
          <div>
            <span className="text-[10px] font-bold tracking-[0.2em] text-gray-500 uppercase">
              SELEKSI PRIVAT
            </span>
            <h3 className="font-editorial text-2xl sm:text-3xl text-gray-950 font-normal">
              Koleksi Unggulan Runway 2026
            </h3>
          </div>
          <p className="text-xs text-gray-500 max-w-xs">
            Desain orisinal kurasi desainer ternama dunia dengan material organik sutra &amp; cashmere.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {collections.map((item) => (
            <div
              key={item.id}
              className="bg-white border border-gray-200 group hover:border-black transition-luxury overflow-hidden flex flex-col justify-between"
            >
              <div className="relative aspect-3/4 bg-gray-100 overflow-hidden">
                <img
                  src={item.image}
                  alt={item.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                />
                <span className="absolute top-3 left-3 bg-black/80 text-white text-[9px] font-bold tracking-widest px-2.5 py-1 uppercase">
                  {item.category}
                </span>
              </div>
              <div className="p-5 space-y-3">
                <h4 className="font-editorial text-lg text-gray-900 font-bold tracking-tight">
                  {item.title}
                </h4>
                <p className="text-xs font-bold tracking-wider text-gray-950">
                  {item.price}
                </p>
                <button
                  onClick={() => alert(`Item "${item.title}" ditambahkan ke keranjang tamu!`)}
                  className="w-full py-2.5 bg-[#111111] hover:bg-black text-white text-xs font-bold tracking-widest uppercase flex items-center justify-center gap-2 transition-luxury cursor-pointer"
                >
                  <ShoppingBag className="w-3.5 h-3.5" />
                  <span>CHECKOUT INSTAN (TAMU)</span>
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Guest Benefits Box */}
        <div className="bg-[#ECECEC] p-6 sm:p-8 border border-gray-300 grid grid-cols-1 sm:grid-cols-3 gap-6 text-center">
          <div className="space-y-2">
            <ShieldCheck className="w-6 h-6 text-gray-800 mx-auto" />
            <h5 className="font-bold text-xs tracking-wider uppercase text-gray-900">
              GARANSI OTENTISITAS
            </h5>
            <p className="text-[11px] text-gray-600">
              Setiap produk dikirim dengan sertifikat keaslian dan nomor seri eksklusif.
            </p>
          </div>
          <div className="space-y-2">
            <Star className="w-6 h-6 text-gray-800 mx-auto" />
            <h5 className="font-bold text-xs tracking-wider uppercase text-gray-900">
              PENGIRIMAN EKSPRES
            </h5>
            <p className="text-[11px] text-gray-600">
              Layanan kurir khusus privat 24 jam untuk wilayah DKI Jakarta dan sekitarnya.
            </p>
          </div>
          <div className="space-y-2">
            <ShoppingBag className="w-6 h-6 text-gray-800 mx-auto" />
            <h5 className="font-bold text-xs tracking-wider uppercase text-gray-900">
              LAYANAN FITTING PRIVAT
            </h5>
            <p className="text-[11px] text-gray-600">
              Dukungan penjahit pribadi untuk penyesuaian ukuran langsung di tempat Anda.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-300 bg-white py-8 text-center text-xs text-gray-500">
        <p className="font-bold tracking-widest text-black uppercase mb-1">ATELIER HAUTE COUTURE</p>
        <p>&copy; 2026 ATELIER OFFICIAL. ALL RIGHTS RESERVED.</p>
      </footer>
    </div>
  );
};

export default GuestDashboard;
