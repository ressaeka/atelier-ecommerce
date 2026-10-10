import { useEffect, useRef, useState } from 'react';
import { Menu, Search, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import AdminAccountMenu from './AdminAccountMenu';
import AdminGlobalSearchDropdown from './AdminGlobalSearchDropdown';
import { useAdminGlobalSearch } from '../hooks/useAdminGlobalSearch';

interface AdminTopbarProps {
  onOpenMobileSidebar: () => void;
}

export default function AdminTopbar({ onOpenMobileSidebar }: AdminTopbarProps) {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const mobileContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const { results, isLoading, error, hasQuery, debouncedQuery } = useAdminGlobalSearch(query);
  const totalResults = results.products.length + results.orders.length + results.customers.length;
  const showDropdown = open && hasQuery && query.trim().length >= 2;

  useEffect(() => {
    if (query.trim().length >= 2) setOpen(true);
    else setOpen(false);
  }, [query]);

  useEffect(() => {
    setHighlightedIndex(-1);
  }, [debouncedQuery]);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      const target = e.target as Node;
      const inDesktop = containerRef.current?.contains(target);
      const inMobile = mobileContainerRef.current?.contains(target);
      if (!inDesktop && !inMobile) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false);
        inputRef.current?.blur();
      }
    };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const handleSelectProduct = (id: number) => {
    setOpen(false);
    setQuery('');
    navigate(`/product/${id}`);
  };

  const handleSelectOrder = () => {
    setOpen(false);
    setQuery('');
    navigate('/admin/orders');
  };

  const handleSelectCustomer = () => {
    setOpen(false);
    setQuery('');
    navigate('/admin/customers');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showDropdown) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIndex((prev) => Math.min(prev + 1, totalResults - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex((prev) => Math.max(prev - 1, -1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (highlightedIndex >= 0) {
        let idx = -1;
        for (const p of results.products) {
          idx += 1;
          if (idx === highlightedIndex) { handleSelectProduct(p.id); return; }
        }
        for (const _o of results.orders) {
          idx += 1;
          if (idx === highlightedIndex) { handleSelectOrder(); return; }
        }
        for (const _c of results.customers) {
          idx += 1;
          if (idx === highlightedIndex) { handleSelectCustomer(); return; }
        }
      } else if (totalResults > 0) {
        if (results.products[0]) handleSelectProduct(results.products[0].id);
        else if (results.orders[0]) handleSelectOrder();
        else if (results.customers[0]) handleSelectCustomer();
      }
    } else if (e.key === 'Escape') {
      setOpen(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (highlightedIndex >= 0) {
      const fakeEvent = { key: 'Enter', preventDefault: () => {} } as unknown as React.KeyboardEvent<HTMLInputElement>;
      handleKeyDown(fakeEvent);
      return;
    }
    if (hasQuery && totalResults > 0) {
      if (results.products[0]) handleSelectProduct(results.products[0].id);
      else if (results.orders[0]) handleSelectOrder();
      else handleSelectCustomer();
    }
  };

  const handleClear = () => {
    setQuery('');
    setOpen(false);
    inputRef.current?.focus();
  };

  return (
    <header className="sticky top-0 z-30 border-b border-[#EDEAE3] bg-white/90 backdrop-blur-md">
      <div className="flex h-[68px] items-center gap-3 px-4 sm:px-6 lg:px-8">
        <button
          type="button"
          onClick={onOpenMobileSidebar}
          className="rounded-lg border border-[#EDEAE3] p-2 text-[#1A1A1A] transition-colors hover:bg-[#F3F1EC] lg:hidden"
          aria-label="Buka menu sidebar"
        >
          <Menu size={18} />
        </button>

        <div ref={containerRef} className="relative hidden min-w-0 flex-1 sm:block lg:max-w-md">
          <form onSubmit={handleSubmit} role="search" className="relative">
            <Search size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[#A39E95]" />
            <input
              ref={inputRef}
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onFocus={() => { if (query.trim().length >= 2) setOpen(true); }}
              onKeyDown={handleKeyDown}
              placeholder="Search products, orders, customers..."
              aria-label="Search admin"
              aria-expanded={showDropdown}
              aria-controls="admin-global-search-list"
              autoComplete="off"
              className="h-10 w-full rounded-xl border border-[#EDEAE3] bg-[#FAFAF8] pl-10 pr-9 text-[13px] text-[#1A1A1A] placeholder:text-[#A39E95] transition-colors focus:border-[#B7C9D9] focus:bg-white focus:outline-none"
            />
            {query && (
              <button
                type="button"
                onClick={handleClear}
                aria-label="Clear search"
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-1 text-[#A39E95] hover:bg-[#F3F1EC] hover:text-[#1A1A1A]"
              >
                <X size={14} />
              </button>
            )}
          </form>

          {showDropdown && (
            <div
              id="admin-global-search-list"
              role="listbox"
              className="absolute left-0 right-0 top-[calc(100%+8px)] z-50 overflow-hidden rounded-2xl border border-[#EDEAE3] bg-white shadow-xl"
            >
              <AdminGlobalSearchDropdown
                results={results}
                isLoading={isLoading}
                error={error}
                debouncedQuery={debouncedQuery}
                highlightedIndex={highlightedIndex}
                onSelectProduct={handleSelectProduct}
                onSelectOrder={handleSelectOrder}
                onSelectCustomer={handleSelectCustomer}
              />
            </div>
          )}
        </div>

        <div className="ml-auto flex items-center gap-2 sm:gap-3">
          <AdminAccountMenu variant="topbar" />
        </div>
      </div>

      <div ref={mobileContainerRef} className="border-t border-[#F0EDE7] px-4 pb-3 pt-2 sm:hidden">
        <form onSubmit={handleSubmit} role="search" className="relative">
          <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#A39E95]" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => { if (query.trim().length >= 2) setOpen(true); }}
            onKeyDown={handleKeyDown}
            placeholder="Search products, orders, customers..."
            aria-label="Search admin"
            autoComplete="off"
            className="h-9 w-full rounded-xl border border-[#EDEAE3] bg-[#FAFAF8] pl-9 pr-8 text-[13px] text-[#1A1A1A] placeholder:text-[#A39E95] focus:border-[#B7C9D9] focus:bg-white focus:outline-none"
          />
          {query && (
            <button type="button" onClick={handleClear} aria-label="Clear search" className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-1 text-[#A39E95]">
              <X size={14} />
            </button>
          )}
        </form>
        {showDropdown && (
          <div className="mt-2 overflow-hidden rounded-2xl border border-[#EDEAE3] bg-white shadow-xl">
            <AdminGlobalSearchDropdown
              results={results}
              isLoading={isLoading}
              error={error}
              debouncedQuery={debouncedQuery}
              highlightedIndex={highlightedIndex}
              onSelectProduct={handleSelectProduct}
              onSelectOrder={handleSelectOrder}
              onSelectCustomer={handleSelectCustomer}
            />
          </div>
        )}
      </div>
    </header>
  );
}
