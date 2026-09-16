import { Rss } from "lucide-react";

export default function Blog() {
  return (
    <div className="flex min-h-[80vh] flex-col items-center justify-center bg-background px-4 py-12 text-center sm:px-6">
      <div className="flex h-12 w-12 items-center justify-center border border-foreground/20 bg-foreground/5 sm:h-14 sm:w-14">
        <Rss className="h-5 w-5 text-foreground/60 sm:h-6 sm:w-6" />
      </div>

      <p className="mt-5 text-xs font-medium tracking-widest text-foreground/50 sm:mt-6 sm:text-sm">
        COMING SOON
      </p>
      <h1 className="mt-2 text-2xl font-semibold text-foreground sm:text-3xl md:text-4xl">
        Blog not yet available
      </h1>
      <p className="mt-3 max-w-xs text-sm text-foreground/60 sm:max-w-md">
        We're working on it — check back soon for new posts.
      </p>

      {/* Skeleton preview of upcoming posts */}
      <div className="mt-8 grid w-full max-w-2xl grid-cols-1 gap-3 sm:mt-10 sm:grid-cols-3 sm:gap-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="space-y-3 border border-foreground/10 p-3 sm:p-4">
            <div className="h-20 w-full animate-pulse bg-foreground/10 sm:h-24" />
            <div className="h-3 w-3/4 animate-pulse bg-foreground/10" />
            <div className="h-3 w-1/2 animate-pulse bg-foreground/10" />
          </div>
        ))}
      </div>
    </div>
  );
}