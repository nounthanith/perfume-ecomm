import Link from "next/link";
import { notFound } from "next/navigation";
import { connectDB } from "@/lib/db";
import Product from "@/models/Product";
import "@/models/Category";
import ProductForm, { type ProductFormData } from "@/components/shared/ProductForm";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function EditProductPage({ params }: Props) {
  const { id } = await params;

  await connectDB();
  const product = await Product.findById(id)
    .populate("category", "name slug")
    .lean();

  if (!product) notFound();

  const initial: ProductFormData = {
    name: product.name,
    description: product.description ?? "",
    price: product.price,
    stock: product.stock,
    images: product.images ?? [],
    category: String(
      typeof product.category === "object"
        ? (product.category as { _id?: unknown })._id
        : product.category
    ),
  };

  return (
    <div className="max-w-2xl">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Edit Product</h1>
        <Link
          href="/product-management"
          className="text-sm text-gray-500 hover:underline"
        >
          Back to products
        </Link>
      </div>

      <div className="mt-5">
        <ProductForm mode="edit" productId={id} initial={initial} />
      </div>
    </div>
  );
}