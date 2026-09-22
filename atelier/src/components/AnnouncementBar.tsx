import React from 'react';

const AnnouncementBar: React.FC = () => {
  return (
    <div className="w-full bg-black text-white">
      <div className="flex min-h-[28px] items-center justify-center px-4">
        <p className="py-2 text-center text-[9px] font-medium uppercase tracking-[0.14em] leading-none text-white/90 sm:text-[10px]">
          Diskon 15% untuk pesanan pertama member baru
          <span className="mx-2 text-white/40">•</span>
          Kode: ATELIREFIRST
          <span className="mx-2 text-white/40">|</span>
          Pengiriman bebas biaya
          <span className="mx-2 text-white/40">&</span>
          Pengembalian 14 hari
        </p>
      </div>
    </div>
  );
};

export default AnnouncementBar;