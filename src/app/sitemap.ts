import type { MetadataRoute } from "next";
import { connectDB } from "@/lib/db";
import Product from "@/models/Product";

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000";

interface ProductSlug {
  slug: string;
  updatedAt?: Date;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const entries: MetadataRoute.Sitemap = [
    {
      url: BASE_URL,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1,
    },
  ];

  try {
    await connectDB();
    const products = (await Product.find()
      .select("slug updatedAt")
      .lean()) as ProductSlug[];

    for (const product of products) {
      entries.push({
        url: `${BASE_URL}/product/${product.slug}`,
        lastModified: product.updatedAt ?? new Date(),
        changeFrequency: "weekly",
        priority: 0.8,
      });
    }
  } catch (error) {
    console.error("Failed to generate product sitemap entries:", error);
  }

  return entries;
}