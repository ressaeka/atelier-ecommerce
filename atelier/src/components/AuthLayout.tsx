import React from 'react';

interface AuthLayoutProps {
  children: React.ReactNode;
  subtitle: string;
}

export const AuthLayout: React.FC<AuthLayoutProps> = ({
  children,
  subtitle,
}) => {
  return (
    <div
      className="relative w-full overflow-hidden bg-[#F5F3EE] font-sans text-[#1A1A1A] selection:bg-[#1A1A1A] selection:text-white"
      style={{ height: '100dvh' }}
    >
      <div className="flex h-full w-full flex-col lg:flex-row">

        {/* =========================================================
            LEFT PANEL — EDITORIAL BACKGROUND
        ========================================================== */}
        <section className="relative hidden h-full overflow-hidden bg-[#E8E3DA] lg:flex lg:w-1/2 xl:w-[52%] flex-col justify-between p-8 xl:p-12">

          {/* LARGE SOFT RADIAL LIGHT */}
          <div className="pointer-events-none absolute -left-32 -top-32 h-[600px] w-[600px] rounded-full bg-[#F8F6F1]/80 blur-3xl" />

          {/* SECONDARY GLOW */}
          <div className="pointer-events-none absolute -bottom-40 -right-40 h-[550px] w-[550px] rounded-full bg-[#D8D0C4]/70 blur-3xl" />

          {/* SUBTLE GRID */}
          <div
            className="pointer-events-none absolute inset-0 opacity-[0.18]"
            style={{
              backgroundImage: `
                linear-gradient(to right, rgba(26,26,26,0.08) 1px, transparent 1px),
                linear-gradient(to bottom, rgba(26,26,26,0.08) 1px, transparent 1px)
              `,
              backgroundSize: '80px 80px',
            }}
          />

          {/* CENTER DECORATIVE CIRCLE */}
          <div className="pointer-events-none absolute left-1/2 top-1/2 h-[420px] w-[420px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-black/[0.07]" />

          <div className="pointer-events-none absolute left-1/2 top-1/2 h-[300px] w-[300px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-black/[0.05]" />

          {/* TOP BRANDING */}
          <div className="relative z-10 flex w-full items-start justify-between">

            <div className="flex items-center gap-1.5">
              <span className="font-editorial text-xl font-bold uppercase tracking-[0.22em] text-[#1A1A1A] xl:text-2xl">
                ATELIER
              </span>

              <span className="mb-1 inline-block h-1.5 w-1.5 rounded-full bg-[#A33A2B]" />
            </div>

            <span className="font-editorial text-[9px] font-semibold italic uppercase tracking-[0.2em] text-[#6F6A62] xl:text-[10px]">
              ATELIER &gt; Jakarta &lt;
            </span>
          </div>

          {/* CENTER EDITORIAL CONTENT */}
          <div className="relative z-10 flex flex-1 items-center">

            <div className="max-w-xl">

              <p className="mb-5 text-[9px] font-bold uppercase tracking-[0.3em] text-[#777168] xl:text-[10px]">
                KOLEKSI RUNWAY &amp; HAUTE COUTURE
              </p>

              <h1 className="font-editorial text-5xl font-normal leading-[1.02] tracking-[-0.03em] text-[#1A1A1A] xl:text-6xl 2xl:text-7xl">
                L&apos;Art
                <br />
                de Vivre
              </h1>

              <p className="mt-3 max-w-sm font-editorial text-xl font-light italic leading-relaxed text-[#625D55] xl:text-2xl">
                Eksklusif Untuk Anda
              </p>

              <div className="mt-8 flex items-center gap-4">
                <div className="h-px w-16 bg-[#1A1A1A]/30" />

                <span className="text-[8px] font-semibold uppercase tracking-[0.25em] text-[#888177]">
                  EST. 2026
                </span>
              </div>
            </div>
          </div>

          {/* BOTTOM INFORMATION */}
          <div className="relative z-10 border-t border-[#1A1A1A]/15 pt-4">

            <div className="mb-2 flex items-center justify-between">

              <p className="text-[9px] font-extrabold uppercase tracking-[0.2em] text-[#3F3A34] xl:text-[10px]">
                ATELIER OFFICIAL
              </p>

              <p className="text-[9px] uppercase tracking-[0.15em] text-[#888177] xl:text-[10px]">
                JAKARTA — INDONESIA
              </p>

            </div>

            <p className="max-w-lg text-[9px] leading-relaxed tracking-wide text-[#777168] xl:text-[10px]">
              Busana pria &amp; wanita kualitas premium.
              Mengekspresikan keanggunan melalui detail,
              material, dan desain yang timeless.
            </p>
          </div>
        </section>

        {/* =========================================================
            RIGHT PANEL — AUTHENTICATION
        ========================================================== */}
        <main className="relative h-full w-full overflow-y-auto bg-[#FAF9F5] lg:w-1/2 xl:w-[48%]">

          <div className="flex min-h-full w-full items-center justify-center px-5 py-8 sm:px-8 sm:py-10 md:px-12 lg:px-12 xl:px-16">

            <div className="w-full max-w-[430px]">

              {/* HEADER */}
              <header className="mb-7">

                <div className="flex items-center justify-between border-b border-zinc-200 pb-3">

                  <h2 className="font-editorial text-xl font-bold uppercase tracking-[0.2em] text-[#1A1A1A] sm:text-2xl">
                    ATELIER
                  </h2>

                  <span className="hidden text-[9px] font-medium uppercase tracking-[0.18em] text-zinc-400 sm:block">
                    JAKARTA
                  </span>

                </div>

                <div className="pt-6">

                  <h3 className="font-editorial text-2xl font-normal leading-tight tracking-tight text-[#1A1A1A] sm:text-[28px]">
                    Selamat Datang di Atelier
                  </h3>

                  <p className="mt-2 max-w-md text-[11px] leading-relaxed text-zinc-500 sm:text-xs">
                    {subtitle}
                  </p>

                </div>
              </header>

              {/* LOGIN / REGISTER */}
              <div className="w-full">
                {children}
              </div>

              <button
                type="button"
                onClick={() => alert('Portal Administrasi Toko masih dalam pengembangan.')}
                className="mt-5 flex w-full items-center justify-center text-center text-[9px] font-medium uppercase tracking-[0.16em] text-zinc-500 transition-colors hover:text-black"
              >
                MASUK KE PORTAL ADMINISTRASI TOKO
              </button>

              {/* FOOTER */}
              <footer className="mt-7 w-full border-t border-zinc-200 pt-5">

                <p className="text-center text-[8px] font-semibold uppercase leading-relaxed tracking-[0.16em] text-zinc-400 sm:text-[9px]">
                  KEBIJAKAN PRIVASI
                  <span className="mx-2">•</span>
                  INFORMASI TOKO
                  <span className="mx-2">•</span>
                  SYARAT &amp; KETENTUAN
                </p>

                <p className="mt-3 text-center text-[9px] tracking-wide text-zinc-400">
                  © 2026 ATELIER. ALL RIGHTS RESERVED.
                </p>

              </footer>

            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default AuthLayout;