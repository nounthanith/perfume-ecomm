"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import Button from "@/components/ui/button";
import { useCart } from "@/context/CartContext";

interface ProductCategory {
  _id: string;
  name: string;
  slug: string;
}

export interface ProductCardData {
  _id: string;
  name: string;
  slug: string;
  price: number;
  stock: number;
  images: string[];
  category: ProductCategory | string;
}

export default function ProductCart({
  product,
}: {
  product: ProductCardData;
}) {
  const { addToCart } = useCart();
  const [added, setAdded] = useState(false);

  const categoryName =
    typeof product.category === "object" ? product.category.name : "—";

  const outOfStock = product.stock <= 0;

  const handleAdd = () => {
    addToCart({
      _id: product._id,
      name: product.name,
      price: product.price,
      image: product.images[0],
    });
    setAdded(true);
    window.setTimeout(() => setAdded(false), 1500);
  };

  return (
    <Link
      href={`/product/${product.slug}`}
      className="block overflow-hidden rounded-none border border-foreground/10 transition-shadow hover:shadow-md"
    >
      <div className="relative aspect-square w-full bg-foreground/5">
        {product.images[0] ? (
          <Image
            src={product.images[0]}
            alt={product.name}
            fill
            sizes="(max-width: 768px) 100vw, 25vw"
            className="object-cover"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-gray-500">
            No image
          </div>
        )}
      </div>

      <div className="space-y-3 p-4">
        <div className="space-y-1">
          <p className="text-xs text-gray-500">{categoryName}</p>
          <h2 className="font-medium">{product.name}</h2>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-lg font-semibold">
            ${product.price.toFixed(2)}
          </span>
          <span className="text-xs text-gray-500">
            {outOfStock ? "Out of stock" : `in stock`}
          </span>
        </div>

        {/* <Button
          type="button"
          className="w-full"
          disabled={outOfStock}
          onClick={handleAdd}
        >
          {outOfStock ? "Sold Out" : added ? "Added ✓" : "Add to Cart"}
        </Button> */}
      </div>
    </Link>
  );
}