import type { CategoryOption } from "./types";

interface CategoryChipsProps {
  categories: CategoryOption[];
  loading: boolean;
  active: string | null;
  onSelect: (slug: string | null) => void;
}

export default function CategoryChips({
  categories,
  loading,
  active,
  onSelect,
}: CategoryChipsProps) {
  return (
    <div className="flex items-center gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      <button
        type="button"
        onClick={() => onSelect(null)}
        className={`shrink-0 rounded-full border px-4 py-2 text-sm font-medium transition-colors active:scale-95 ${
          active === null
            ? "border-foreground bg-foreground text-background shadow-sm"
            : "border-foreground/10 bg-background text-foreground/70 hover:border-foreground/30 hover:text-foreground"
        }`}
      >
        All
      </button>

      {loading
        ? Array.from({ length: 4 }, (_, i) => (
            <div
              key={i}
              className="h-10 w-24 shrink-0 animate-pulse rounded-full bg-foreground/10"
            />
          ))
        : categories.map((category) => (
            <button
              key={category._id}
              type="button"
              onClick={() => onSelect(category.slug)}
              className={`shrink-0 rounded-full border px-4 py-2 text-sm font-medium transition-colors active:scale-95 ${
                active === category.slug
                  ? "border-foreground bg-foreground text-background shadow-sm"
                  : "border-foreground/10 bg-background text-foreground/70 hover:border-foreground/30 hover:text-foreground"
              }`}
            >
              {category.name}
            </button>
          ))}
    </div>
  );
}