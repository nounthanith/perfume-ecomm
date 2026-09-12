import type { Metadata } from "next";
import { cache } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { connectDB } from "@/lib/db";
import Product from "@/models/Product";
import "@/models/Category";
import ProductGallery from "@/components/ProductGallery";
import AddToCartButton from "@/components/AddToCartButton";

const BASE_URL =
  process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000";

interface ProductCategory {
  _id: string;
  name: string;
  slug: string;
}

export interface ProductDetail {
  _id: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  stock: number;
  images: string[];
  category: ProductCategory | string;
  updatedAt?: Date;
}

type Props = {
  params: Promise<{ slug: string }>;
};

const getProduct = cache(
  async (slug: string): Promise<ProductDetail | null> => {
    await connectDB();
    const doc = await Product.findOne({ slug })
      .populate("category", "name slug")
      .lean();
    if (!doc) return null;

    return {
      _id: String(doc._id),
      name: doc.name,
      slug: doc.slug,
      description: doc.description ?? "",
      price: doc.price,
      stock: doc.stock,
      images: doc.images ?? [],
      category: doc.category as unknown as ProductCategory | string,
      updatedAt: doc.updatedAt,
    };
  }
);

function categoryNameOf(category: ProductCategory | string | undefined) {
  return category && typeof category === "object" ? category.name : "";
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProduct(slug);

  if (!product) {
    return {
      title: "Product Not Found",
      description: "The product you are looking for could not be found.",
    };
  }

  const title = product.name;
  const description =
    (product.description || "").slice(0, 160) ||
    `${product.name} — premium perfume from G-Fragrance.`;
  const url = `${BASE_URL}/product/${product.slug}`;
  const images = product.images?.length ? product.images : [];
  const ogImage = images[0] ?? `${BASE_URL}/logo.png`;

  return {
    title,
    description,
    category: categoryNameOf(product.category) || undefined,
    alternates: {
      canonical: url,
    },
    openGraph: {
      title,
      description,
      url,
      siteName: "G-Fragrance",
      type: "website",
      images: [
        {
          url: ogImage,
          alt: product.name,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogImage],
    },
    robots: {
      index: true,
      follow: true,
    },
  };
}

export default async function ProductPage({ params }: Props) {
  const { slug } = await params;
  const product = await getProduct(slug);

  if (!product) notFound();

  const categoryName = categoryNameOf(product.category);
  const outOfStock = product.stock <= 0;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description || undefined,
    image: product.images?.length ? product.images : [BASE_URL + "/logo.png"],
    sku: product._id,
    brand: {
      "@type": "Brand",
      name: "G-Fragrance",
    },
    category: categoryName || undefined,
    offers: {
      "@type": "Offer",
      url: `${BASE_URL}/product/${product.slug}`,
      priceCurrency: "USD",
      price: product.price,
      availability: outOfStock
        ? "https://schema.org/OutOfStock"
        : "https://schema.org/InStock",
      itemCondition: "https://schema.org/NewCondition",
    },
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:py-12">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <nav className="mb-6 flex flex-wrap items-center gap-2 text-sm text-gray-500">
        <Link href="/" className="transition-colors hover:text-foreground">
          Home
        </Link>
        <span>/</span>
        {categoryName && (
          <>
            <span>{categoryName}</span>
            <span>/</span>
          </>
        )}
        <span className="text-foreground">{product.name}</span>
      </nav>

      <div className="grid gap-8 lg:grid-cols-2 lg:gap-12">
        <ProductGallery images={product.images} alt={product.name} />

        <div className="space-y-6">
          <div className="space-y-3">
            {categoryName && (
              <p className="text-xs uppercase tracking-wider text-gray-500">
                {categoryName}
              </p>
            )}
            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
              {product.name}
            </h1>
            <div className="flex items-center gap-4">
              <span className="text-2xl font-semibold">
                ${product.price.toFixed(2)}
              </span>
              <span
                className={`text-sm ${outOfStock ? "text-red-500" : "text-green-500"
                  }`}
              >
                {outOfStock
                  ? "Out of stock"
                  : `${product.stock} in stock`}
              </span>
            </div>
          </div>

          {product.description && (
            <div>
              <h2 className="mb-2 text-sm font-semibold uppercase tracking-wider text-gray-500">
                Description
              </h2>
              <p className="whitespace-pre-line leading-relaxed text-foreground/80">
                {product.description}
              </p>
            </div>
          )}

          {/* <AddToCartButton
            productId={product._id}
            name={product.name}
            price={product.price}
            image={product.images?.[0]}
            stock={product.stock}
          /> */}

          <div className="border-t border-foreground/10 pt-4 text-sm text-gray-500">
            <p>SKU: {product._id}</p>
          </div>
        </div>
      </div>
    </div>
  );
}