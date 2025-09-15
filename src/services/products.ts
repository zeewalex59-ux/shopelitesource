import { supabase } from "../lib/supabaseClient";
import type { Product } from "../types";

export async function addProduct(product: {
  name: string;
  brand?: string;
  sku?: string;
  category?: string;
  price: number;
  isPromo?: boolean;
  description?: string;
  detailedDescription?: string;
  materials?: string;
  specifications?: string | string[];
  careInstructions?: string;
  featured?: boolean;
  inStock?: boolean;
  imageFile?: File;
}) {
  try {
    let imageUrl: string | null = null;

    // 1. Upload image if file exists
    if (product.imageFile) {
      const ext = product.imageFile.name.split(".").pop();
      const fileName = `${Date.now()}.${ext}`;

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("product-images")
        .upload(fileName, product.imageFile);

      if (uploadError) throw uploadError;

      const { data: publicUrl } = supabase.storage
        .from("product-images")
        .getPublicUrl(uploadData.path);

      imageUrl = publicUrl.publicUrl;
    }

    // Normalize specifications to array if it's a JSON string
    let specifications: string[] | null = null;
    if (Array.isArray(product.specifications)) {
      specifications = product.specifications;
    } else if (typeof product.specifications === "string" && product.specifications.trim().length > 0) {
      try {
        const parsed = JSON.parse(product.specifications);
        if (Array.isArray(parsed)) specifications = parsed;
      } catch {
        // keep null if parsing fails
      }
    }

    // 2. Insert into DB and return inserted row
    const { data, error } = await supabase
      .from("products")
      .insert([
        {
          name: product.name,
          brand: product.brand,
          sku: product.sku,
          category: product.category,
          price: product.price,
          is_promo: product.isPromo,
          description: product.description,
          detailed_description: product.detailedDescription,
          materials: product.materials,
          specifications: specifications ?? null,
          care_instructions: product.careInstructions,
          featured: product.featured,
          in_stock: product.inStock,
          image: imageUrl,
        },
      ])
      .select()
      .single();

    if (error) throw error;

    return { success: true, product: data };
  } catch (err) {
    console.error("Error adding product:", err);
    return { success: false, error: err };
  }
}

// Map frontend Product partial updates to DB columns
function mapProductUpdates(updates: Partial<Product>): Record<string, any> {
  const mapped: Record<string, any> = {};

  if (updates.name !== undefined) mapped.name = updates.name;
  if (updates.brand !== undefined) mapped.brand = updates.brand;
  if (updates.sku !== undefined) mapped.sku = updates.sku;
  if (updates.category !== undefined) mapped.category = updates.category;
  if (updates.price !== undefined) mapped.price = updates.price;
  if (updates.originalPrice !== undefined) mapped.original_price = updates.originalPrice;
  if (updates.isPromo !== undefined) mapped.is_promo = updates.isPromo;
  if (updates.description !== undefined) mapped.description = updates.description;
  if (updates.detailedDescription !== undefined) mapped.detailed_description = updates.detailedDescription;
  if (updates.materials !== undefined) mapped.materials = updates.materials;
  if (updates.specifications !== undefined) mapped.specifications = updates.specifications;
  if (updates.careInstructions !== undefined) mapped.care_instructions = updates.careInstructions;
  if (updates.featured !== undefined) mapped.featured = updates.featured;
  if (updates.inStock !== undefined) mapped.in_stock = updates.inStock;
  if (updates.image !== undefined) mapped.image = updates.image;

  return mapped;
}

export async function updateProduct(id: string | number, updates: Partial<Product>) {
  try {
    const mapped = mapProductUpdates(updates);
    const { data, error } = await supabase
      .from("products")
      .update(mapped)
      .eq("id", id)
      .select()
      .single();
    if (error) throw error;
    return { success: true, product: data };
  } catch (err) {
    console.error("Error updating product:", err);
    return { success: false, error: err };
  }
}

export async function deleteProduct(id: string | number) {
  try {
    const { error } = await supabase.from("products").delete().eq("id", id);
    if (error) throw error;
    return { success: true };
  } catch (err) {
    console.error("Error deleting product:", err);
    return { success: false, error: err };
  }
}

// Fetch products from Supabase and map to the frontend Product type
export async function getProducts(category?: string): Promise<Product[]> {
  let query = supabase
    .from("products")
    .select("*")
    .order("created_at", { ascending: false });

  // Apply category filter if provided and not the catch-all option
  if (category && category !== "ALL COLLECTIONS") {
    query = query.ilike("category", category);
  }
  
  const { data, error } = await query;

  if (error) {
    console.error("Error fetching products:", error.message);
    return [];
  }

  const rows = data || [];
  return rows.map((row: any) => {
    let specs: string[] | undefined = undefined;
    if (Array.isArray(row.specifications)) {
      specs = row.specifications as string[];
    } else if (typeof row.specifications === "string") {
      try {
        const parsed = JSON.parse(row.specifications);
        if (Array.isArray(parsed)) specs = parsed;
      } catch {}
    }

    const p: Product = {
      id: String(row.id),
      name: row.name ?? "",
      price: Number(row.price ?? 0),
      originalPrice: row.original_price ?? undefined,
      isPromo: !!row.is_promo,
      category: row.category ?? "",
      image: row.image ?? "",
      description: row.description ?? "",
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

    return p;
  });
}