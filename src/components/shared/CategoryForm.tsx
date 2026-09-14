"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Button from "@/components/ui/button";
import Input from "@/components/ui/input";
import ImageUpload from "@/components/ui/image-upload";

export interface CategoryFormData {
  name: string;
  description: string;
  image: string;
}

interface CategoryFormProps {
  mode: "create" | "edit";
  categoryId?: string;
  initial?: CategoryFormData | null;
}

export default function CategoryForm({
  mode,
  categoryId,
  initial,
}: CategoryFormProps) {
  const router = useRouter();
  const isEdit = mode === "edit";

  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState<CategoryFormData>(
    initial ?? { name: "", description: "", image: "" }
  );

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!form.name.trim()) {
      setError("Category name is required");
      return;
    }

    setSubmitting(true);

    try {
      const payload = {
        name: form.name.trim(),
        description: form.description,
        image: form.image,
      };

      const res = await fetch(
        isEdit ? `/api/categories/${categoryId}` : "/api/categories",
        {
          method: isEdit ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );

      const data = await res.json();

      if (!res.ok) {
        setError(
          data.error ||
            (isEdit ? "Failed to update category" : "Failed to create category")
        );
        return;
      }

      router.push("/category-management");
      router.refresh();
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const submitLabel = isEdit ? "Save Changes" : "Create Category";
  const submittingLabel = isEdit ? "Saving..." : "Creating category...";

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {error && (
        <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">
          {error}
        </div>
      )}

      <Input
        label="Category Name"
        name="name"
        type="text"
        required
        value={form.name}
        onChange={handleChange}
        placeholder="Floral"
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
          placeholder="Describe this category..."
          className="mt-1 block w-full rounded-lg border border-foreground/20 bg-background px-3 py-2.5 text-sm text-foreground shadow-sm transition-colors placeholder:text-foreground/40 focus:border-foreground focus:outline-none focus:ring-2 focus:ring-foreground/20"
        />
      </div>

      <div>
        <p className="mb-1 block text-sm font-medium text-foreground">Image</p>
        <ImageUpload
          value={form.image}
          onChange={(url) =>
            setForm((prev) => ({ ...prev, image: url as string }))
          }
        />
      </div>

      <Button type="submit" size="lg" loading={submitting} className="w-full">
        {submitting ? submittingLabel : submitLabel}
      </Button>
    </form>
  );
}