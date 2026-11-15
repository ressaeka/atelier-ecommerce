import { useEffect, useMemo, useRef, useState } from 'react';
import { Cell, Pie, PieChart, ResponsiveContainer } from 'recharts';
import { PieChart as PieChartIcon } from 'lucide-react';
import type { AnalyticsCategoryPerformance } from '../../types/analytics';
import { CardFooter, CardHeader, ProgressBar } from '../ui/AdminPrimitives';

interface AnalyticsCategoryChartProps {
  categories: AnalyticsCategoryPerformance[];
}

const CATEGORY_COLORS = ['#5C4033', '#9A7458', '#C2A48A', '#DDBF9F'];
const OTHERS_COLOR = '#CFCAC2';
const MAX_VISIBLE = 5;

const percentFormatter = new Intl.NumberFormat('id-ID', {
  maximumFractionDigits: 1,
});
const numberFormatter = new Intl.NumberFormat('id-ID');

function formatRupiah(value: number): string {
  return `Rp ${numberFormatter.format(value)}`;
}

function formatPercent(value: number): string {
  return `${percentFormatter.format(value)}%`;
}

function getColor(item: AnalyticsCategoryPerformance, idx: number): string {
  return item.name === 'Lainnya' && item.categoryId === null
    ? OTHERS_COLOR
    : CATEGORY_COLORS[idx % CATEGORY_COLORS.length];
}

export default function AnalyticsCategoryChart({
  categories,
}: AnalyticsCategoryChartProps) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const bodyRef = useRef<HTMLDivElement>(null);
  const [isSideBySide, setIsSideBySide] = useState(true);

  useEffect(() => {
    const el = bodyRef.current;
    if (!el || typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setIsSideBySide(entry.contentRect.width >= 340);
      }
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const displayCategories = useMemo<AnalyticsCategoryPerformance[]>(() => {
    if (categories.length <= MAX_VISIBLE) return categories;

    const rest = categories.slice(MAX_VISIBLE - 1);
    return [
      ...categories.slice(0, MAX_VISIBLE - 1),
      {
        rank: MAX_VISIBLE,
        categoryId: null,
        name: 'Lainnya',
        revenue: rest.reduce((sum, item) => sum + item.revenue, 0),
        unitsSold: rest.reduce((sum, item) => sum + item.unitsSold, 0),
        percentageContribution:
          Math.round(
            rest.reduce((sum, item) => sum + item.percentageContribution, 0) *
              10,
          ) / 10,
      },
    ];
  }, [categories]);

  const totalRevenue = useMemo(
    () => categories.reduce((sum, item) => sum + item.revenue, 0),
    [categories],
  );

  const focused =
    activeIndex !== null
      ? displayCategories[activeIndex]
      : displayCategories[0];
  const isHovering = activeIndex !== null;

  const toggleActive = (idx: number) =>
    setActiveIndex((prev) => (prev === idx ? null : idx));

  return (
    <section
      aria-labelledby="category-chart-title"
      className="flex h-full min-w-0 flex-col overflow-hidden rounded-2xl border border-[#ECE7DE] bg-white p-6 shadow-[0_1px_3px_rgba(26,22,18,0.04)]"
    >
      <CardHeader
        id="category-chart-title"
        icon={PieChartIcon}
        title="Performa Kategori"
        scope="Periode aktif"
        subtitle={
          categories.length > 0
            ? `${numberFormatter.format(categories.length)} kategori aktif pada periode ini`
            : 'Belum ada kategori aktif pada periode ini'
        }
      />

      <div ref={bodyRef} className="flex flex-1 flex-col justify-center">
        {displayCategories.length === 0 || !focused ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-[#ECE7DE] bg-[#FAF8F4] p-8 text-center">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#F4EFE8] text-[#9A7458]">
              <PieChartIcon className="h-5 w-5" aria-hidden="true" />
            </div>
            <p className="text-[13.5px] font-semibold text-[#3F3B36]">
              Belum ada data kategori
            </p>
            <p className="max-w-[220px] text-[12.5px] leading-relaxed text-[#6F6A62]">
              Distribusi kategori akan muncul setelah ada penjualan pada periode
              ini.
            </p>
          </div>
        ) : (
          <div
            className={`flex flex-1 items-center justify-center gap-4 ${
              isSideBySide ? 'flex-row' : 'flex-col'
            }`}
          >
            {/* Donut chart — layout determined by ResizeObserver on card container */}
            <div
              className="relative h-[144px] w-[144px] shrink-0"
              role="img"
              aria-label={`Diagram donat performa kategori. Kategori teratas: ${displayCategories[0].name} ${formatPercent(displayCategories[0].percentageContribution)}`}
            >
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={displayCategories}
                    dataKey="percentageContribution"
                    nameKey="name"
                    innerRadius="64%"
                    outerRadius="95%"
                    paddingAngle={displayCategories.length > 1 ? 2 : 0}
                    stroke="none"
                    startAngle={90}
                    endAngle={-270}
                    animationDuration={400}
                    onMouseEnter={(_, idx) => setActiveIndex(idx)}
                    onMouseLeave={() => setActiveIndex(null)}
                    onClick={(_, idx) => toggleActive(idx)}
                  >
                    {displayCategories.map((entry, idx) => (
                      <Cell
                        key={`${entry.rank}-${entry.name}`}
                        fill={getColor(entry, idx)}
                        opacity={
                          activeIndex === null || activeIndex === idx ? 1 : 0.35
                        }
                        style={{
                          cursor: 'pointer',
                          outline: 'none',
                          transition: 'opacity 150ms ease',
                        }}
                      />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>

              {/* Center label */}
              <div
                className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center px-3 text-center"
                aria-live="polite"
              >
                <span className="font-sans text-[20px] font-bold leading-none tabular-nums text-[#1A1A1A]">
                  {formatPercent(focused.percentageContribution)}
                </span>
                <span
                  className="mt-1 max-w-[88px] truncate text-[11.5px] font-medium text-[#3F3B36]"
                  title={focused.name}
                >
                  {focused.name}
                </span>
                <span className="mt-0.5 text-[9.5px] font-semibold uppercase tracking-[0.12em] text-[#6F6A62]">
                  {isHovering ? 'Dipilih' : 'Teratas'}
                </span>
              </div>
            </div>

            {/* Legend */}
            <ul className="w-full min-w-0 flex-1 space-y-2">
              {displayCategories.map((cat, idx) => {
                const color = getColor(cat, idx);
                const isActive =
                  activeIndex === idx || (activeIndex === null && idx === 0);
                const isDimmed = activeIndex !== null && activeIndex !== idx;

                return (
                  <li key={`${cat.rank}-${cat.name}`}>
                    <button
                      type="button"
                      onMouseEnter={() => setActiveIndex(idx)}
                      onMouseLeave={() => setActiveIndex(null)}
                      onFocus={() => setActiveIndex(idx)}
                      onBlur={() => setActiveIndex(null)}
                      onClick={() => toggleActive(idx)}
                      aria-pressed={activeIndex === idx}
                      className={`group w-full rounded-[14px] px-3.5 py-2.5 text-left transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#5C4033]/40 ${
                        isActive ? 'bg-[#FAF8F4]' : 'hover:bg-[#FAF8F4]'
                      } ${isDimmed ? 'opacity-55' : 'opacity-100'}`}
                    >
                      <div className="flex items-center gap-2 text-[13.5px]">
                        <span
                          className="h-2.5 w-2.5 shrink-0 rounded-full"
                          style={{ backgroundColor: color }}
                          aria-hidden="true"
                        />
                        <span
                          className="min-w-0 flex-1 truncate font-semibold text-[#1A1A1A]"
                          title={cat.name}
                        >
                          {cat.name}
                        </span>
                        <span className="shrink-0 font-sans font-bold tabular-nums text-[#1A1A1A]">
                          {formatPercent(cat.percentageContribution)}
                        </span>
                      </div>

                      <ProgressBar
                        value={cat.percentageContribution}
                        colorHex={color}
                        className="mt-2"
                      />

                      <p className="mt-1.5 truncate font-sans text-[12px] tabular-nums text-[#6F6A62]">
                        <span className="font-medium text-[#3F3B36]">
                          {formatRupiah(cat.revenue)}
                        </span>
                        <span aria-hidden="true"> · </span>
                        <span>
                          {numberFormatter.format(cat.unitsSold)} terjual
                        </span>
                      </p>
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </div>

      <CardFooter
        left="Total pendapatan"
        right={
          <strong className="font-sans font-bold tabular-nums text-[#1A1A1A]">
            {formatRupiah(totalRevenue)}
          </strong>
        }
        className="mt-4"
      />
    </section>
  );
}
