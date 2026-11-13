import Skeleton from "@/components/ui/skeleton";

export function ProductCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-none border border-foreground/10">
      <Skeleton className="aspect-square w-full" />
      <div className="space-y-3 p-4">
        <div className="space-y-1">
          <Skeleton className="h-3 w-16" />
          <Skeleton className="h-4 w-3/4" />
        </div>
        <div className="flex items-center justify-between">
          <Skeleton className="h-5 w-14" />
          <Skeleton className="h-4 w-20" />
        </div>
      </div>
    </div>
  );
}

export default function ProductGridSkeleton({
  count = 8,
}: {
  count?: number;
}) {
  return (
    <div className="grid grid-cols-2 gap-1 sm:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: count }, (_, i) => (
        <ProductCardSkeleton key={i} />
      ))}
    </div>
  );
}
