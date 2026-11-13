import Skeleton from "@/components/ui/skeleton";
import ProductGridSkeleton from "@/components/shared/ProductGridSkeleton";

export default function SiteLoading() {
  return (
    <div className="mx-auto max-w-full px-4 py-10">
      <Skeleton className="mb-4 h-6 w-40" />

      <div className="mb-2 flex flex-wrap items-center gap-2">
        {Array.from({ length: 4 }, (_, i) => (
          <Skeleton key={i} className="h-9 w-24" />
        ))}
      </div>

      <ProductGridSkeleton />
    </div>
  );
}
