import { useMemo } from 'react';
import { MapPin } from 'lucide-react';
import type { AnalyticsRegionalSales } from '../../types/analytics';
import {
  CardFooter,
  CardHeader,
  ProgressBar,
  RankBadge,
} from '../ui/AdminPrimitives';

interface AnalyticsRegionalSalesCardProps {
  regions: AnalyticsRegionalSales[];
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

export default function AnalyticsRegionalSalesCard({
  regions,
}: AnalyticsRegionalSalesCardProps) {
  const topRegions = useMemo<AnalyticsRegionalSales[]>(() => {
    if (regions.length <= 5) return regions;

    const rest = regions.slice(4);
    return [
      ...regions.slice(0, 4),
      {
        rank: 5,
        province: 'Lainnya',
        orders: rest.reduce((sum, item) => sum + item.orders, 0),
        revenue: rest.reduce((sum, item) => sum + item.revenue, 0),
        unitsSold: rest.reduce((sum, item) => sum + item.unitsSold, 0),
        percentageContribution:
          Math.round(
            rest.reduce((sum, item) => sum + item.percentageContribution, 0) *
              10,
          ) / 10,
      },
    ];
  }, [regions]);

  const totalOrders = useMemo(
    () => regions.reduce((sum, item) => sum + item.orders, 0),
    [regions],
  );

  return (
    <section
      aria-labelledby="regional-sales-title"
      className="flex h-full min-w-0 flex-col overflow-hidden rounded-2xl border border-[#ECE7DE] bg-white p-6 shadow-[0_1px_3px_rgba(26,22,18,0.04)]"
    >
      <CardHeader
        id="regional-sales-title"
        icon={MapPin}
        title="Penjualan per Wilayah"
        titleTo="/admin/reports/regions"
        scope="Periode aktif"
        subtitle={
          regions.length > 0
            ? `${numberFormatter.format(regions.length)} provinsi pada periode ini`
            : 'Belum ada data wilayah pada periode ini'
        }
      />

      {topRegions.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-[#ECE7DE] bg-[#FAF8F4] p-8 text-center">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#F4EFE8] text-[#9A7458]">
            <MapPin className="h-5 w-5" aria-hidden="true" />
          </div>
          <p className="text-[13.5px] font-semibold text-[#3F3B36]">
            Belum ada data pengiriman wilayah
          </p>
          <p className="max-w-[240px] text-[12.5px] leading-relaxed text-[#6F6A62]">
            Distribusi wilayah akan muncul di sini setelah ada pesanan pada
            periode ini.
          </p>
        </div>
      ) : (
        <div className="flex flex-1 flex-col">
          <ol className="-mx-2.5 flex flex-col gap-1">
            {topRegions.map((region) => {
              const isTop = region.rank === 1;

              return (
                <li
                  key={`${region.rank}-${region.province}`}
                  className={`rounded-[14px] px-2.5 py-2 transition-colors hover:bg-[#FAF8F4] ${
                    isTop ? 'bg-[#FAF8F4]' : ''
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <RankBadge rank={region.rank} />

                    <div
                      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[10px] border border-[#ECE7DE] bg-[#F4EFE8] text-[#5C4033]"
                      aria-hidden="true"
                    >
                      <MapPin className="h-[18px] w-[18px]" />
                    </div>

                    <div className="min-w-0 flex-1">
                      <p
                        className="text-[14px] font-semibold leading-snug text-[#1A1A1A]"
                        title={region.province}
                      >
                        {region.province}
                      </p>
                      <p className="mt-0.5 truncate font-sans text-[12px] tabular-nums text-[#6F6A62]">
                        <span>
                          {numberFormatter.format(region.orders)} pesanan
                        </span>
                        <span aria-hidden="true"> · </span>
                        <span className="font-medium text-[#3F3B36]">
                          {formatRupiah(region.revenue)}
                        </span>
                      </p>
                    </div>

                    <span
                      className={`shrink-0 font-sans text-[14px] font-bold tabular-nums ${
                        isTop ? 'text-[#5C4033]' : 'text-[#3F3B36]'
                      }`}
                    >
                      {formatPercent(region.percentageContribution)}
                    </span>
                  </div>

                  <ProgressBar
                    value={region.percentageContribution}
                    colorClass={isTop ? 'bg-[#5C4033]' : 'bg-[#C2A48A]'}
                    className="ml-9 mt-2"
                  />
                </li>
              );
            })}
          </ol>

          <p className="mt-3 flex items-start gap-2 text-[12px] leading-relaxed text-[#6F6A62]">
            <span
              className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-[#C2A48A]"
              aria-hidden="true"
            />
            {topRegions.length === 1
              ? 'Wilayah lain akan muncul di sini saat ada pesanan dari provinsi berbeda.'
              : 'Persentase menunjukkan kontribusi pendapatan tiap provinsi terhadap total penjualan periode ini.'}
          </p>
        </div>
      )}

      <CardFooter
        left="Total pesanan"
        right={
          <strong className="font-sans font-bold tabular-nums text-[#1A1A1A]">
            {numberFormatter.format(totalOrders)} pesanan
          </strong>
        }
        className="mt-4"
      />
    </section>
  );
}
