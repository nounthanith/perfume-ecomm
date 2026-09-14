import Skeleton from "@/components/ui/skeleton";

export interface CategoryOption {
  _id: string;
  name: string;
  slug: string;
}

interface CategoryFilterProps {
  categories: CategoryOption[];
  loading: boolean;
  active: string | null;
  onSelect: (slug: string | null) => void;
}

export default function CategoryFilter({
  categories,
  loading,
  active,
  onSelect,
}: CategoryFilterProps) {
  return (
    <div className="mb-6 flex flex-wrap items-center gap-2">
      <button
        type="button"
        onClick={() => onSelect(null)}
        className={`border px-4 py-2 text-sm font-medium transition-colors ${
          active === null
            ? "border-foreground bg-foreground text-background"
            : "border-foreground/10 text-foreground/70 hover:border-foreground hover:bg-foreground/5 hover:text-foreground"
        }`}
      >
        All
      </button>

      {loading ? (
        Array.from({ length: 3 }, (_, i) => (
          <div key={i} className="h-9 w-24">
            <Skeleton className="h-full w-full" />
          </div>
        ))
      ) : (
        categories.map((category) => (
          <button
            key={category._id}
            type="button"
            onClick={() => onSelect(category.slug)}
            className={`border px-4 py-2 text-sm font-medium transition-colors ${
              active === category.slug
                ? "border-foreground bg-foreground text-background"
                : "border-foreground/10 text-foreground/70 hover:border-foreground hover:bg-foreground/5 hover:text-foreground"
            }`}
          >
            {category.name}
          </button>
        ))
      )}
    </div>
  );
}