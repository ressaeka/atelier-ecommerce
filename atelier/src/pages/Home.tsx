import { useEffect, useState } from 'react';

import AnnouncementBar from '../components/AnnouncementBar';
import Navbar from '../components/Navbar';
import HeroSection from '../components/HeroSection';
import BrandMarquee from '../components/BrandMarquee';
import CategorySection from '../components/CategorySection';
import ProductSection from '../components/ProductSection';
import Footer from '../components/Footer';

import { api } from '../lib/api';

import type {
  Product,
  Category,
  PaginationMeta,
} from '../types/api';

const PRODUCTS_PER_PAGE = 5;
const CATEGORIES_LIMIT = 50;

const Home: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);

  const [productPage, setProductPage] = useState(1);

  const [productMeta, setProductMeta] =
    useState<PaginationMeta | null>(null);

  const [loadingProducts, setLoadingProducts] =
    useState(true);

  const [loadingMoreProducts, setLoadingMoreProducts] =
    useState(false);

  /* =========================================================
     INITIAL DATA
  ========================================================== */

  useEffect(() => {
    let cancelled = false;

    const fetchInitialData = async () => {
      setLoadingProducts(true);

      try {
        const [
          productResponse,
          categoryResponse,
        ] = await Promise.all([
          api.get<{
            items: Product[];
            meta: PaginationMeta;
          }>('/product', {
            page: 1,
            limit: PRODUCTS_PER_PAGE,
          }),

          api.get<{
            items: Category[];
            meta: PaginationMeta;
          }>('/category', {
            page: 1,
            limit: CATEGORIES_LIMIT,
          }),
        ]);

        if (cancelled) {
          return;
        }

        setProducts(productResponse.items);

        setProductMeta(
          productResponse.meta,
        );

        setProductPage(1);

        setCategories(
          categoryResponse.items,
        );
      } catch {
        if (cancelled) {
          return;
        }

        setProducts([]);
        setCategories([]);
        setProductMeta(null);
      } finally {
        if (!cancelled) {
          setLoadingProducts(false);
        }
      }
    };

    fetchInitialData();

    return () => {
      cancelled = true;
    };
  }, []);

  /* =========================================================
     LOAD MORE PRODUCTS
  ========================================================== */

  const handleLoadMoreProducts = async () => {
    if (loadingMoreProducts) {
      return;
    }

    if (
      productMeta &&
      productPage >= productMeta.totalPages
    ) {
      return;
    }

    const nextPage = productPage + 1;

    setLoadingMoreProducts(true);

    try {
      const response = await api.get<{
        items: Product[];
        meta: PaginationMeta;
      }>('/product', {
        page: nextPage,
        limit: PRODUCTS_PER_PAGE,
      });

      setProducts((prevProducts) => [
        ...prevProducts,
        ...response.items,
      ]);

      setProductMeta(
        response.meta,
      );

      setProductPage(
        nextPage,
      );
    } catch {
      // Existing products remain visible.
    } finally {
      setLoadingMoreProducts(false);
    }
  };

  /* =========================================================
     HAS MORE PRODUCTS
  ========================================================== */

  const hasMoreProducts =
    productMeta !== null &&
    productPage < productMeta.totalPages;

  return (
    <div className="flex min-h-screen flex-col bg-[#FAF9F5]">
      <AnnouncementBar />

      <Navbar />

      <main
        id="main-content"
        className="flex-1"
      >
        {/* HERO */}
        <HeroSection />

        {/* ATELIER BRAND MARQUEE */}
        <BrandMarquee />

        {/* CATEGORIES */}
        <CategorySection
          categories={categories}
        />

        {/* PRODUCTS */}
        <ProductSection
          products={products}
          loading={loadingProducts}
          loadingMore={loadingMoreProducts}
          hasMore={hasMoreProducts}
          onLoadMore={
            handleLoadMoreProducts
          }
        />
      </main>

      <Footer />
    </div>
  );
};

export default Home;