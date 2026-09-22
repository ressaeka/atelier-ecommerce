import React from 'react';

const BrandMarquee: React.FC = () => {
  const items = Array.from({ length: 6 });

  return (
    <section
      aria-label="Atelier brand marquee"
      className="w-full overflow-hidden border-y border-[#DDD9D0] bg-[#F3EFE8]"
    >
      <div className="brand-marquee">
        <div className="brand-marquee-track">
          {/* =====================================================
              SET PERTAMA
          ====================================================== */}

          {items.map((_, index) => (
            <div
              key={`first-${index}`}
              className="brand-marquee-item"
            >
              {/* BRAND */}
              <span className="brand-marquee-logo">
                ATELIER
                <sup>®</sup>
              </span>

              {/* DIVIDER */}
              <span
                aria-hidden="true"
                className="brand-marquee-divider"
              />

              {/* TEXT */}
              <span className="brand-marquee-text">
                MODERN ESSENTIALS
              </span>

              {/* DIVIDER */}
              <span
                aria-hidden="true"
                className="brand-marquee-divider"
              />

              {/* SEASON */}
              <span className="brand-marquee-season">
                AUTUMN / WINTER 2026
              </span>

              {/* SYMBOL */}
              <span
                aria-hidden="true"
                className="brand-marquee-symbol"
              >
                ✦
              </span>
            </div>
          ))}

          {/* =====================================================
              SET KEDUA
              Duplicate untuk seamless animation
          ====================================================== */}

          {items.map((_, index) => (
            <div
              key={`second-${index}`}
              className="brand-marquee-item"
              aria-hidden="true"
            >
              {/* BRAND */}
              <span className="brand-marquee-logo">
                ATELIER
                <sup>®</sup>
              </span>

              {/* DIVIDER */}
              <span
                aria-hidden="true"
                className="brand-marquee-divider"
              />

              {/* TEXT */}
              <span className="brand-marquee-text">
                MODERN ESSENTIALS
              </span>

              {/* DIVIDER */}
              <span
                aria-hidden="true"
                className="brand-marquee-divider"
              />

              {/* SEASON */}
              <span className="brand-marquee-season">
                AUTUMN / WINTER 2026
              </span>

              {/* SYMBOL */}
              <span
                aria-hidden="true"
                className="brand-marquee-symbol"
              >
                ✦
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default BrandMarquee;