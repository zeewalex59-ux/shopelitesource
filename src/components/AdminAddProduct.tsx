import React, { useState } from "react";
import { addProduct } from "../services/products";

export default function AdminAddProduct({ onSuccess }: { onSuccess?: () => void }) {
  const [name, setName] = useState("");
  const [brand, setBrand] = useState("");
  const [sku, setSku] = useState("");
  const [category, setCategory] = useState("WOMEN");
  const [price, setPrice] = useState("");
  const [materials, setMaterials] = useState("");
  const [description, setDescription] = useState("");
  const [detailedDescription, setDetailedDescription] = useState("");
  const [specifications, setSpecifications] = useState("");
  const [care, setCare] = useState("");
  const [isPromo, setIsPromo] = useState(false);
  const [featured, setFeatured] = useState(false);
  const [inStock, setInStock] = useState(true);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);

    const result = await addProduct({
      name,
      brand,
      sku,
      category,
      price: parseFloat(price),
      materials,
      description,
      detailedDescription,
      specifications,
      careInstructions: care,
      isPromo,
      featured,
      inStock,
      imageFile: imageFile || undefined,
    });

    setSubmitting(false);

    if ((result as any).success) {
      alert("✅ Product added!");
      // clear form
      setName("");
      setBrand("");
      setSku("");
      setCategory("WOMEN");
      setPrice("");
      setMaterials("");
      setDescription("");
      setDetailedDescription("");
      setSpecifications("");
      setCare("");
      setIsPromo(false);
      setFeatured(false);
      setInStock(true);
      setImageFile(null);
      onSuccess?.();
    } else {
      alert("❌ Failed to add product");
      console.error(result);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="p-4 space-y-3">
      <input
        type="text"
        placeholder="Name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        className="w-full rounded border border-gray-700 bg-gray-900 px-3 py-2"
        required
      />
      <input
        type="text"
        placeholder="Brand"
        value={brand}
        onChange={(e) => setBrand(e.target.value)}
        className="w-full rounded border border-gray-700 bg-gray-900 px-3 py-2"
      />
      <input
        type="text"
        placeholder="SKU"
        value={sku}
        onChange={(e) => setSku(e.target.value)}
        className="w-full rounded border border-gray-700 bg-gray-900 px-3 py-2"
      />
      {/* Category select */}
      <select
        value={category}
        onChange={(e) => setCategory(e.target.value)}
        className="w-full rounded border border-gray-700 bg-gray-900 px-3 py-2"
      >
        <option value="ALL COLLECTIONS">ALL COLLECTIONS</option>
        <option value="NEW ARRIVALS">NEW ARRIVALS</option>
        <option value="WOMEN">WOMEN</option>
        <option value="MEN">MEN</option>
        <option value="KIDS">KIDS</option>
        <option value="ACCESSORIES">ACCESSORIES</option>
        <option value="SALE">SALE</option>
      </select>
      <input
        type="number"
        step="0.01"
        placeholder="Price"
        value={price}
        onChange={(e) => setPrice(e.target.value)}
        className="w-full rounded border border-gray-700 bg-gray-900 px-3 py-2"
        required
      />
      <textarea
        placeholder="Materials"
        value={materials}
        onChange={(e) => setMaterials(e.target.value)}
        className="w-full rounded border border-gray-700 bg-gray-900 px-3 py-2"
      />
      <textarea
        placeholder="Short Description"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        className="w-full rounded border border-gray-700 bg-gray-900 px-3 py-2"
      />
      <textarea
        placeholder="Detailed Description"
        value={detailedDescription}
        onChange={(e) => setDetailedDescription(e.target.value)}
        className="w-full rounded border border-gray-700 bg-gray-900 px-3 py-2"
      />
      <textarea
        placeholder="Specifications"
        value={specifications}
        onChange={(e) => setSpecifications(e.target.value)}
        className="w-full rounded border border-gray-700 bg-gray-900 px-3 py-2"
      />
      <textarea
        placeholder="Care Instructions"
        value={care}
        onChange={(e) => setCare(e.target.value)}
        className="w-full rounded border border-gray-700 bg-gray-900 px-3 py-2"
      />

      <label className="flex items-center space-x-2">
        <input type="checkbox" checked={isPromo} onChange={(e) => setIsPromo(e.target.checked)} />
        <span>Promo</span>
      </label>
      <label className="flex items-center space-x-2">
        <input type="checkbox" checked={featured} onChange={(e) => setFeatured(e.target.checked)} />
        <span>Featured</span>
      </label>
      <label className="flex items-center space-x-2">
        <input type="checkbox" checked={inStock} onChange={(e) => setInStock(e.target.checked)} />
        <span>In Stock</span>
      </label>

      <input
        type="file"
        onChange={(e) => setImageFile(e.target.files?.[0] || null)}
        className="w-full"
        accept="image/*"
      />

      <button
        type="submit"
        disabled={submitting}
        className="bg-gold text-black font-bold px-6 py-3 rounded-xl hover:bg-yellow-400 disabled:opacity-50"
      >
        {submitting ? "Adding..." : "Add Product"}
      </button>
    </form>
  );
}