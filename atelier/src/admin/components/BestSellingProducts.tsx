import { Link } from 'react-router-dom';

import { resolveImageUrl } from '../../lib/utils';

import type { AdminBestSellingProduct } from '../data/adminDashboardMockData';

interface BestSellingProductsProps {
  products: AdminBestSellingProduct[];
}

export default function BestSellingProducts({
  products,
}: BestSellingProductsProps) {
  return (
    <section className="flex flex-col rounded-2xl border border-[#E8E4DC] bg-white p-5 shadow-[0_1px_2px_rgba(26,26,26,0.03)] sm:p-6">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-editorial text-[18px] font-medium tracking-tight text-[#1A1A1A]">
          Produk Terlaris
        </h2>

        <Link
          to="/admin/products"
          className="text-[11px] font-semibold uppercase tracking-[0.1em] text-[#4A7BA8] transition-colors hover:text-[#2F5D86]"
        >
          Lihat Semua
        </Link>
      </div>

      <ol className="space-y-2.5">
        {products.length === 0 && (
          <li className="rounded-xl border border-dashed border-[#E8E4DC] bg-[#FCFBF9] px-4 py-8 text-center text-[12px] text-[#8A847B]">
            Belum ada produk terlaris pada periode ini.
          </li>
        )}

        {products.map((product) => (
          <li
            key={product.rank}
            className="flex items-center gap-3 rounded-xl border border-[#F0EDE7] bg-[#FCFBF9] p-2.5 transition-colors hover:border-[#D9E3EC] hover:bg-white"
          >
            <span className="w-5 shrink-0 text-center font-editorial text-[13px] font-semibold text-[#8A847B]">
              {product.rank}
            </span>

            <div className="h-11 w-11 shrink-0 overflow-hidden rounded-lg bg-[#ECEAE4]">
              <img
                src={resolveImageUrl(product.image, 88, 88, product.name)}
                alt={product.name}
                className="h-full w-full object-cover"
                loading="lazy"
              />
            </div>

            <div className="min-w-0 flex-1">
              <p className="truncate text-[13px] font-medium text-[#1A1A1A]">
                {product.name}
              </p>

              <p className="mt-0.5 text-[11px] text-[#8A847B]">
                {product.sold} terjual
              </p>
            </div>
          </li>
        ))}
</ol>
    </section>
  );
}