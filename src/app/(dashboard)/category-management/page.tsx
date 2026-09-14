"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { FolderTree, Plus, Pencil, Trash2, Tags } from "lucide-react";
import Button from "@/components/ui/button";
import Dialog from "@/components/ui/dialog";
import Table, { type TableColumn } from "@/components/ui/table";
import { useFetch } from "@/hooks/useFetch";

const PAGE_SIZE = 10;

interface Category {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  image?: string;
}

interface PaginationData {
  page: number;
  totalPages: number;
  totalItems: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

interface FetchResult {
  categories: Category[];
  pagination: PaginationData;
}

export default function CategoryManagement() {
  const [page, setPage] = useState(1);

  const { data, loading, error, refetch } = useFetch<FetchResult>(
    "/api/categories",
    {
      params: { page, limit: PAGE_SIZE },
    }
  );

  const categories = data?.categories ?? [];
  const totalPages = data?.pagination.totalPages ?? 1;
  const totalItems = data?.pagination.totalItems ?? 0;

  const changePage = (next: number) => {
    if (next === page) return;
    setPage(next);
  };

  const [deleteTarget, setDeleteTarget] = useState<Category | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  const confirmDelete = (category: Category) => {
    setDeleteError("");
    setDeleteTarget(category);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    setDeleteError("");

    try {
      const res = await fetch(`/api/categories/${deleteTarget._id}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
      });

      const responseData = await res.json();

      if (!res.ok) {
        setDeleteError(responseData.error || "Failed to delete category");
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

  const columns: TableColumn<Category>[] = [
    {
      key: "category",
      header: "Category",
      render: (category) => (
        <div className="flex items-center gap-3">
          {category.image ? (
            <Image
              src={category.image}
              alt={category.name}
              width={44}
              height={44}
              className="h-11 w-11 shrink-0 rounded-lg border border-foreground/10 object-cover"
            />
          ) : (
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-foreground/10 bg-foreground/5">
              <FolderTree className="h-5 w-5 text-foreground/40" />
            </div>
          )}
          <div className="min-w-0">
            <p className="truncate font-medium text-foreground">
              {category.name}
            </p>
            <p className="truncate text-xs text-foreground/50">
              /{category.slug}
            </p>
          </div>
        </div>
      ),
    },
    {
      key: "description",
      header: "Description",
      headerClassName: "hidden md:table-cell",
      className: "hidden max-w-md md:table-cell",
      render: (category) => (
        <p className="line-clamp-2 text-foreground/60">
          {category.description || "—"}
        </p>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      headerClassName: "text-right",
      render: (category) => (
        <div className="flex items-center justify-end gap-1">
          <Link
            href={`/category-management/edit/${category._id}`}
            title={`Edit ${category.name}`}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-foreground/60 transition-colors hover:bg-foreground/5 hover:text-foreground"
          >
            <Pencil className="h-4 w-4" />
          </Link>
          <button
            type="button"
            onClick={() => confirmDelete(category)}
            title={`Delete ${category.name}`}
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
            <FolderTree className="h-5 w-5 text-foreground/80" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight sm:text-2xl">
              Categories
            </h1>
            <p className="text-sm text-foreground/60">
              Organize your catalog by fragrance families
            </p>
          </div>
        </div>
        <Link href="/category-management/create">
          <Button size="md" className="gap-1.5">
            <Plus className="h-4 w-4" />
            Create Category
          </Button>
        </Link>
      </div>

      <Table
        columns={columns}
        data={categories}
        getRowKey={(category) => category._id}
        title="All Categories"
        count={totalItems}
        loading={loading}
        skeletonRows={5}
        error={error}
        onRetry={() => refetch()}
        empty={{
          icon: <Tags className="h-6 w-6 text-foreground/40" />,
          title: "No categories yet",
          message: "Create your first category to get started.",
          action: (
            <Link href="/category-management/create">
              <Button size="sm" variant="outline" className="gap-1.5">
                <Plus className="h-4 w-4" />
                Create Category
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
        title="Delete category"
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