import React from 'react';
import { ShoppingBag, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface GuestAccessProps {
  onGuestClick?: () => void;
}

export const GuestAccess: React.FC<GuestAccessProps> = ({ onGuestClick }) => {
  const navigate = useNavigate();

  const handleGuestNav = () => {
    if (onGuestClick) {
      onGuestClick();
    } else {
      navigate('/catalog');
    }
  };

  return (
    <div className="bg-[#EAEAEA] p-4 sm:p-5 border border-[#DCDCDC] space-y-3.5 my-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-[#444444]">
          <ShoppingBag className="w-4 h-4 text-gray-700" />

          <span className="text-[11px] font-semibold tracking-wider uppercase text-gray-700">
            Akses Langsung
          </span>
        </div>

        <span className="bg-white/90 text-[9px] font-extrabold tracking-[0.15em] text-gray-800 px-2.5 py-0.5 border border-gray-300 uppercase">
          INSTAN
        </span>
      </div>

      <div>
        <h3 className="font-bold text-xs md:text-sm tracking-[0.08em] text-gray-900 uppercase">
          JELAJAHI KOLEKSI ATELIER
        </h3>

        <p className="text-[11px] leading-relaxed text-gray-600 mt-1">
          Eksplorasi seluruh koleksi dan temukan item pilihan Anda tanpa perlu membuat akun terlebih dahulu.
        </p>
      </div>

      <button
        type="button"
        onClick={handleGuestNav}
        className="w-full bg-white hover:bg-gray-100 text-gray-900 border border-gray-300 font-bold py-2.5 px-4 text-xs tracking-[0.12em] uppercase flex items-center justify-center gap-2 transition-luxury shadow-2xs cursor-pointer group"
      >
        <span>LANJUTKAN TANPA AKUN</span>

        <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
      </button>
    </div>
  );
};

export default GuestAccess;