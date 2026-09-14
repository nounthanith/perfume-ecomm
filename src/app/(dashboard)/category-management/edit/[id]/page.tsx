import Link from "next/link";
import { notFound } from "next/navigation";
import { connectDB } from "@/lib/db";
import Category from "@/models/Category";
import CategoryForm, {
  type CategoryFormData,
} from "@/components/shared/CategoryForm";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function EditCategoryPage({ params }: Props) {
  const { id } = await params;

  await connectDB();
  const category = await Category.findById(id).lean();

  if (!category) notFound();

  const initial: CategoryFormData = {
    name: category.name,
    description: category.description ?? "",
    image: category.image ?? "",
  };

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Edit Category</h1>
        <Link
          href="/category-management"
          className="text-sm text-gray-500 hover:underline"
        >
          Back to categories
        </Link>
      </div>

      <CategoryForm mode="edit" categoryId={id} initial={initial} />
    </div>
  );
}