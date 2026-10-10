import React, { createContext, useContext, useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { MOCK_PRODUCTS } from '../data/mockProducts';

type ApiProduct = {
  id: number;
  title: string;
  price: number;
  description: string;
  category: any;
  images?: string[];
  image?: string;
};

type Product = {
  id: number;
  name: string;
  category: string;
  price: number;
  description: string;
  image: string;
  rating?: number;
  reviews?: Array<{ id?: number; rating: number; comment: string; reviewerName?: string }>;
};

type ProductContextType = {
  products: Product[];
  categories: string[];
  loading: boolean;
  refreshProducts: (force?: boolean) => Promise<void>;
  resetProductFetch: () => void;
  /**
   * Load a page of products (skip & limit) and append to the current list.
   * Used for infinite‑scroll pagination.
   */
  loadMoreProducts: (page: number, limit: number) => Promise<void>;
};

const defaultCats = ['All', ...Array.from(new Set(MOCK_PRODUCTS.map(m => m.category)))];

const ProductContext = createContext<ProductContextType>({
  products: MOCK_PRODUCTS,
  categories: defaultCats,
  loading: true,
  refreshProducts: async () => {},
  resetProductFetch: () => {},
  loadMoreProducts: async (page: number, limit: number) => {},
});

export function ProductProvider({ children }: { children: React.ReactNode }) {
  const [products, setProducts] = useState<Product[]>(MOCK_PRODUCTS);
  const [categories, setCategories] = useState<string[]>(defaultCats);
  const [loading, setLoading] = useState<boolean>(true);
  const fetchedRef = useRef(false);

  const resetProductFetch = useCallback(() => {
    fetchedRef.current = false;
    setLoading(true);
  }, []);

  const refreshProducts = useCallback(async (force = false) => {
    if (fetchedRef.current && !force) return;
    fetchedRef.current = true;
    setLoading(true);

    // Create a fixed minimum 1.2s delay promise
    // const minDelay = new Promise(res => setTimeout(() => res(null), 1200));

    try {
      const fetchPromise = (async () => {
// ---------- DummyJSON Types (top‑level) ----------
// ---------- DummyJSON Types (top‑level) ----------
interface DummyJsonProduct {
  id: number;
  title: string;
  price: number;
  description: string;
  category: string;
  thumbnail: string;
  images?: string[];
  rating?: number;
  // New: reviews array embedded in product
  reviews?: Array<{
    rating: number;
    comment: string;
    reviewerName?: string;
    // other fields ignored
  }>;
}

// Extend internal Product type to include optional reviews
type Product = {
  id: number;
  name: string;
  category: string;
  price: number;
  description: string;
  image: string;
  rating?: number;
  reviews?: Array<{ id?: number; rating: number; comment: string; reviewerName?: string }>;
};

// Inside refreshProducts(), after fetching JSON:
const resp = await fetch('https://dummyjson.com/products?limit=100');
if (!resp.ok) throw new Error('Network response was not ok');
const { products: rawProducts }: { products: DummyJsonProduct[] } = await resp.json();

// Map DummyJSON fields to our internal Product shape, including reviews
const mapped: Product[] = rawProducts.map((p) => ({
  id: p.id,
  name: p.title,
  category: p.category,
  price: Number(p.price) ?? 0,
  description: p.description ?? '',
  image: p.thumbnail ?? (p.images && p.images[0]) ?? '',
  rating: Number(p.rating?.toFixed(1) ?? 4.3),
  reviews: p.reviews?.map((r, idx) => ({
    id: idx,
    rating: r.rating,
    comment: r.comment,
    reviewerName: r.reviewerName,
  })),
}));

        if (mapped.length > 0) {
          setProducts(mapped);
          const cats = Array.from(new Set(mapped.map(m => m.category)));
          setCategories(['All', ...cats]);
        }
      })();

      // Wait for both the API call
      await fetchPromise;
    } catch {
     
      setProducts(MOCK_PRODUCTS);
      setCategories(defaultCats);
    } finally {
      setLoading(false);
    }
  }, []);

  

  const loadMoreProducts = useCallback(async (page: number, limit: number) => {
    // Prevent duplicate loads while already loading
    if (loading) return;
    setLoading(true);
    const skip = page * limit;
    try {
      const resp = await fetch(`https://dummyjson.com/products?skip=${skip}&limit=${limit}`);
      if (!resp.ok) throw new Error('Network error');
      const { products: rawProducts }: { products: any[] } = await resp.json();
      const mapped: Product[] = rawProducts.map(p => ({
        id: p.id,
        name: p.title,
        category: p.category,
        price: Number(p.price) ?? 0,
        description: p.description ?? '',
        image: p.thumbnail ?? (p.images && p.images[0]) ?? '',
        rating: Number(p.rating?.toFixed(1) ?? 4.3),
        reviews: p.reviews?.map((r: { rating: number; comment: string; reviewerName?: string }, idx: number) => ({
          id: idx,
          rating: r.rating,
          comment: r.comment,
          reviewerName: r.reviewerName,
        })),
      }));
      setProducts(prev => [...prev, ...mapped]);
      // Merge new categories
      const newCats = Array.from(new Set([...categories, ...mapped.map(m => m.category)]));
      setCategories(['All', ...newCats]);
    } catch (e) {
      // ignore errors for pagination
    } finally {
      setLoading(false);
    }
  }, [loading, categories]);

  const value = useMemo(
    () => ({
      products,
      categories,
      loading,
      refreshProducts,
      resetProductFetch,
      loadMoreProducts,
    }),
    [products, categories, loading, refreshProducts, resetProductFetch, loadMoreProducts],
  );

  return (
    <ProductContext.Provider value={value}>
      {children}
    </ProductContext.Provider>
  );
}

export const useGlobalProducts = () => useContext(ProductContext);
