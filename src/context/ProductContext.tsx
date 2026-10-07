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
};

type ProductContextType = {
  products: Product[];
  categories: string[];
  loading: boolean;
  refreshProducts: (force?: boolean) => Promise<void>;
  resetProductFetch: () => void;
};

const defaultCats = ['All', ...Array.from(new Set(MOCK_PRODUCTS.map(m => m.category)))];

const ProductContext = createContext<ProductContextType>({
  products: MOCK_PRODUCTS,
  categories: defaultCats,
  loading: true,
  refreshProducts: async () => {},
  resetProductFetch: () => {},
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
interface DummyJsonProduct {
  id: number;
  title: string;
  price: number;
  description: string;
  category: string;
  thumbnail: string;
  images?: string[];
  rating?: number;
}

// Inside refreshProducts(), after fetching JSON:
const resp = await fetch('https://dummyjson.com/products?limit=100');
if (!resp.ok) throw new Error('Network response was not ok');
const { products: rawProducts }: { products: DummyJsonProduct[] } = await resp.json();

// Map DummyJSON fields to our internal Product shape
const mapped: Product[] = rawProducts.map((p) => ({
  id: p.id,
  name: p.title,
  category: p.category,
  price: Number(p.price) ?? 0,
  description: p.description ?? '',
  image: p.thumbnail ?? (p.images && p.images[0]) ?? '',
  rating: Number(p.rating?.toFixed(1) ?? 4.3),
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

  

  const value = useMemo(
    () => ({ products, categories, loading, refreshProducts, resetProductFetch }),
    [products, categories, loading, refreshProducts, resetProductFetch],
  );

  return (
    <ProductContext.Provider value={value}>
      {children}
    </ProductContext.Provider>
  );
}

export const useGlobalProducts = () => useContext(ProductContext);
