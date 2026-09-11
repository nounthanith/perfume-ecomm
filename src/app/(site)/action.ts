"use server";

import type { Types } from "mongoose";
import { connectDB } from "@/lib/db";
import Product from "@/models/Product";
import "@/models/Category";

export interface HomeProduct {
  _id: string;
  name: string;
  slug: string;
  price: number;
  stock: number;
  images: string[];
  category: { _id: string; name: string; slug: string };
}

export async function getProducts(): Promise<HomeProduct[]> {
  await connectDB();

  const products = await Product.find()
    .populate("category", "name slug")
    .sort({ createdAt: -1 })
    .lean();

  return products.map((product) => {
    const rawCategory = product.category as
      | { _id: Types.ObjectId | string; name: string; slug: string }
      | Types.ObjectId
      | null
      | undefined;

    const category =
      rawCategory && typeof rawCategory === "object" && "name" in rawCategory
        ? {
            _id: String(rawCategory._id),
            name: String(rawCategory.name),
            slug: String(rawCategory.slug),
          }
        : { _id: "", name: "", slug: "" };

    return {
      _id: product._id.toString(),
      name: product.name,
      slug: product.slug,
      price: product.price,
      stock: product.stock,
      images: product.images ?? [],
      category,
    };
  });
}