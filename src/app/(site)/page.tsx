import ProductCart, { type ProductCardData } from "@/components/ProductCart";
import { getProducts, type HomeProduct } from "./action";

export default async function Home() {
  let products: HomeProduct[] = [];
  let error = "";

  try {
    products = await getProducts();
  } catch (err) {
    error = err instanceof Error ? err.message : "Failed to load products";
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-10">
      <h1 className="mb-8 text-start text-3xl font-bold">Our Perfumes</h1>

      {error && (
        <div className="rounded-lg bg-red-50 p-4 text-sm text-red-600">
          {error}
        </div>
      )}

      {products.length === 0 ? (
        <p className="py-16 text-center text-gray-500">No products yet.</p>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {products.map((product) => (
            <ProductCart
              key={product._id}
              product={product as ProductCardData}
            />
          ))}
        </div>
      )}
    </div>
  );
}