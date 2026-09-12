import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto flex min-h-[60vh] max-w-md flex-col items-center justify-center gap-4 px-4 text-center">
      <p className="text-6xl font-bold text-foreground/20">404</p>
      <h1 className="text-xl font-semibold">Page not found</h1>
      <p className="text-sm text-gray-500">
        The page or product you are looking for does not exist or may have been
        removed.
      </p>
      <Link
        href="/"
        className="rounded-lg bg-foreground px-5 py-2.5 text-sm font-medium text-background transition-opacity hover:opacity-90"
      >
        Back to Home
      </Link>
    </div>
  );
}