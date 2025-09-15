import { useEffect, useState } from 'react';
import type { Product } from '../types';
import {
  getProducts,
  addProduct as addProductService,
  updateProduct as updateProductService,
  deleteProduct as deleteProductService,
} from '../services/products';
import { supabase } from '../lib/supabaseClient';

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

    // Set up real-time updates for products table
    const channel = supabase
      .channel('products-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'products' },
        () => {
          fetchData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [category]);

  const addProduct = async (product: Omit<Product, 'id'>) => {
    // Note: service addProduct expects optional imageFile for uploads.
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
      // imageFile not available from this hook API; AdminAddProduct handles file uploads directly
    } as any);

    await fetchData();
    return result;
  };

  const updateProduct = async (id: string, updates: Partial<Product>) => {
    const result = await updateProductService(id, updates);
    await fetchData();
    return result;
  };

  const deleteProduct = async (id: string) => {
    const result = await deleteProductService(id);
    await fetchData();
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