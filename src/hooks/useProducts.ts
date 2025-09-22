import { useEffect, useState } from 'react';
import type { Product } from '../types';
import {
  getProducts,
  addProduct as addProductService,
  updateProduct as updateProductService,
  deleteProduct as deleteProductService,
} from '../services/products';
import { supabase } from '../lib/supabaseClient';
import type { RealtimePostgresChangesPayload } from '@supabase/supabase-js';

export const useProducts = (category?: string) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  async function fetchData() {
    setIsLoading(true);
    const data = await getProducts(category);
    setProducts(data);
    setIsLoading(false);
  }

  useEffect(() => {
    fetchData();

    // Set up fine-grained real-time updates for products table
    const channel = supabase
      .channel('products-changes')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'products' },
        (payload: RealtimePostgresChangesPayload<any>) => {
          const row = (payload as any).new;
          if (!row) return;
          if (!matchesCategory(category, row.category)) return;
          const product = mapRowToProduct(row);
          setProducts(prev => {
            // avoid duplicates if it already exists
            if (prev.some(p => p.id === String(row.id))) return prev;
            return [product, ...prev];
          });
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'products' },
        (payload: RealtimePostgresChangesPayload<any>) => {
          const row = (payload as any).new;
          if (!row) return;
          setProducts(prev => {
            const updated = mapRowToProduct(row);
            const exists = prev.some(p => p.id === String(row.id));
            let next = prev.map(p => (p.id === String(row.id) ? updated : p));
            // If product changed category and no longer matches, drop it
            if (!matchesCategory(category, row.category)) {
              next = next.filter(p => p.id !== String(row.id));
            } else if (!exists && matchesCategory(category, row.category)) {
              // If it wasn't in the list but now matches the filter, add it
              next = [updated, ...next];
            }
            return next;
          });
        }
      )
      .on(
        'postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'products' },
        (payload: RealtimePostgresChangesPayload<any>) => {
          const row = (payload as any).old;
          if (!row) return;
          setProducts(prev => prev.filter(p => p.id !== String(row.id)));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [category]);

  // Map a DB row into our Product type (mirror of services/products.ts mapping)
  function mapRowToProduct(row: any): Product {
    let specs: string[] | undefined = undefined;
    if (Array.isArray(row.specifications)) {
      specs = row.specifications as string[];
    } else if (typeof row.specifications === 'string') {
      try {
        const parsed = JSON.parse(row.specifications);
        if (Array.isArray(parsed)) specs = parsed;
      } catch {}
    }
  
    return {
      id: String(row.id),
      name: row.name ?? '',
      price: Number(row.price ?? 0),
      originalPrice: row.original_price ?? undefined,
      isPromo: !!row.is_promo,
      category: row.category ?? '',
      image: row.image ?? '',
      description: row.description ?? '',
      detailedDescription: row.detailed_description ?? undefined,
      specifications: specs,
      materials: row.materials ?? undefined,
      careInstructions: row.care_instructions ?? undefined,
      brand: row.brand ?? undefined,
      sku: row.sku ?? undefined,
      inStock: row.in_stock ?? true,
      featured: !!row.featured,
      reviews: [],
    };
  }
  
  function matchesCategory(category: string | undefined, rowCategory: string | null | undefined) {
    if (!category || category === 'ALL COLLECTIONS') return true;
    const a = (rowCategory || '').toLowerCase();
    const b = category.toLowerCase();
    return a === b; // keep same semantics as current ilike equality usage
  }

  const addProduct = async (product: Omit<Product, 'id'>) => {
    const result = await addProductService({
      name: product.name,
      brand: product.brand,
      sku: product.sku,
      category: product.category,
      price: product.price,
      isPromo: product.isPromo,
      description: product.description,
      detailedDescription: product.detailedDescription,
      materials: product.materials,
      specifications: product.specifications as any,
      careInstructions: product.careInstructions,
      featured: product.featured,
      inStock: product.inStock,
    } as any);

    if ((result as any)?.success && (result as any)?.product) {
      const row = (result as any).product;
      if (matchesCategory(category, row.category)) {
        const mapped = mapRowToProduct(row);
        setProducts(prev => [mapped, ...prev]);
      }
    } else {
      // Fallback to full refetch if we didn't get the row back
      await fetchData();
    }
    return result;
  };

  const updateProduct = async (id: string, updates: Partial<Product>) => {
    const result = await updateProductService(id, updates);
    if ((result as any)?.success && (result as any)?.product) {
      const row = (result as any).product;
      const mapped = mapRowToProduct(row);
      setProducts(prev => {
        let next = prev.map(p => (p.id === String(row.id) ? mapped : p));
        if (!matchesCategory(category, row.category)) {
          next = next.filter(p => p.id !== String(row.id));
        }
        return next;
      });
    } else {
      await fetchData();
    }
    return result;
  };

  const deleteProduct = async (id: string) => {
    const result = await deleteProductService(id);
    if ((result as any)?.success) {
      setProducts(prev => prev.filter(p => p.id !== String(id)));
    } else {
      await fetchData();
    }
    return result;
  };

  // Provide a compatibility alias for simple add flows that include an image file
  const addProductToList = async (input: {
    name: string;
    price: number;
    brand?: string;
    description?: string;
    imageFile?: File;
  }) => {
    const result = await addProductService({
      name: input.name,
      price: input.price,
      brand: input.brand,
      description: input.description,
      imageFile: input.imageFile,
    } as any);

    await fetchData();
    return result;
  };

  return { products, isLoading, loading: isLoading, addProduct, updateProduct, deleteProduct, addProductToList };
};