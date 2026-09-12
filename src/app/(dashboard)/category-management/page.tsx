"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { FolderTree, Plus, Tags } from "lucide-react";
import Button from "@/components/ui/button";
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
    </div>
  );
}