export default function Skeleton({ className }: { className?: string }) {
    return (
        <div
            className={`animate-pulse rounded-none bg-foreground/10 ${className ?? ""}`}
        ></div>
    );
}