import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-[80vh] flex-col items-center justify-center bg-background px-4 py-12 text-center sm:px-6">
      <p className="text-xs font-medium tracking-widest text-foreground/50 sm:text-sm">
        404
      </p>
      <h1 className="mt-3 text-2xl font-semibold text-foreground sm:mt-4 sm:text-3xl md:text-4xl">
        Page not found
      </h1>
      <p className="mt-3 max-w-xs text-sm text-foreground/60 sm:max-w-md">
        The page you're looking for doesn't exist or may have been moved.
      </p>

      <Link href="/" className="mt-6 sm:mt-8">
        <button className="border border-foreground bg-foreground px-5 py-2 text-sm font-medium text-background transition-colors hover:bg-background hover:text-foreground sm:px-6 sm:py-2.5">
          Back to Home
        </button>
      </Link>
    </div>
  );
}