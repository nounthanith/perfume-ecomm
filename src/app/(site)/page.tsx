"use client";

import { Suspense, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import ProductCart, { type ProductCardData } from "@/components/shared/ProductCart";
import CategoryFilter, { CategoryOption } from "@/components/shared/CategoryFilter";
import Pagination from "@/components/ui/pagination";
import Skeleton from "@/components/ui/skeleton";
import { useFetch } from "@/hooks/useFetch";

const PAGE_SIZE = 8;

interface PaginationData {
  page: number;
  totalPages: number;
  totalItems: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

interface FetchResult {
  products: ProductCardData[];
  pagination: PaginationData;
}

interface CategoriesResult {
  categories: CategoryOption[];
}

function ProductCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-none border border-foreground/10">
      <Skeleton className="aspect-square w-full" />
      <div className="space-y-3 p-4">
        <div className="space-y-1">
          <Skeleton className="h-3 w-16" />
          <Skeleton className="h-4 w-3/4" />
        </div>
        <div className="flex items-center justify-between">
          <Skeleton className="h-5 w-14" />
          <Skeleton className="h-4 w-20" />
        </div>
      </div>
    </div>
  );
}

function ProductGridSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-1 sm:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: PAGE_SIZE }, (_, i) => (
        <ProductCardSkeleton key={i} />
      ))}
    </div>
  );
}

function HomeContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const rawPage = Number(searchParams.get("page") ?? "1");
  const page = Number.isInteger(rawPage) && rawPage >= 1 ? rawPage : 1;
  const category = searchParams.get("category");

  const { data, loading, error } = useFetch<FetchResult>("/api/products", {
    params: {
      page,
      limit: PAGE_SIZE,
      ...(category ? { category } : {}),
    },
  });

  const { data: categoryData, loading: categoriesLoading } =
    useFetch<CategoriesResult>("/api/categories");

  const products = data?.products ?? [];
  const totalPages = data?.pagination.totalPages ?? 1;
  const totalItems = data?.pagination.totalItems ?? 0;

  const goToPage = useCallback(
    (next: number) => {
      const params = new URLSearchParams();
      if (category) params.set("category", category);
      if (next > 1) params.set("page", String(next));
      const qs = params.toString();
      router.replace(qs ? `/?${qs}` : "/", { scroll: false });
    },
    [router, category]
  );

  const goToCategory = useCallback(
    (slug: string | null) => {
      const params = new URLSearchParams();
      if (slug) params.set("category", slug);
      const qs = params.toString();
      router.replace(qs ? `/?${qs}` : "/", { scroll: false });
    },
    [router]
  );

  return (
    <>
      <CategoryFilter
        categories={categoryData?.categories ?? []}
        loading={categoriesLoading}
        active={category}
        onSelect={goToCategory}
      />

      {error && (
        <div className="rounded-lg bg-red-50 p-4 text-sm text-red-600">
          {error}
        </div>
      )}

      {loading ? (
        <ProductGridSkeleton />
      ) : products.length === 0 ? (
        <p className="py-16 text-center text-gray-500">No products yet.</p>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-1 sm:grid-cols-2 lg:grid-cols-4">
            {products.map((product) => (
              <ProductCart key={product._id} product={product} />
            ))}
          </div>

          <div className="mt-8">
            <Pagination
              page={page}
              totalPages={totalPages}
              totalItems={totalItems}
              limit={PAGE_SIZE}
              onPageChange={goToPage}
              isLoading={loading}
            />
          </div>
        </>
      )}
    </>
  );
}

export default function Home() {
  return (
    <div className="mx-auto max-w-full px-4 py-10">
      <h1 className="mb-2 text-start text-lg font-bold">Our Perfumes</h1>

      <Suspense fallback={<ProductGridSkeleton />}>
        <HomeContent />
      </Suspense>
    </div>
  );
}