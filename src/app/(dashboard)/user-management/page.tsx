"use client";

import { useState } from "react";
import Link from "next/link";
import { Users, UserRoundX, Plus, Pencil, Trash2 } from "lucide-react";
import Button from "@/components/ui/button";
import Dialog from "@/components/ui/dialog";
import Table, { type TableColumn } from "@/components/ui/table";
import { useFetch } from "@/hooks/useFetch";

const PAGE_SIZE = 10;

interface UserData {
  _id: string;
  name: string;
  email: string;
  role: "user" | "admin";
  provider: "credentials" | "google";
  avatar?: string;
  emailVerified?: boolean;
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
  users: UserData[];
  pagination: PaginationData;
}

function roleBadge(role: UserData["role"]) {
  const isAdmin = role === "admin";
  return {
    label: isAdmin ? "Admin" : "User",
    className: isAdmin
      ? "border border-foreground/15 bg-foreground/10 text-foreground"
      : "bg-foreground/5 text-foreground/60",
  };
}

function formatDate(value?: string) {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function UserManagementPage() {
  const [page, setPage] = useState(1);

  const { data, loading, error, refetch } = useFetch<FetchResult>(
    "/api/auth/users",
    {
      params: { page, limit: PAGE_SIZE },
    }
  );

  const users = data?.users ?? [];
  const totalPages = data?.pagination.totalPages ?? 1;
  const totalItems = data?.pagination.totalItems ?? 0;

  const changePage = (next: number) => {
    if (next === page) return;
    setPage(next);
  };

  const [deleteTarget, setDeleteTarget] = useState<UserData | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  const confirmDelete = (user: UserData) => {
    setDeleteError("");
    setDeleteTarget(user);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    setDeleteError("");

    try {
      const res = await fetch(`/api/auth/users/${deleteTarget._id}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
      });

      const responseData = await res.json();

      if (!res.ok) {
        setDeleteError(responseData.error || "Failed to delete user");
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

  const columns: TableColumn<UserData>[] = [
    {
      key: "user",
      header: "User",
      render: (user) => (
        <div className="flex items-center gap-3">
          {user.avatar ? (
            <img
              src={user.avatar}
              alt={user.name}
              className="h-11 w-11 shrink-0 rounded-full border border-foreground/10 object-cover"
            />
          ) : (
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-foreground/10 bg-foreground/5 text-xs font-semibold uppercase text-foreground/50">
              {user.name.charAt(0)}
            </div>
          )}
          <div className="min-w-0">
            <p className="max-w-[220px] truncate font-medium text-foreground">
              {user.name}
            </p>
            <p className="max-w-[220px] truncate text-xs text-foreground/50">
              {user.email}
            </p>
          </div>
        </div>
      ),
    },
    {
      key: "role",
      header: "Role",
      render: (user) => (
        <span
          className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${
            roleBadge(user.role).className
          }`}
        >
          {roleBadge(user.role).label}
        </span>
      ),
    },
    {
      key: "provider",
      header: "Provider",
      headerClassName: "hidden md:table-cell",
      className: "hidden md:table-cell",
      render: (user) => (
        <span className="inline-flex items-center gap-1.5 text-sm text-foreground/70">
          <span
            className={`h-1.5 w-1.5 rounded-full ${
              user.provider === "google" ? "bg-amber-400" : "bg-foreground/40"
            }`}
          />
          {user.provider === "google" ? "Google" : "Credentials"}
        </span>
      ),
    },
    {
      key: "verified",
      header: "Verified",
      headerClassName: "hidden md:table-cell",
      className: "hidden md:table-cell",
      render: (user) => (
        <span
          className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${
            user.emailVerified
              ? "bg-emerald-500/10 text-emerald-600"
              : "bg-amber-500/10 text-amber-600"
          }`}
        >
          {user.emailVerified ? "Verified" : "Pending"}
        </span>
      ),
    },
    {
      key: "joined",
      header: "Joined",
      headerClassName: "hidden lg:table-cell",
      className: "hidden lg:table-cell",
      render: (user) => (
        <span className="text-sm text-foreground/60">
          {formatDate(user.createdAt)}
        </span>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      headerClassName: "text-right",
      render: (user) => (
        <div className="flex items-center justify-end gap-1">
          <Link
            href={`/user-management/edit/${user._id}`}
            title={`Edit ${user.name}`}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-foreground/60 transition-colors hover:bg-foreground/5 hover:text-foreground"
          >
            <Pencil className="h-4 w-4" />
          </Link>
          <button
            type="button"
            onClick={() => confirmDelete(user)}
            title={`Delete ${user.name}`}
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
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3.5">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-foreground/10 bg-foreground/5">
            <Users className="h-5 w-5 text-foreground/80" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight sm:text-2xl">
              User Management
            </h1>
            <p className="text-sm text-foreground/60">
              Manage registered users
            </p>
          </div>
        </div>
        <Link href="/user-management/create">
          <Button size="md" className="gap-1.5">
            <Plus className="h-4 w-4" />
            Create User
          </Button>
        </Link>
      </div>

      <Table
        columns={columns}
        data={users}
        getRowKey={(user) => user._id}
        title="All Users"
        count={totalItems}
        loading={loading}
        skeletonRows={6}
        error={error}
        onRetry={() => refetch()}
        empty={{
          icon: <UserRoundX className="h-6 w-6 text-foreground/40" />,
          title: "No users yet",
          message: "Users will appear here once they register.",
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