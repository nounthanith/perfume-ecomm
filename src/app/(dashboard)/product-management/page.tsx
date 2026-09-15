"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Package, Plus, Pencil, Trash2, PackageX } from "lucide-react";
import Button from "@/components/ui/button";
import Dialog from "@/components/ui/dialog";
import Table, { type TableColumn } from "@/components/ui/table";
import { useFetch } from "@/hooks/useFetch";

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

function stockBadge(stock: number) {
  if (stock <= 0) {
    return {
      label: "Out of stock",
      className: "bg-red-500/10 text-red-600",
    };
  }
  if (stock <= 5) {
    return {
      label: `${stock}`,
      className: "bg-amber-500/10 text-amber-600",
    };
  }
  return {
    label: `${stock}`,
    className: "bg-emerald-500/10 text-emerald-600",
  };
}

export default function ProductManagement() {
  const [page, setPage] = useState(1);

  const { data, loading, error, refetch } = useFetch<FetchResult>(
    "/api/products",
    {
      params: { page, limit: PAGE_SIZE },
    }
  );

  const products = data?.products ?? [];
  const totalPages = data?.pagination.totalPages ?? 1;
  const totalItems = data?.pagination.totalItems ?? 0;

  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  const changePage = (next: number) => {
    if (next === page) return;
    setPage(next);
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

      const responseData = await res.json();

      if (!res.ok) {
        setDeleteError(responseData.error || "Failed to delete product");
        return;
      }

      setDeleteTarget(null);
      await refetch();
    } catch {
      setDeleteError("Something went wrong. Please try again.");
    } finally {
      setDeleting(false);
    }
  };

  const columns: TableColumn<Product>[] = [
    {
      key: "product",
      header: "Product",
      render: (product) => (
        <div className="flex items-center gap-3">
          {product.images[0] ? (
            <Image
              src={product.images[0]}
              alt={product.name}
              width={44}
              height={44}
              className="h-11 w-11 shrink-0 rounded-lg border border-foreground/10 object-cover"
            />
          ) : (
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-foreground/10 bg-foreground/5 text-[10px] font-medium uppercase text-foreground/40">
              N/A
            </div>
          )}
          <div className="min-w-0">
            <p className="max-w-55 truncate font-medium text-foreground">
              {product.name}
            </p>
            <p className="max-w-55 truncate text-xs text-foreground/50">
              {product.slug}
            </p>
          </div>
        </div>
      ),
    },
    {
      key: "category",
      header: "Category",
      headerClassName: "hidden md:table-cell",
      className: "hidden md:table-cell",
      render: (product) => {
        const name =
          typeof product.category === "object" ? product.category.name : "—";
        return (
          <span className="inline-flex max-w-40 truncate rounded-full border border-foreground/10 bg-foreground/5 px-2.5 py-1 text-xs font-medium text-foreground/70">
            {name}
          </span>
        );
      },
    },
    {
      key: "price",
      header: "Price",
      render: (product) => (
        <span className="font-semibold text-foreground">
          ${product.price.toFixed(2)}
        </span>
      ),
    },
    {
      key: "stock",
      header: "Stock",
      render: (product) => (
        <span
          className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${
            stockBadge(product.stock).className
          }`}
        >
          {stockBadge(product.stock).label}
        </span>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      headerClassName: "text-right",
      render: (product) => (
        <div className="flex items-center justify-end gap-1">
          <Link
            href={`/product-management/edit/${product._id}`}
            title={`Edit ${product.name}`}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-foreground/60 transition-colors hover:bg-foreground/5 hover:text-foreground"
          >
            <Pencil className="h-4 w-4" />
          </Link>
          <button
            type="button"
            onClick={() => confirmDelete(product)}
            title={`Delete ${product.name}`}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-foreground/60 transition-colors hover:bg-red-500/10 hover:text-red-600"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3.5">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-foreground/10 bg-foreground/5">
            <Package className="h-5 w-5 text-foreground/80" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight sm:text-2xl">
              Products
            </h1>
            <p className="text-sm text-foreground/60">
              Manage your store catalog
            </p>
          </div>
        </div>
        <Link href="/product-management/create">
          <Button size="md" className="gap-1.5">
            <Plus className="h-4 w-4" />
            Create Product
          </Button>
        </Link>
      </div>

      <Table
        columns={columns}
        data={products}
        getRowKey={(product) => product._id}
        title="All Products"
        count={totalItems}
        loading={loading}
        skeletonRows={6}
        error={error}
        onRetry={() => refetch()}
        empty={{
          icon: <PackageX className="h-6 w-6 text-foreground/40" />,
          title: "No products yet",
          message: "Create your first product to get started.",
          action: (
            <Link href="/product-management/create">
              <Button size="sm" variant="outline" className="gap-1.5">
                <Plus className="h-4 w-4" />
                Create Product
              </Button>
            </Link>
          ),
        }}
        pagination={{
          page,
          totalPages,
          totalItems,
          limit: PAGE_SIZE,
          onPageChange: changePage,
          isLoading: loading,
        }}
      />

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
          <div className="mb-4 rounded-lg border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-600">
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
            variant="danger"
            type="button"
            loading={deleting}
            onClick={handleDelete}
            className="gap-1.5"
          >
            <Trash2 className="h-3.5 w-3.5" />
            {deleting ? "Deleting..." : "Delete"}
          </Button>
        </div>
      </Dialog>
    </div>
  );
}