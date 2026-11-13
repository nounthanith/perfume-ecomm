import Skeleton from "@/components/ui/skeleton";

export default function Loading() {
    return (
        <div className="min-h-screen bg-background">
            <div className="mx-auto w-full max-w-full px-4 py-10 sm:px-6">
                <div className="flex items-center gap-3">
                    <Skeleton className="h-11 w-11 shrink-0" />
                    <div className="space-y-2">
                        <Skeleton className="h-6 w-48 max-w-full" />
                        <Skeleton className="h-4 w-72 max-w-full" />
                    </div>
                </div>

                <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    {Array.from({ length: 4 }, (_, i) => (
                        <Skeleton key={i} className="h-28" />
                    ))}
                </div>

                <div className="mt-8 space-y-3">
                    {Array.from({ length: 5 }, (_, i) => (
                        <div
                            key={i}
                            className="flex items-center gap-3 border border-foreground/10 p-4"
                        >
                            <Skeleton className="h-10 w-10 shrink-0" />
                            <div className="flex-1 space-y-2">
                                <Skeleton className="h-4 w-2/3" />
                                <Skeleton className="h-3 w-1/3" />
                            </div>
                            <Skeleton className="h-8 w-20 shrink-0" />
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
