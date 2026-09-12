import type { ReactNode } from "react";
import Pagination from "@/components/ui/pagination";

export interface TableColumn<T> {
  key: string;
  header: string;
  /** Extra classes for the <th> (e.g. "hidden md:table-cell" or alignment) */
  headerClassName?: string;
  /** Extra classes for the <td> (e.g. "hidden md:table-cell") */
  className?: string;
  render: (item: T) => ReactNode;
}

interface TableProps<T> {
  columns: TableColumn<T>[];
  data: T[];
  getRowKey: (item: T) => string | number;
  title: string;
  /** When provided, renders the total-count chip in the toolbar */
  count?: number;
  loading?: boolean;
  skeletonRows?: number;
  error?: string | null;
  onRetry?: () => void;
  empty?: {
    icon?: ReactNode;
    title: string;
    message?: string;
    action?: ReactNode;
  };
  pagination?: {
    page: number;
    totalPages: number;
    totalItems: number;
    limit: number;
    onPageChange: (page: number) => void;
    isLoading?: boolean;
  };
}

function SkeletonRows({ rows }: { rows: number }) {
  return (
    <>
      {Array.from({ length: rows }, (_, index) => (
        <tr key={index} className="animate-pulse">
          <td colSpan={99}>
            <div className="flex items-center gap-4 px-5 py-4">
              <div className="h-11 w-11 shrink-0 rounded-lg bg-foreground/10" />
              <div className="flex-1 space-y-2">
                <div className="h-3.5 w-1/3 rounded bg-foreground/10" />
                <div className="h-3 w-1/4 rounded bg-foreground/[0.07]" />
              </div>
              <div className="hidden h-5 w-20 rounded-full bg-foreground/10 md:block" />
              <div className="h-4 w-12 rounded bg-foreground/10" />
            </div>
          </td>
        </tr>
      ))}
    </>
  );
}

export default function Table<T>({
  columns,
  data,
  getRowKey,
  title,
  count,
  loading = false,
  skeletonRows = 5,
  error,
  onRetry,
  empty,
  pagination,
}: TableProps<T>) {
  if (error) {
    return (
      <div className="flex items-center justify-between rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-600">
        <span>{error}</span>
        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            className="font-medium underline hover:opacity-70"
          >
            Retry
          </button>
        )}
      </div>
    );
  }

  if (loading && data.length === 0) {
    return (
      <div className="overflow-hidden rounded-2xl border border-foreground/10 bg-background">
        <div className="animate-pulse border-b border-foreground/10 px-5 py-4">
          <div className="h-4 w-32 rounded bg-foreground/10" />
        </div>
        <table className="w-full text-left text-sm">
          <tbody className="divide-y divide-foreground/[0.06]">
            <SkeletonRows rows={skeletonRows} />
          </tbody>
        </table>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-foreground/15 py-20 text-center">
        {empty?.icon && (
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-foreground/5">
            {empty.icon}
          </div>
        )}
        <div>
          <p className="font-medium text-foreground">{empty?.title}</p>
          {empty?.message && (
            <p className="mt-1 text-sm text-foreground/50">{empty.message}</p>
          )}
        </div>
        {empty?.action && <div className="mt-2">{empty.action}</div>}
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-foreground/10 bg-background shadow-sm">
      {/* Table toolbar */}
      <div className="flex items-center justify-between border-b border-foreground/10 bg-foreground/[0.02] px-5 py-3.5">
        <p className="text-sm font-medium text-foreground/80">{title}</p>
        {count !== undefined && (
          <span className="rounded-full border border-foreground/10 bg-foreground/5 px-2.5 py-0.5 text-xs text-foreground/60">
            {count} total
          </span>
        )}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-foreground/10 bg-foreground/5">
            <tr>
              {columns.map((column) => (
                <th
                  key={column.key}
                  className={`px-5 py-3 text-xs font-semibold uppercase tracking-wider text-foreground/50 ${
                    column.headerClassName ?? ""
                  }`}
                >
                  {column.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-foreground/[0.06]">
            {data.map((item) => (
              <tr
                key={getRowKey(item)}
                className="transition-colors hover:bg-foreground/[0.03]"
              >
                {columns.map((column) => (
                  <td
                    key={column.key}
                    className={`px-5 py-4 ${column.className ?? ""}`}
                  >
                    {column.render(item)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {pagination && (
        <div className="border-t border-foreground/10 px-5 py-3.5">
          <Pagination
            page={pagination.page}
            totalPages={pagination.totalPages}
            totalItems={pagination.totalItems}
            limit={pagination.limit}
            onPageChange={pagination.onPageChange}
            isLoading={pagination.isLoading}
          />
        </div>
      )}
    </div>
  );
}