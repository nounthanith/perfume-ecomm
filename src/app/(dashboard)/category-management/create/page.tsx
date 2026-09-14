import Link from "next/link";
import CategoryForm from "@/components/shared/CategoryForm";

export default function CreateCategoryPage() {
  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Create Category</h1>
        <Link
          href="/category-management"
          className="text-sm text-gray-500 hover:underline"
        >
          Back to categories
        </Link>
      </div>

      <CategoryForm mode="create" />
    </div>
  );
}