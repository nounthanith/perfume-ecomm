"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import Button from "@/components/ui/button";
import Dialog from "@/components/ui/dialog";
import Pagination from "@/components/ui/pagination";

const PAGE_SIZE = 10;

interface ProductCategory {
  _id: string;
  name: string;
  slug: string;
}

interface Product {
  _id: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  stock: number;
  images: string[];
  category: ProductCategory | string;
  createdAt?: string;
}

interface PaginationData {
  page: number;
  totalPages: number;
  totalItems: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

interface FetchResult {
  products: Product[];
  pagination: PaginationData;
}

async function fetchProducts(page: number): Promise<FetchResult> {
  const response = await fetch(`/api/products?page=${page}&limit=${PAGE_SIZE}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    throw new Error("Failed to fetch products");
  }

  return response.json();
}

export default function ProductManagement() {
  const [products, setProducts] = useState<Product[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  useEffect(() => {
    let cancelled = false;

    fetchProducts(page)
      .then((data) => {
        if (!cancelled) {
          setProducts(data.products);
          setTotalPages(data.pagination.totalPages);
          setTotalItems(data.pagination.totalItems);
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : "Error fetching products"
          );
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [page]);

  const changePage = (next: number) => {
    if (next === page) return;
    setLoading(true);
    setError("");
    setPage(next);
  };

  const retry = () => {
    setLoading(true);
    setError("");

    fetchProducts(page)
      .then((data) => {
        setProducts(data.products);
        setTotalPages(data.pagination.totalPages);
        setTotalItems(data.pagination.totalItems);
      })
      .catch((err: unknown) =>
        setError(err instanceof Error ? err.message : "Error fetching products")
      )
      .finally(() => setLoading(false));
  };

  const refresh = async () => {
    const data = await fetchProducts(page);
    setProducts(data.products);
    setTotalPages(data.pagination.totalPages);
    setTotalItems(data.pagination.totalItems);
  };

  const confirmDelete = (product: Product) => {
    setDeleteError("");
    setDeleteTarget(product);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    setDeleteError("");

    try {
      const res = await fetch(`/api/products/${deleteTarget._id}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
      });

      const data = await res.json();

      if (!res.ok) {
        setDeleteError(data.error || "Failed to delete product");
        return;
      }

      setDeleteTarget(null);
      await refresh();
    } catch {
      setDeleteError("Something went wrong. Please try again.");
    } finally {
      setDeleting(false);
    }
  };

  const categoryName = (category: Product["category"]) =>
    typeof category === "object" ? category.name : "—";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className=" font-bold">Product Management</h1>
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-500">
            {totalItems} product{totalItems === 1 ? "" : "s"}
          </span>
          <Link href="/product-management/create">
            <Button size="sm" variant="outline">
              Create Product
            </Button>
          </Link>
        </div>
      </div>

      {error && (
        <div className="flex items-center justify-between rounded-lg bg-red-50 p-4 text-sm text-red-600">
          <span>{error}</span>
          <button
            type="button"
            onClick={retry}
            className="font-medium underline hover:opacity-70"
          >
            Retry
          </button>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <p className="text-gray-500">Loading products...</p>
        </div>
      ) : products.length === 0 ? (
        <div className="rounded-lg border border-dashed border-foreground/20 py-16 text-center text-gray-500">
          No products yet.
        </div>
      ) : (
        <>
          <div className="overflow-x-auto rounded-lg border border-foreground/10">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-foreground/10 bg-foreground/5">
                <tr>
                  <th className="px-4 py-3 font-medium">Image</th>
                  <th className="px-4 py-3 font-medium">Name</th>
                  <th className="px-4 py-3 font-medium">Category</th>
                  <th className="px-4 py-3 font-medium">Price</th>
                  <th className="px-4 py-3 font-medium">Stock</th>
                  <th className="px-4 py-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-foreground/10">
                {products.map((product) => (
                  <tr key={product._id}>
                    <td className="px-4 py-3">
                      {product.images[0] ? (
                        <Image
                          src={product.images[0]}
                          alt={product.name}
                          width={48}
                          height={48}
                          className="h-12 w-12 rounded-lg object-cover"
                        />
                      ) : (
                        <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-foreground/5 text-xs text-gray-500">
                          N/A
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 font-medium">{product.name}</td>
                    <td className="px-4 py-3 text-gray-600">
                      {categoryName(product.category)}
                    </td>
                    <td className="px-4 py-3">${product.price.toFixed(2)}</td>
                    <td className="px-4 py-3">{product.stock}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Link href={`/product-management/edit/${product._id}`}>
                          <Button size="sm" variant="outline">
                            Edit
                          </Button>
                        </Link>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => confirmDelete(product)}
                          className="border-red-500/40 text-red-500 hover:bg-red-50"
                        >
                          Delete
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <Pagination
            page={page}
            totalPages={totalPages}
            totalItems={totalItems}
            limit={PAGE_SIZE}
            onPageChange={changePage}
            isLoading={loading}
          />
        </>
      )}

      <Dialog
        open={!!deleteTarget}
        onClose={() => {
          if (!deleting) setDeleteTarget(null);
        }}
        title="Delete product"
      >
        <p className="mb-4 text-foreground/70">
          Are you sure you want to delete{" "}
          <span className="font-semibold text-foreground">
            {deleteTarget?.name}
          </span>
          ? This action cannot be undone.
        </p>

        {deleteError && (
          <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-600">
            {deleteError}
          </div>
        )}

        <div className="flex justify-end gap-2">
          <Button
            size="sm"
            variant="outline"
            type="button"
            onClick={() => setDeleteTarget(null)}
            disabled={deleting}
          >
            Cancel
          </Button>
          <Button
            size="sm"
            variant="primary"
            type="button"
            loading={deleting}
            onClick={handleDelete}
            className="bg-red-500 text-white hover:bg-red-600"
          >
            {deleting ? "Deleting..." : "Delete"}
          </Button>
        </div>
      </Dialog>
    </div>
  );
}