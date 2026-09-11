"use client";

import { useEffect, useState } from "react";
import ProductCart, { type ProductCardData } from "@/components/ProductCart";

async function fetchProducts(): Promise<ProductCardData[]> {
  const response = await fetch("/api/products", {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    throw new Error("Failed to fetch products");
  }

  const data = await response.json();
  return data.products;
}

export default function Home() {
  const [products, setProducts] = useState<ProductCardData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    fetchProducts()
      .then((data) => {
        if (!cancelled) setProducts(data);
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : "Failed to load products"
          );
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="mx-auto max-w-full px-4 py-10">
      <h1 className="mb-2 text-start text-lg font-bold">Our Perfumes</h1>

      {error && (
        <div className="rounded-lg bg-red-50 p-4 text-sm text-red-600">
          {error}
        </div>
      )}

      {loading ? (
        <p className="py-16 text-center text-gray-500">Loading products...</p>
      ) : products.length === 0 ? (
        <p className="py-16 text-center text-gray-500">No products yet.</p>
      ) : (
        <div className="grid grid-cols-2 gap-1 sm:grid-cols-2 lg:grid-cols-4">
          {products.map((product) => (
            <ProductCart key={product._id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
}