"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import Button from "@/components/ui/button";
import Pagination from "@/components/ui/pagination";

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

async function fetchCategories(page: number): Promise<FetchResult> {
    const response = await fetch(`/api/categories?page=${page}&limit=${PAGE_SIZE}`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
    });

    if (!response.ok) {
        throw new Error("Failed to fetch categories");
    }

    return response.json();
}

export default function CategoryManagement() {
    const [categories, setCategories] = useState<Category[]>([]);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalItems, setTotalItems] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        let cancelled = false;

        fetchCategories(page)
            .then((data) => {
                if (!cancelled) {
                    setCategories(data.categories);
                    setTotalPages(data.pagination.totalPages);
                    setTotalItems(data.pagination.totalItems);
                }
            })
            .catch((err: unknown) => {
                if (!cancelled) {
                    setError(
                        err instanceof Error ? err.message : "Error fetching categories"
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

        fetchCategories(page)
            .then((data) => {
                setCategories(data.categories);
                setTotalPages(data.pagination.totalPages);
                setTotalItems(data.pagination.totalItems);
            })
            .catch((err: unknown) =>
                setError(err instanceof Error ? err.message : "Error fetching categories")
            )
            .finally(() => setLoading(false));
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold">Category Management</h1>
                <div>
                    <span className="text-sm text-gray-500">
                        {totalItems} categor{totalItems === 1 ? "y" : "ies"}
                    </span>
                    <Link
                        href="/category-management/create"
                    >
                        <Button size="sm" variant="outline">Create Category</Button>
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
                    <p className="text-gray-500">Loading categories...</p>
                </div>
            ) : categories.length === 0 ? (
                <div className="rounded-lg border border-dashed border-foreground/20 py-16 text-center text-gray-500">
                    No categories yet.
                </div>
            ) : (
                <>
                    <div className="overflow-x-auto rounded-lg border border-foreground/10">
                        <table className="w-full text-left text-sm">
                            <thead className="border-b border-foreground/10 bg-foreground/5">
                                <tr>
                                    <th className="px-4 py-3 font-medium">Image</th>
                                    <th className="px-4 py-3 font-medium">Name</th>
                                    <th className="px-4 py-3 font-medium">Slug</th>
                                    <th className="px-4 py-3 font-medium">Description</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-foreground/10">
                                {categories.map((category) => (
                                    <tr key={category._id}>
                                        <td className="px-4 py-3">
                                            {category.image ? (
                                                <Image
                                                    src={category.image}
                                                    alt={category.name}
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
                                        <td className="px-4 py-3 font-medium">{category.name}</td>
                                        <td className="px-4 py-3 text-gray-600">{category.slug}</td>
                                        <td className="max-w-sm px-4 py-3 text-gray-600">
                                            {category.description || "—"}
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
        </div>
    );
}