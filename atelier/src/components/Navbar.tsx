import React, {
  useEffect,
  useState,
  useRef,
  useCallback,
} from 'react';

import {
  Link,
  useLocation,
  useNavigate,
  useSearchParams,
} from 'react-router-dom';

import {
  ShoppingBag,
  Heart,
  Menu,
  X,
  Search,
} from 'lucide-react';

import { useCart } from '../contexts/CartContext';
import { useWishlist } from '../contexts/WishlistContext';
import ProfileDropdown from './ProfileDropdown';

import { api } from '../lib/api';

import {
  formatPrice,
  resolveImageUrl,
} from '../lib/utils';

import type {
  Product,
  PaginationMeta,
} from '../types/api';

interface NavbarProps {
  cartCount?: number;
  wishlistCount?: number;
}

const navLinks = [
  {
    label: 'BERANDA',
    href: '/',
  },
  {
    label: 'KATEGORI',
    href: '/catalog',
  },
  {
    label: 'PESANAN',
    href: '/orders',
  },
  {
    label: 'TENTANG KAMI',
    href: '/about',
  },
];

const Navbar: React.FC<NavbarProps> = ({
  wishlistCount,
}) => {
  const location = useLocation();
  const navigate = useNavigate();

  const [searchParams] = useSearchParams();

  const { itemCount } = useCart();

  const {
    count: favoriteCount,
  } = useWishlist();

  const badgeCount =
    wishlistCount ?? favoriteCount;

  const [scrolled, setScrolled] =
    useState(false);

  const [mobileOpen, setMobileOpen] =
    useState(false);

  const [searchValue, setSearchValue] =
    useState('');

  const [suggestions, setSuggestions] =
    useState<Product[]>([]);

  const [
    showSuggestions,
    setShowSuggestions,
  ] = useState(false);

  const [
    suggestionsLoading,
    setSuggestionsLoading,
  ] = useState(false);

  const searchTimerRef =
    useRef<ReturnType<typeof setTimeout> | null>(
      null,
    );

  const searchContainerRef =
    useRef<HTMLDivElement>(null);

  /* =========================================================
     SCROLL
  ========================================================== */

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 8);
    };

    window.addEventListener(
      'scroll',
      handleScroll,
      {
        passive: true,
      },
    );

    return () => {
      window.removeEventListener(
        'scroll',
        handleScroll,
      );
    };
  }, []);

  /* =========================================================
     CLOSE MOBILE MENU
  ========================================================== */

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  /* =========================================================
     SYNC SEARCH WITH URL
  ========================================================== */

  useEffect(() => {
    const urlSearch =
      searchParams.get('search') ?? '';

    setSearchValue(urlSearch);
  }, [searchParams]);

  /* =========================================================
     CLICK OUTSIDE
  ========================================================== */

  useEffect(() => {
    if (!showSuggestions) {
      return;
    }

    const handleClickOutside = (
      event: MouseEvent,
    ) => {
      if (
        searchContainerRef.current &&
        !searchContainerRef.current.contains(
          event.target as Node,
        )
      ) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener(
      'mousedown',
      handleClickOutside,
    );

    return () => {
      document.removeEventListener(
        'mousedown',
        handleClickOutside,
      );
    };
  }, [showSuggestions]);

  /* =========================================================
     CLEAR SEARCH TIMER
  ========================================================== */

  useEffect(() => {
    return () => {
      if (searchTimerRef.current) {
        clearTimeout(
          searchTimerRef.current,
        );
      }
    };
  }, []);

  /* =========================================================
     FETCH SUGGESTIONS
  ========================================================== */

  const fetchSuggestions =
    useCallback(
      async (query: string) => {
        if (searchTimerRef.current) {
          clearTimeout(
            searchTimerRef.current,
          );
        }

        setSuggestionsLoading(true);
        setSuggestions([]);
        setShowSuggestions(true);

        searchTimerRef.current =
          setTimeout(
            async () => {
              try {
                const result =
                  await api.get<{
                    items: Product[];
                    meta: PaginationMeta;
                  }>('/product', {
                    search: query,
                    page: 1,
                    limit: 5,
                  });

                setSuggestions(
                  result.items,
                );
              } catch {
                setSuggestions([]);
              } finally {
                setSuggestionsLoading(
                  false,
                );
              }
            },
            350,
          );
      },
      [],
    );

  /* =========================================================
     SEARCH CHANGE
  ========================================================== */

  const handleSearchChange = (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const value =
      event.target.value;

    setSearchValue(value);

    if (value.trim()) {
      fetchSuggestions(
        value.trim(),
      );

      return;
    }

    if (searchTimerRef.current) {
      clearTimeout(
        searchTimerRef.current,
      );
    }

    setSuggestions([]);
    setSuggestionsLoading(false);
    setShowSuggestions(false);
  };

  /* =========================================================
     SEARCH SUBMIT
  ========================================================== */

  const handleSearchSubmit = (
    event: React.FormEvent,
  ) => {
    event.preventDefault();

    if (searchTimerRef.current) {
      clearTimeout(
        searchTimerRef.current,
      );
    }

    setShowSuggestions(false);

    const keyword =
      searchValue.trim();

    if (!keyword) {
      navigate('/catalog');
      return;
    }

    navigate(
      `/catalog?search=${encodeURIComponent(
        keyword,
      )}`,
    );
  };

  /* =========================================================
     SUGGESTION CLICK
  ========================================================== */

  const handleSuggestionClick = (
    productId: number,
  ) => {
    if (searchTimerRef.current) {
      clearTimeout(
        searchTimerRef.current,
      );
    }

    setShowSuggestions(false);

    navigate(
      `/product/${productId}`,
    );
  };

  /* =========================================================
     VIEW ALL SEARCH RESULTS
  ========================================================== */

  const handleViewAllResults =
    () => {
      if (searchTimerRef.current) {
        clearTimeout(
          searchTimerRef.current,
        );
      }

      setShowSuggestions(false);

      const keyword =
        searchValue.trim();

      if (!keyword) {
        navigate('/catalog');
        return;
      }

      navigate(
        `/catalog?search=${encodeURIComponent(
          keyword,
        )}`,
      );
    };

  /* =========================================================
     MOBILE SEARCH
  ========================================================== */

  const handleMobileSearchSubmit = (
    event: React.FormEvent,
  ) => {
    event.preventDefault();

    setMobileOpen(false);
    setShowSuggestions(false);

    const keyword =
      searchValue.trim();

    if (!keyword) {
      navigate('/catalog');
      return;
    }

    navigate(
      `/catalog?search=${encodeURIComponent(
        keyword,
      )}`,
    );
  };

  return (
    <>
      {/* =====================================================
          MAIN NAVBAR
      ====================================================== */}

      <header
        className={`
          sticky
          top-0
          z-50
          w-full
          bg-[#FAF9F5]
          transition-all
          duration-300
          ${
            scrolled
              ? 'border-b border-stone-200/80 shadow-[0_1px_6px_rgba(0,0,0,0.035)]'
              : 'border-b border-stone-200/50'
          }
        `}
      >
        <div
          className="
            mx-auto
            grid
            h-[64px]
            max-w-[1400px]
            grid-cols-[auto_1fr_auto]
            items-center
            gap-5
            px-5
            sm:px-6
            lg:gap-6
            lg:px-12
          "
        >
          {/* =================================================
              LEFT
          ================================================== */}

          <div
            className="
              flex
              min-w-0
              items-center
              gap-7
              xl:gap-10
            "
          >
            {/* LOGO */}

            <Link
              to="/"
              aria-label="Atelier Home"
              className="
                flex
                shrink-0
                items-center
                gap-[2px]
              "
            >
              <span
                className="
                  font-editorial
                  text-[22px]
                  font-normal
                  tracking-[0.04em]
                  text-[#1A1A1A]
                "
                style={{
                  fontFamily:
                    "'Libre Bodoni', 'Playfair Display', Georgia, serif",
                }}
              >
                ATELIER
              </span>

              <span
                className="
                  mb-[10px]
                  ml-[1px]
                  h-[5px]
                  w-[5px]
                  shrink-0
                  rounded-full
                  bg-[#8B4513]
                "
              />
            </Link>

            {/* DESKTOP NAV */}

            <nav
              className="
                hidden
                items-center
                gap-5
                md:flex
                xl:gap-7
              "
            >
              {navLinks.map(
                (link) => {
                  const isActive =
                    location.pathname ===
                    link.href;

                  return (
                    <Link
                      key={link.href}
                      to={link.href}
                      className={`
                        group
                        relative
                        whitespace-nowrap
                        py-1
                        text-[10px]
                        font-medium
                        uppercase
                        tracking-[0.14em]
                        transition-colors
                        duration-200
                        ${
                          isActive
                            ? 'text-[#1A1A1A]'
                            : 'text-[#6B6B6B] hover:text-[#1A1A1A]'
                        }
                      `}
                    >
                      {link.label}

                      <span
                        className={`
                          absolute
                          bottom-[-1px]
                          left-0
                          h-px
                          bg-[#1A1A1A]
                          transition-all
                          duration-300
                          ${
                            isActive
                              ? 'w-full'
                              : 'w-0 group-hover:w-full'
                          }
                        `}
                      />
                    </Link>
                  );
                },
              )}
            </nav>
          </div>

          {/* =================================================
              CENTER SEARCH
          ================================================== */}

          <div
            ref={searchContainerRef}
            className="
              relative
              hidden
              w-full
              min-w-0
              max-w-[420px]
              justify-self-center
              lg:flex
              xl:max-w-[480px]
            "
          >
            <form
              onSubmit={
                handleSearchSubmit
              }
              className="relative w-full"
            >
              <Search
                size={15}
                strokeWidth={1.6}
                className="
                  pointer-events-none
                  absolute
                  left-3.5
                  top-1/2
                  -translate-y-1/2
                  text-[#AAA]
                "
              />

              <input
                type="search"
                value={searchValue}
                onChange={
                  handleSearchChange
                }
                onFocus={() => {
                  if (
                    searchValue.trim()
                  ) {
                    setShowSuggestions(
                      true,
                    );
                  }
                }}
                placeholder="Cari produk, kategori, atau koleksi..."
                autoComplete="off"
                className="
                  h-[38px]
                  w-full
                  rounded-full
                  border
                  border-stone-200
                  bg-white/70
                  pl-10
                  pr-4
                  text-[11px]
                  text-[#1A1A1A]
                  outline-none
                  placeholder:text-[#AAA]
                  transition-all
                  duration-200
                  focus:border-stone-400
                  focus:bg-white
                "
              />
            </form>

            {/* SUGGESTIONS */}

            {showSuggestions &&
              searchValue.trim() && (
                <div
                  className="
                    absolute
                    left-0
                    right-0
                    top-[calc(100%+8px)]
                    z-[60]
                    overflow-hidden
                    border
                    border-stone-200
                    bg-white
                    shadow-[0_12px_30px_rgba(0,0,0,0.08)]
                  "
                >
                  {suggestionsLoading && (
                    <div className="space-y-2 px-4 py-4">
                      <div className="h-2 w-1/3 animate-pulse bg-stone-100" />
                      <div className="h-2 w-1/2 animate-pulse bg-stone-100" />
                      <div className="h-2 w-2/5 animate-pulse bg-stone-100" />
                    </div>
                  )}

                  {!suggestionsLoading &&
                    suggestions.length > 0 && (
                      <>
                        {suggestions.map(
                          (product) => (
                            <button
                              key={
                                product.id
                              }
                              type="button"
                              onMouseDown={(
                                event,
                              ) => {
                                event.preventDefault();

                                handleSuggestionClick(
                                  product.id,
                                );
                              }}
                              className="
                                flex
                                w-full
                                items-center
                                gap-3
                                px-4
                                py-3
                                text-left
                                transition-colors
                                hover:bg-[#F8F7F4]
                              "
                            >
                              <div
                                className="
                                  h-10
                                  w-10
                                  shrink-0
                                  overflow-hidden
                                  bg-stone-100
                                "
                              >
                                <img
                                  src={resolveImageUrl(
                                    product.image,
                                    80,
                                    80,
                                    product.name,
                                  )}
                                  alt={
                                    product.name
                                  }
                                  className="
                                    h-full
                                    w-full
                                    object-cover
                                  "
                                  loading="lazy"
                                />
                              </div>

                              <div className="min-w-0 flex-1">
                                <p className="truncate text-[11px] text-[#1A1A1A]">
                                  {
                                    product.name
                                  }
                                </p>

                                <p className="mt-0.5 text-[10px] text-[#999]">
                                  {formatPrice(
                                    product.price,
                                  )}
                                </p>
                              </div>
                            </button>
                          ),
                        )}

                        <button
                          type="button"
                          onMouseDown={(
                            event,
                          ) => {
                            event.preventDefault();

                            handleViewAllResults();
                          }}
                          className="
                            w-full
                            border-t
                            border-stone-100
                            px-4
                            py-3
                            text-center
                            text-[10px]
                            font-medium
                            tracking-wide
                            text-[#777]
                            transition-colors
                            hover:bg-[#F8F7F4]
                            hover:text-[#1A1A1A]
                          "
                        >
                          Lihat semua hasil untuk &ldquo;
                          {searchValue.trim()}
                          &rdquo;
                        </button>
                      </>
                    )}

                  {!suggestionsLoading &&
                    suggestions.length === 0 && (
                      <div className="px-4 py-5 text-center">
                        <p className="text-[11px] text-[#AAA]">
                          Tidak ada produk ditemukan
                        </p>

                        <button
                          type="button"
                          onMouseDown={(
                            event,
                          ) => {
                            event.preventDefault();

                            handleViewAllResults();
                          }}
                          className="
                            mt-2
                            text-[10px]
                            font-medium
                            text-[#777]
                            transition-colors
                            hover:text-[#1A1A1A]
                          "
                        >
                          Cari di kategori
                        </button>
                      </div>
                    )}
                </div>
              )}
          </div>

          {/* =================================================
              RIGHT ACTIONS
          ================================================== */}

          <div
            className="
              flex
              shrink-0
              items-center
              justify-end
            "
          >
            {/* CART */}

            <Link
              to="/cart"
              aria-label="Keranjang belanja"
              className="
                relative
                flex
                h-10
                w-10
                items-center
                justify-center
                text-[#1A1A1A]
                transition-colors
                duration-200
                hover:text-[#6B6B6B]
              "
            >
              <ShoppingBag
                size={19}
                strokeWidth={1.5}
              />

              {itemCount > 0 && (
                <span
                  className="
                    absolute
                    right-[4px]
                    top-[4px]
                    flex
                    h-[14px]
                    min-w-[14px]
                    items-center
                    justify-center
                    rounded-full
                    bg-[#1A1A1A]
                    px-1
                    text-[7px]
                    font-semibold
                    leading-none
                    text-white
                  "
                >
                  {itemCount}
                </span>
              )}
            </Link>

            {/* WISHLIST */}

            <Link
              to="/wishlist"
              aria-label="Wishlist"
              className="
                relative
                flex
                h-10
                w-10
                items-center
                justify-center
                text-[#1A1A1A]
                transition-colors
                duration-200
                hover:text-[#6B6B6B]
              "
            >
              <Heart
                size={19}
                strokeWidth={1.5}
              />

              {badgeCount > 0 && (
                <span
                  className="
                    absolute
                    right-[4px]
                    top-[4px]
                    flex
                    h-[14px]
                    min-w-[14px]
                    items-center
                    justify-center
                    rounded-full
                    bg-[#1A1A1A]
                    px-1
                    text-[7px]
                    font-semibold
                    leading-none
                    text-white
                  "
                >
                  {badgeCount}
                </span>
              )}
            </Link>

            {/* PROFILE */}

            <ProfileDropdown />

            {/* MOBILE MENU */}

            <button
              type="button"
              onClick={() =>
                setMobileOpen(
                  (prev) => !prev,
                )
              }
              aria-label={
                mobileOpen
                  ? 'Tutup menu navigasi'
                  : 'Buka menu navigasi'
              }
              aria-expanded={
                mobileOpen
              }
              className="
                ml-1
                flex
                h-10
                w-10
                items-center
                justify-center
                text-[#1A1A1A]
                transition-colors
                hover:text-[#6B6B6B]
                md:hidden
              "
            >
              {mobileOpen ? (
                <X
                  size={20}
                  strokeWidth={1.5}
                />
              ) : (
                <Menu
                  size={20}
                  strokeWidth={1.5}
                />
              )}
            </button>
          </div>
        </div>
      </header>

      {/* =========================================================
          MOBILE MENU
      ========================================================== */}

      <div
        className={`
          fixed
          inset-0
          z-40
          transition-all
          duration-300
          md:hidden
          ${
            mobileOpen
              ? 'pointer-events-auto opacity-100'
              : 'pointer-events-none opacity-0'
          }
        `}
      >
        {/* BACKDROP */}

        <div
          className="
            absolute
            inset-0
            bg-black/25
            backdrop-blur-[2px]
          "
          onClick={() =>
            setMobileOpen(false)
          }
          aria-hidden="true"
        />

        {/* DRAWER */}

        <aside
          className={`
            absolute
            right-0
            top-0
            flex
            h-full
            w-[280px]
            flex-col
            bg-[#FAF9F5]
            transition-transform
            duration-300
            ease-out
            ${
              mobileOpen
                ? 'translate-x-0'
                : 'translate-x-full'
            }
          `}
        >
          {/* HEADER */}

          <div
            className="
              flex
              h-[60px]
              items-center
              justify-between
              border-b
              border-stone-200/60
              px-6
            "
          >
            <Link
              to="/"
              className="
                font-editorial
                text-[18px]
                tracking-[0.04em]
                text-[#1A1A1A]
              "
              style={{
                fontFamily:
                  "'Libre Bodoni', 'Playfair Display', Georgia, serif",
              }}
            >
              ATELIER
            </Link>

            <button
              type="button"
              onClick={() =>
                setMobileOpen(false)
              }
              aria-label="Tutup menu"
              className="
                flex
                h-8
                w-8
                items-center
                justify-center
                text-[#6B6B6B]
                transition-colors
                hover:text-[#1A1A1A]
              "
            >
              <X
                size={19}
                strokeWidth={1.5}
              />
            </button>
          </div>

          {/* SEARCH */}

          <div
            className="
              border-b
              border-stone-200/50
              px-6
              pb-4
              pt-5
            "
          >
            <form
              onSubmit={
                handleMobileSearchSubmit
              }
              className="relative"
            >
              <Search
                size={14}
                strokeWidth={1.7}
                className="
                  pointer-events-none
                  absolute
                  left-3
                  top-1/2
                  -translate-y-1/2
                  text-[#AAA]
                "
              />

              <input
                type="search"
                value={searchValue}
                onChange={
                  handleSearchChange
                }
                placeholder="Cari produk, kategori, koleksi..."
                autoComplete="off"
                className="
                  h-[38px]
                  w-full
                  rounded-full
                  border
                  border-stone-200
                  bg-white/70
                  pl-9
                  pr-4
                  text-[11px]
                  text-[#1A1A1A]
                  outline-none
                  placeholder:text-[#AAA]
                  focus:border-stone-400
                  focus:bg-white
                "
              />
            </form>
          </div>

          {/* NAVIGATION */}

          <nav className="flex flex-col px-6 pt-6">
            {navLinks.map(
              (link) => {
                const isActive =
                  location.pathname ===
                  link.href;

                return (
                  <Link
                    key={link.href}
                    to={link.href}
                    className={`
                      border-b
                      border-stone-200/50
                      py-4
                      text-[11px]
                      font-medium
                      uppercase
                      tracking-[0.15em]
                      transition-colors
                      ${
                        isActive
                          ? 'text-[#1A1A1A]'
                          : 'text-[#6B6B6B] hover:text-[#1A1A1A]'
                      }
                    `}
                  >
                    {link.label}
                  </Link>
                );
              },
            )}
          </nav>

          {/* QUICK ACTIONS */}

          <div
            className="
              mt-auto
              border-t
              border-stone-200/60
              px-6
              pb-8
              pt-6
            "
          >
            <div className="flex flex-col gap-4">
              <Link
                to="/cart"
                className="
                  flex
                  items-center
                  gap-3
                  text-[10px]
                  font-medium
                  uppercase
                  tracking-[0.13em]
                  text-[#6B6B6B]
                  transition-colors
                  hover:text-[#1A1A1A]
                "
              >
                <ShoppingBag
                  size={16}
                  strokeWidth={1.5}
                />

                <span>
                  KERANJANG

                  {itemCount > 0 && (
                    <span className="ml-1 text-[#999]">
                      ({itemCount})
                    </span>
                  )}
                </span>
              </Link>

              <Link
                to="/wishlist"
                className="
                  flex
                  items-center
                  gap-3
                  text-[10px]
                  font-medium
                  uppercase
                  tracking-[0.13em]
                  text-[#6B6B6B]
                  transition-colors
                  hover:text-[#1A1A1A]
                "
              >
                <Heart
                  size={16}
                  strokeWidth={1.5}
                />

                <span>
                  WISHLIST

                  {badgeCount > 0 && (
                    <span className="ml-1 text-[#999]">
                      ({badgeCount})
                    </span>
                  )}
                </span>
              </Link>
            </div>
          </div>
        </aside>
      </div>
    </>
  );
};

export default Navbar;