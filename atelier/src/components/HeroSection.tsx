import React from 'react';
import { Link } from 'react-router-dom';

const DISPLAY_FONT =
  "'Libre Bodoni', 'Bodoni Moda', 'Playfair Display', Georgia, serif";

const BODY_FONT =
  "'Inter', 'Plus Jakarta Sans', system-ui, sans-serif";

const HeroSection: React.FC = () => {
  return (
    <section
      id="hero"
      aria-label="Hero Section"
      className="w-full bg-[#FAF9F5]"
    >
      <div
        className="
          mx-auto
          flex
          max-w-[1400px]
          flex-col
          px-6
          pb-8
          pt-6
          sm:pb-10
          sm:pt-8
          lg:flex-row
          lg:items-start
          lg:gap-8
          lg:px-12
          lg:pb-12
          lg:pt-10
          xl:gap-10
        "
      >
        {/* =====================================================
            LEFT — TEXT
        ====================================================== */}

        <div
          className="
            flex
            w-full
            flex-col
            justify-start
            lg:w-[38%]
            lg:pt-2
            xl:w-[39%]
          "
        >
          {/* LABEL */}

          <p
            className="
              mb-4
              text-[9px]
              font-medium
              uppercase
              tracking-[0.24em]
              text-[#999]
            "
            style={{
              fontFamily: BODY_FONT,
            }}
          >
            LIFE&nbsp;&nbsp;•&nbsp;&nbsp;STYLE&nbsp;&nbsp;•&nbsp;&nbsp;ATELIER
          </p>

          {/* HEADING */}

          <h1
            className="
              mb-4
              text-[46px]
              font-normal
              leading-[0.98]
              tracking-[-0.025em]
              text-[#1A1A1A]
              sm:text-[56px]
              lg:text-[62px]
              xl:text-[72px]
            "
            style={{
              fontFamily: DISPLAY_FONT,
              fontWeight: 400,
            }}
          >
            Simplicity
            <br />
            in Form
          </h1>

          {/* SEASON */}

          <p
            className="
              mb-5
              text-[13px]
              italic
              tracking-[0.04em]
              text-[#888]
            "
            style={{
              fontFamily: DISPLAY_FONT,
              fontWeight: 400,
            }}
          >
            — Autumn / Winter 2026
          </p>

          {/* DESCRIPTION */}

          <p
            className="
              mb-7
              max-w-[350px]
              text-[12px]
              leading-[1.75]
              text-[#555]
              sm:text-[13px]
            "
            style={{
              fontFamily: BODY_FONT,
            }}
          >
            Buat tampilan terbaik dengan koleksi fashion yang dirancang
            untuk memberikan kesan elegan, sederhana, dan modern dalam
            setiap kesempatan.
          </p>

          {/* CTA */}

          <div className="flex flex-wrap gap-2.5">
            <Link
              to="/catalog"
              id="hero-cta-catalog"
              className="
                inline-flex
                items-center
                justify-center
                bg-[#1A1A1A]
                px-6
                py-3
                text-[10px]
                font-medium
                uppercase
                tracking-[0.16em]
                text-white
                transition-all
                duration-300
                hover:bg-[#333]
              "
              style={{
                fontFamily: BODY_FONT,
              }}
            >
              JELAJAHI KOLEKSI
            </Link>

            <Link
              to="/catalog?gender=men"
              id="hero-cta-men"
              className="
                inline-flex
                items-center
                justify-center
                border
                border-[#CECBC3]
                bg-transparent
                px-6
                py-3
                text-[10px]
                font-medium
                uppercase
                tracking-[0.16em]
                text-[#1A1A1A]
                transition-all
                duration-300
                hover:border-[#1A1A1A]
              "
              style={{
                fontFamily: BODY_FONT,
              }}
            >
              LIHAT KOLEKSI PRIA
            </Link>
          </div>
        </div>

        {/* =====================================================
            RIGHT — IMAGES
        ====================================================== */}

        <div
          className="
            flex
            w-full
            items-start
            justify-center
            gap-3
            pt-7
            lg:w-[62%]
            lg:gap-4
            lg:pt-0
            xl:w-[61%]
          "
        >
          {/* ===================================================
              MAIN WOMEN IMAGE
          ==================================================== */}

          <div className="relative w-[58%] shrink-0">
            <div
              className="
                w-full
                overflow-hidden
                bg-[#E8E4DC]
              "
              style={{
                aspectRatio: '3 / 4',
              }}
            >
              <img
                src="/images/foto_cw.jpeg"
                alt="Model wanita koleksi Autumn Winter 2026"
                className="
                  h-full
                  w-full
                  object-cover
                  object-top
                  transition-transform
                  duration-700
                  hover:scale-[1.03]
                "
                loading="eager"
              />
            </div>
          </div>

          {/* ===================================================
              SECONDARY COLUMN
          ==================================================== */}

          <div
            className="
              flex
              w-[40%]
              shrink-0
              flex-col
              gap-3
            "
          >
            {/* MEN IMAGE */}

            <div
              className="
                w-full
                overflow-hidden
                bg-[#DDD9D0]
              "
              style={{
                aspectRatio: '3 / 4',
              }}
            >
              <img
                src="/images/foto_laki-laki.jpeg"
                alt="Model pria koleksi Autumn Winter 2026"
                className="
                  h-full
                  w-full
                  object-cover
                  object-top
                  transition-transform
                  duration-700
                  hover:scale-[1.03]
                "
                loading="eager"
              />
            </div>

            {/* INFO CARD */}

            <div
              className="
                bg-[#EEECE7]
                px-4
                py-4
                lg:px-5
                lg:py-5
              "
            >
              <p
                className="
                  mb-1.5
                  text-[9px]
                  font-medium
                  uppercase
                  tracking-[0.17em]
                  text-[#888]
                "
                style={{
                  fontFamily: BODY_FONT,
                }}
              >
                Autumn / Winter 2026
              </p>

              <h3
                className="
                  mb-1.5
                  text-[14px]
                  font-normal
                  leading-[1.3]
                  text-[#1A1A1A]
                  lg:text-[15px]
                "
                style={{
                  fontFamily: DISPLAY_FONT,
                  fontWeight: 400,
                }}
              >
                Silhouette Baru dan Sepatu Tas
              </h3>

              <p
                className="
                  text-[10.5px]
                  leading-[1.6]
                  text-[#777]
                  lg:text-[11px]
                "
                style={{
                  fontFamily: BODY_FONT,
                }}
              >
                Koleksi musim gugur yang menampilkan siluet modern
                dengan material premium pilihan.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;