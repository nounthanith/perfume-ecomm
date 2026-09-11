"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Button from "@/components/ui/button";
import Input from "@/components/ui/input";
import ImageUpload from "@/components/ui/image-upload";

export default function CreateCategoryPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    name: "",
    description: "",
    image: "",
  });

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
      const res = await fetch("/api/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name.trim(),
          description: form.description,
          image: form.image,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to create category");
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

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Create Category</h1>
        <Link
          href="/category-management"
          className="text-sm text-gray-500 hover:underline"
        >
          Back to categories
        </Link>
      </div>

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
          <p className="mb-1 block text-sm font-medium text-foreground">
            Image
          </p>
          <ImageUpload
            value={form.image}
            onChange={(url) => setForm({ ...form, image: url as string })}
          />
        </div>

        <Button type="submit" size="lg" loading={submitting} className="w-full">
          {submitting ? "Creating category..." : "Create Category"}
        </Button>
      </form>
    </div>
  );
}