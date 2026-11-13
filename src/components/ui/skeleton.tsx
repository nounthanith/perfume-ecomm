export default function Skeleton({ className }: { className?: string }) {
    return (
        <div
            aria-hidden="true"
            className={`relative overflow-hidden rounded-none bg-foreground/10 ${className ?? ""}`}
        >
            <div className="absolute inset-0 -translate-x-full bg-linear-to-r from-transparent via-foreground/15 to-transparent motion-safe:animate-skeleton-shimmer" />
        </div>
    );
}
