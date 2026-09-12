"use client";

interface PaginationProps {
  page: number;
  totalPages: number;
  totalItems: number;
  limit: number;
  onPageChange: (page: number) => void;
  isLoading?: boolean;
}

function getPageList(current: number, totalPages: number, width = 5): number[] {
  const pages = new Set<number>();
  const start = Math.max(1, current - Math.floor(width / 2));
  const end = Math.min(totalPages, start + width - 1);
  for (let i = start; i <= end; i++) pages.add(i);
  return Array.from(pages).sort((a, b) => a - b);
}

export default function Pagination({
  page,
  totalPages,
  totalItems,
  limit,
  onPageChange,
  isLoading = false,
}: PaginationProps) {
  if (totalItems === 0 || totalPages <= 1) return null;

  const from = (page - 1) * limit + 1;
  const to = Math.min(page * limit, totalItems);

  return (
    <div className="flex flex-col items-center justify-between gap-3 sm:flex-row">
      <span className="text-sm text-gray-500">
        Showing {from}-{to} of {totalItems}
      </span>

      <div className="flex items-center gap-1">
        <button
          type="button"
          disabled={page <= 1 || isLoading}
          onClick={() => onPageChange(page - 1)}
          className="rounded-none border border-foreground/10 px-3 py-1.5 text-sm transition-colors hover:bg-foreground/5 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Prev
        </button>

        {getPageList(page, totalPages).map((p) => (
          <button
            key={p}
            type="button"
            disabled={isLoading}
            onClick={() => onPageChange(p)}
            className={`rounded-none px-3 py-1.5 text-sm transition-colors ${
              p === page
                ? "bg-foreground text-background"
                : "border border-foreground/10 hover:bg-foreground/5"
            }`}
          >
            {p}
          </button>
        ))}

        <button
          type="button"
          disabled={page >= totalPages || isLoading}
          onClick={() => onPageChange(page + 1)}
          className="rounded-none border border-foreground/10 px-3 py-1.5 text-sm transition-colors hover:bg-foreground/5 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Next
        </button>
      </div>
    </div>
  );
}