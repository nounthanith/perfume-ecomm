"use client";

import { useState } from "react";
import ProductCart, { type ProductCardData } from "@/components/ProductCart";
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

export default function Home() {
  const [page, setPage] = useState(1);

  const { data, loading, error } = useFetch<FetchResult>("/api/products", {
    params: { page, limit: PAGE_SIZE },
  });

  const products = data?.products ?? [];
  const totalPages = data?.pagination.totalPages ?? 1;
  const totalItems = data?.pagination.totalItems ?? 0;

  return (
    <div className="mx-auto max-w-full px-4 py-10">
      <h1 className="mb-2 text-start text-lg font-bold">Our Perfumes</h1>

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
              onPageChange={setPage}
              isLoading={loading}
            />
          </div>
        </>
      )}
    </div>
  );
}