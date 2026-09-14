import Link from "next/link";
import ProductForm from "@/components/shared/ProductForm";

export default function CreateProductPage() {
  return (
    <div className="max-w-2xl">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Create Product</h1>
        <Link
          href="/product-management"
          className="text-sm text-gray-500 hover:underline"
        >
          Back to products
        </Link>
      </div>

      <div className="mt-5">
        <ProductForm mode="create" />
      </div>
    </div>
  );
}