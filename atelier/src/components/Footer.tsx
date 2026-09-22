import React from 'react';
import { Link } from 'react-router-dom';

const DISPLAY_FONT =
  "'Libre Bodoni', 'Bodoni Moda', 'Playfair Display', Georgia, serif";

const BODY_FONT =
  "'Inter', 'Plus Jakarta Sans', system-ui, sans-serif";

const Footer: React.FC = () => {
  const categories = [
    {
      label: 'Pria',
      href: '/catalog?gender=men',
    },
    {
      label: 'Wanita',
      href: '/catalog?gender=women',
    },
    {
      label: 'Aksesori',
      href: '/catalog?category=aksesori',
    },
    {
      label: 'Sepatu & Tas',
      href: '/catalog?category=sepatu-tas',
    },
  ];

  const services = [
    {
      label: 'Hubungi Kami',
      href: '/about',
    },
    {
      label: 'FAQ',
      href: '/about#faq',
    },
    {
      label: 'Pengiriman',
      href: '/about#pengiriman',
    },
    {
      label: 'Pengembalian',
      href: '/about#pengembalian',
    },
  ];

  const information = [
    {
      label: 'Tentang Atelier',
      href: '/about',
    },
    {
      label: 'Kebijakan Privasi',
      href: '/about#privasi',
    },
    {
      label: 'Syarat & Ketentuan',
      href: '/about#syarat',
    },
    {
      label: 'Instagram',
      href: 'https://instagram.com',
      external: true,
    },
  ];

  return (
    <footer
      id="footer"
      className="w-full bg-[#F3F1EB]"
      aria-label="Footer"
    >
      <div className="mx-auto max-w-[1400px] px-6 py-7 lg:px-12 lg:py-8">

        {/* =====================================================
            TOP CONTENT
        ====================================================== */}

        <div className="mb-6 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:mb-7 lg:grid-cols-4 lg:gap-8">

          {/* BRAND */}

          <div className="flex flex-col gap-2.5">

            <Link
              to="/"
              aria-label="Atelier Home"
              className="flex w-fit items-center gap-[2px]"
            >
              <span
                className="text-[21px] font-normal tracking-[0.04em] text-[#1A1A1A]"
                style={{
                  fontFamily: DISPLAY_FONT,
                  fontWeight: 400,
                }}
              >
                ATELIER
              </span>

              <span className="mb-[8px] ml-[1px] h-[5px] w-[5px] rounded-full bg-[#8B4513]" />
            </Link>

            <p
              className="max-w-[240px] text-[11.5px] leading-[1.65] text-[#666]"
              style={{
                fontFamily: BODY_FONT,
              }}
            >
              Maison fashion modern yang menghadirkan koleksi dengan desain
              sederhana, elegan, dan timeless.
            </p>
          </div>

          {/* KATEGORI */}

          <div className="flex flex-col gap-2.5">

            <h3
              className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#1A1A1A]"
              style={{
                fontFamily: BODY_FONT,
              }}
            >
              KATEGORI
            </h3>

            <nav className="flex flex-col gap-2.5">
              {categories.map(
                (item) => (
                  <Link
                    key={item.href}
                    to={item.href}
                    className="w-fit text-[11.5px] text-[#666] transition-colors duration-200 hover:text-[#1A1A1A]"
                    style={{
                      fontFamily: BODY_FONT,
                    }}
                  >
                    {item.label}
                  </Link>
                ),
              )}
            </nav>
          </div>

          {/* LAYANAN */}

          <div className="flex flex-col gap-2.5">

            <h3
              className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#1A1A1A]"
              style={{
                fontFamily: BODY_FONT,
              }}
            >
              LAYANAN &amp; BANTUAN
            </h3>

            <nav className="flex flex-col gap-2.5">
              {services.map(
                (item) => (
                  <Link
                    key={item.href}
                    to={item.href}
                    className="w-fit text-[11.5px] text-[#666] transition-colors duration-200 hover:text-[#1A1A1A]"
                    style={{
                      fontFamily: BODY_FONT,
                    }}
                  >
                    {item.label}
                  </Link>
                ),
              )}
            </nav>
          </div>

          {/* INFORMASI */}

          <div className="flex flex-col gap-2.5">

            <h3
              className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#1A1A1A]"
              style={{
                fontFamily: BODY_FONT,
              }}
            >
              INFORMASI
            </h3>

            <nav className="flex flex-col gap-2.5">
              {information.map(
                (item) =>
                  item.external ? (
                    <a
                      key={item.href}
                      href={item.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-fit text-[11.5px] text-[#666] transition-colors duration-200 hover:text-[#1A1A1A]"
                      style={{
                        fontFamily: BODY_FONT,
                      }}
                    >
                      {item.label}
                    </a>
                  ) : (
                    <Link
                      key={item.href}
                      to={item.href}
                      className="w-fit text-[11.5px] text-[#666] transition-colors duration-200 hover:text-[#1A1A1A]"
                      style={{
                        fontFamily: BODY_FONT,
                      }}
                    >
                      {item.label}
                    </Link>
                  ),
              )}
            </nav>
          </div>
        </div>

        {/* DIVIDER */}

        <div className="border-t border-stone-300/60" />

        {/* COPYRIGHT */}

        <div className="flex justify-center pt-4">

          <p
            className="text-center text-[9px] font-medium uppercase tracking-[0.15em] text-[#999]"
            style={{
              fontFamily: BODY_FONT,
            }}
          >
            &copy; 2026 ATELIER. ALL RIGHTS RESERVED.
          </p>

        </div>
      </div>
    </footer>
  );
};

export default Footer;