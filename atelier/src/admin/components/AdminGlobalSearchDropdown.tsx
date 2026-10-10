import { Loader2, Package, ShoppingCart, Users } from 'lucide-react';
import { formatPrice } from '../../lib/utils';
import type { GlobalSearchResults } from '../hooks/useAdminGlobalSearch';

interface Props {
  results: GlobalSearchResults;
  isLoading: boolean;
  error: string | null;
  debouncedQuery: string;
  highlightedIndex: number;
  onSelectProduct: (id: number, name: string) => void;
  onSelectOrder: (id: number) => void;
  onSelectCustomer: (id: number) => void;
}

export default function AdminGlobalSearchDropdown({
  results,
  isLoading,
  error,
  debouncedQuery,
  highlightedIndex,
  onSelectProduct,
  onSelectOrder,
  onSelectCustomer,
}: Props) {
  const flat: Array<{ key: string; type: 'product' | 'order' | 'customer' }> = [];
  results.products.forEach((p) => flat.push({ key: `p-${p.id}`, type: 'product' }));
  results.orders.forEach((o) => flat.push({ key: `o-${o.id}`, type: 'order' }));
  results.customers.forEach((c) => flat.push({ key: `c-${c.id}`, type: 'customer' }));

  const isHighlighted = (globalIdx: number) => globalIdx === highlightedIndex;

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 px-4 py-4 text-[12px] text-[#8A847B]">
        <Loader2 size={14} className="animate-spin" />
        Mencari &ldquo;{debouncedQuery}&rdquo;…
      </div>
    );
  }

  if (error) {
    return (
      <div className="px-4 py-4">
        <p className="text-[12px] font-medium text-[#A05050]">Gagal memuat pencarian.</p>
        <p className="mt-1 text-[11px] text-[#8A847B]">{error}</p>
      </div>
    );
  }

  const total = results.products.length + results.orders.length + results.customers.length;
  if (total === 0) {
    return (
      <div className="px-4 py-6 text-center">
        <p className="text-[12px] font-medium text-[#1A1A1A]">Tidak ada hasil</p>
        <p className="mt-1 text-[11px] text-[#8A847B]">Coba kata kunci lain untuk &ldquo;{debouncedQuery}&rdquo;.</p>
      </div>
    );
  }

  let globalCounter = -1;

  return (
    <div className="max-h-[64vh] overflow-y-auto py-2">
      {results.products.length > 0 && (
        <section>
          <p className="px-4 pb-1.5 pt-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#8A847B]">
            Produk · {results.products.length}
          </p>
          <ul>
            {results.products.map((p) => {
              globalCounter += 1;
              const active = isHighlighted(globalCounter);
              return (
                <li key={`p-${p.id}`}>
                  <button
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => onSelectProduct(p.id, p.name)}
                    className={`flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors ${active ? 'bg-[#EEF4F9]' : 'hover:bg-[#F7F5F0]'}`}
                  >
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-[#EDEAE3] bg-[#FAFAF8] text-[#A39E95]">
                      <Package size={13} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[12.5px] font-medium text-[#1A1A1A]">{p.name}</span>
                      <span className="block text-[11px] text-[#8A847B]">{formatPrice(p.price)} · Stok {p.stock}</span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      {results.orders.length > 0 && (
        <section className={results.products.length > 0 ? 'mt-2 border-t border-[#F0EDE7] pt-2' : ''}>
          <p className="px-4 pb-1.5 pt-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#8A847B]">
            Pesanan · {results.orders.length}
          </p>
          <ul>
            {results.orders.map((o) => {
              globalCounter += 1;
              const active = isHighlighted(globalCounter);
              return (
                <li key={`o-${o.id}`}>
                  <button
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => onSelectOrder(o.id)}
                    className={`flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors ${active ? 'bg-[#EEF4F9]' : 'hover:bg-[#F7F5F0]'}`}
                  >
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-[#EDEAE3] bg-[#FAFAF8] text-[#A39E95]">
                      <ShoppingCart size={13} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[12.5px] font-medium text-[#1A1A1A]">#ORD-{o.id} · {o.recipientName}</span>
                      <span className="block text-[11px] text-[#8A847B]">{formatPrice(o.total)} · {o.status}</span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      {results.customers.length > 0 && (
        <section className={results.products.length > 0 || results.orders.length > 0 ? 'mt-2 border-t border-[#F0EDE7] pt-2' : ''}>
          <p className="px-4 pb-1.5 pt-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#8A847B]">
            Pelanggan · {results.customers.length}
          </p>
          <ul>
            {results.customers.map((u) => {
              globalCounter += 1;
              const active = isHighlighted(globalCounter);
              return (
                <li key={`c-${u.id}`}>
                  <button
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => onSelectCustomer(u.id)}
                    className={`flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors ${active ? 'bg-[#EEF4F9]' : 'hover:bg-[#F7F5F0]'}`}
                  >
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#1A1A1A] text-[10px] font-semibold text-white">
                      {u.name.charAt(0).toUpperCase()}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[12.5px] font-medium text-[#1A1A1A]">{u.name}</span>
                      <span className="block truncate text-[11px] text-[#8A847B]">{u.email}</span>
                    </span>
                    <Users size={12} className="shrink-0 text-[#A39E95]" />
                  </button>
                </li>
              );
            })}
          </ul>
        </section>
      )}
    </div>
  );
}
