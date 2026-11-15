import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Package, Shirt } from 'lucide-react';
import { resolveImageUrl } from '../../../lib/utils';
import type { AnalyticsTopProduct } from '../../types/analytics';
import {
  CardFooter,
  CardHeader,
  ProgressBar,
  RankBadge,
} from '../ui/AdminPrimitives';

interface AnalyticsTopProductsCardProps {
  products: AnalyticsTopProduct[];
}

const numberFormatter = new Intl.NumberFormat('id-ID');
const percentFormatter = new Intl.NumberFormat('id-ID', {
  maximumFractionDigits: 1,
});

function formatRupiah(value: number): string {
  return `Rp ${numberFormatter.format(value)}`;
}

function formatPercent(value: number): string {
  return `${percentFormatter.format(value)}%`;
}

function ProductThumb({ src, name }: { src?: string | null; name: string }) {
  const [failed, setFailed] = useState(false);

  if (!src || failed) {
    return (
      <div
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[10px] border border-[#ECE7DE] bg-[#FAF8F4] text-[#A39D93]"
        aria-hidden="true"
      >
        <Package className="h-[18px] w-[18px]" />
      </div>
    );
  }

  return (
    <img
      src={resolveImageUrl(src, 88, 88, name)}
      alt={name}
      loading="lazy"
      onError={() => setFailed(true)}
      className="h-11 w-11 shrink-0 rounded-[10px] border border-[#ECE7DE] object-cover"
    />
  );
}

export default function AnalyticsTopProductsCard({
  products,
}: AnalyticsTopProductsCardProps) {
  const totalRevenue = useMemo(
    () => products.reduce((sum, item) => sum + item.revenue, 0),
    [products],
  );

  return (
    <section
      aria-labelledby="top-products-title"
      className="flex h-full min-w-0 flex-col overflow-hidden rounded-2xl border border-[#ECE7DE] bg-white p-6 shadow-[0_1px_3px_rgba(26,22,18,0.04)]"
    >
      <CardHeader
        id="top-products-title"
        icon={Shirt}
        title="Performa Produk"
        scope="Periode aktif"
        subtitle={
          products.length > 0
            ? `${numberFormatter.format(products.length)} produk terjual pada periode ini`
            : 'Belum ada penjualan pada periode ini'
        }
      />

      {products.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-[#ECE7DE] bg-[#FAF8F4] p-8 text-center">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#F4EFE8] text-[#9A7458]">
            <Shirt className="h-5 w-5" aria-hidden="true" />
          </div>
          <p className="text-[13.5px] font-semibold text-[#3F3B36]">
            Belum ada penjualan produk
          </p>
          <p className="max-w-[240px] text-[12.5px] leading-relaxed text-[#6F6A62]">
            Produk terlaris akan muncul di sini setelah ada penjualan pada
            periode ini.
          </p>
        </div>
      ) : (
        <div className="flex flex-1 flex-col justify-between">
          <ol className="-mx-2.5 flex flex-col gap-1">
            {products.map((item) => {
              const isTop = item.rank === 1;

              return (
                <li
                  key={`${item.rank}-${item.productId}`}
                  className={`rounded-[14px] px-2.5 py-2 transition-colors hover:bg-[#FAF8F4] ${
                    isTop ? 'bg-[#FAF8F4]' : ''
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <RankBadge rank={item.rank} />
                    <ProductThumb src={item.image} name={item.name} />

                    <div className="min-w-0 flex-1">
                      <p
                        className="truncate text-[14px] font-semibold text-[#1A1A1A]"
                        title={item.name}
                      >
                        {item.name}
                      </p>
                      <p className="mt-0.5 truncate font-sans text-[12px] tabular-nums text-[#6F6A62]">
                        <span className="font-medium text-[#3F3B36]">
                          {formatRupiah(item.revenue)}
                        </span>
                        <span aria-hidden="true"> · </span>
                        <span>
                          {numberFormatter.format(item.unitsSold)} terjual
                        </span>
                      </p>
                    </div>

                    <span
                      className={`shrink-0 font-sans text-[14px] font-bold tabular-nums ${
                        isTop ? 'text-[#5C4033]' : 'text-[#3F3B36]'
                      }`}
                    >
                      {formatPercent(item.revenueContributionPct)}
                    </span>
                  </div>

                  <ProgressBar
                    value={item.revenueContributionPct}
                    colorClass={isTop ? 'bg-[#5C4033]' : 'bg-[#C2A48A]'}
                    className="ml-9 mt-2"
                  />
                </li>
              );
            })}
          </ol>
        </div>
      )}

      <CardFooter
        left={
          <Link
            to="/admin/reports/products"
            className="group inline-flex items-center gap-1.5 rounded-md font-semibold text-[#5C4033] transition-colors hover:text-[#3D2920] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#5C4033]/40"
          >
            Lihat semua produk
            <ArrowRight
              className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5"
              aria-hidden="true"
            />
          </Link>
        }
        right={
          products.length > 0 ? (
            <span>
              Total{' '}
              <strong className="font-sans font-bold tabular-nums text-[#1A1A1A]">
                {formatRupiah(totalRevenue)}
              </strong>
            </span>
          ) : null
        }
        className="mt-4"
      />
    </section>
  );
}
