"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Button from "@/components/ui/button";
import Input from "@/components/ui/input";
import ImageUpload from "@/components/ui/image-upload";

interface Category {
  _id: string;
  name: string;
}

export interface ProductFormData {
  name: string;
  description: string;
  price: number;
  stock: number;
  images: string[];
  category: string;
}

interface ProductFormProps {
  mode: "create" | "edit";
  productId?: string;
  initial?: ProductFormData | null;
}

async function fetchCategories(): Promise<Category[]> {
  const response = await fetch("/api/categories", {
    method: "GET",
    headers: { "Content-Type": "application/json" },
  });

  if (!response.ok) {
    throw new Error("Failed to fetch categories");
  }

  const data = await response.json();
  return data.categories;
}

export default function ProductForm({
  mode,
  productId,
  initial,
}: ProductFormProps) {
  const router = useRouter();
  const isEdit = mode === "edit";

  const [categories, setCategories] = useState<Category[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState<ProductFormData>(
    initial ?? {
      name: "",
      description: "",
      price: 0,
      stock: 0,
      category: "",
      images: [],
    }
  );

  useEffect(() => {
    let cancelled = false;

    fetchCategories()
      .then((data) => {
        if (!cancelled) setCategories(data);
      })
      .catch(() => {
        if (!cancelled) setError("Failed to load categories");
      })
      .finally(() => {
        if (!cancelled) setLoadingCategories(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    if (name === "price" || name === "stock") {
      setForm((prev) => ({
        ...prev,
        [name]: value === "" ? 0 : Number(value),
      }));
    } else {
      setForm((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!form.name.trim()) {
      setError("Product name is required");
      return;
    }

    if (!form.category) {
      setError("Please select a category");
      return;
    }

    if (isNaN(form.price) || form.price < 0) {
      setError("Please enter a valid price");
      return;
    }

    if (isNaN(form.stock) || form.stock < 0) {
      setError("Please enter a valid stock quantity");
      return;
    }

    setSubmitting(true);

    try {
      const payload = {
        name: form.name.trim(),
        description: form.description,
        price: form.price,
        stock: form.stock,
        category: form.category,
        images: form.images,
      };

      const res = await fetch(isEdit ? `/api/products/${productId}` : "/api/products", {
        method: isEdit ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(
          data.error || (isEdit ? "Failed to update product" : "Failed to create product")
        );
        return;
      }

      router.push("/product-management");
      router.refresh();
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const submitLabel = isEdit ? "Save Changes" : "Create Product";
  const submittingLabel = isEdit ? "Saving..." : "Creating product...";

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {error && (
        <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">
          {error}
        </div>
      )}

      <Input
        label="Product Name"
        name="name"
        type="text"
        required
        placeholder="Eau de Parfum 50ml"
        value={form.name}
        onChange={handleChange}
      />

      <div>
        <label
          htmlFor="description"
          className="mb-1 block text-sm font-medium text-foreground"
        >
          Description
        </label>
        <textarea
          id="description"
          name="description"
          rows={4}
          value={form.description}
          onChange={handleChange}
          placeholder="Describe the fragrance..."
          className="mt-1 block w-full rounded-lg border border-foreground/20 bg-background px-3 py-2.5 text-sm text-foreground shadow-sm transition-colors placeholder:text-foreground/40 focus:border-foreground focus:outline-none focus:ring-2 focus:ring-foreground/20"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Input
          label="Price ($)"
          name="price"
          type="number"
          step="0.01"
          min="0"
          required
          value={form.price}
          onChange={handleChange}
          placeholder="49.99"
        />

        <Input
          label="Stock"
          name="stock"
          type="number"
          min="0"
          required
          value={form.stock}
          onChange={handleChange}
          placeholder="0"
        />
      </div>

      <div>
        <label
          htmlFor="category"
          className="mb-1 block text-sm font-medium text-foreground"
        >
          Category
        </label>
        <select
          id="category"
          name="category"
          required
          value={form.category}
          onChange={handleChange}
          disabled={loadingCategories}
          className="mt-1 block w-full rounded-lg border border-foreground/20 bg-background px-3 py-2.5 text-sm text-foreground shadow-sm transition-colors focus:border-foreground focus:outline-none focus:ring-2 focus:ring-foreground/20 disabled:opacity-50"
        >
          <option value="">
            {loadingCategories ? "Loading categories..." : "Select a category"}
          </option>
          {categories.map((category) => (
            <option key={category._id} value={category._id}>
              {category.name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <p className="mb-1 block text-sm font-medium text-foreground">
          Images
        </p>
        <ImageUpload
          multiple
          value={form.images}
          onChange={(urls) =>
            setForm((prev) => ({ ...prev, images: urls as string[] }))
          }
        />
      </div>

      <Button type="submit" size="lg" loading={submitting} className="w-full">
        {submitting ? submittingLabel : submitLabel}
      </Button>
    </form>
  );
}