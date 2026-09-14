import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Category from "@/models/Category";
import Product from "@/models/Product";
import { requireRole, forbidden } from "@/lib/guard";

type RouteContext = {
  params: Promise<{ id: string }>;
};

function toSlug(name: string) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export async function GET(_req: NextRequest, ctx: RouteContext) {
  const { id } = await ctx.params;

  await connectDB();

  const category = await Category.findById(id).lean();

  if (!category) {
    return NextResponse.json({ error: "Category not found" }, { status: 404 });
  }

  return NextResponse.json({
    category: {
      _id: String(category._id),
      name: category.name,
      slug: category.slug,
      description: category.description ?? "",
      image: category.image ?? "",
    },
  });
}

export async function PUT(req: NextRequest, ctx: RouteContext) {
  const session = await requireRole("admin");
  if (!session) return forbidden();

  const { id } = await ctx.params;

  try {
    const { name, description, image } = await req.json();

    if (!name) {
      return NextResponse.json(
        { error: "Category name is required" },
        { status: 400 }
      );
    }

    await connectDB();

    const existing = await Category.findById(id);
    if (!existing) {
      return NextResponse.json(
        { error: "Category not found" },
        { status: 404 }
      );
    }

    const slug = toSlug(name);
    const slugOwner = await Category.findOne({ slug, _id: { $ne: id } });
    if (slugOwner) {
      return NextResponse.json(
        { error: "Category with this name already exists" },
        { status: 409 }
      );
    }

    const category = await Category.findByIdAndUpdate(
      id,
      {
        name,
        slug,
        description: description || "",
        image: image || "",
      },
      { new: true }
    ).lean();

    return NextResponse.json({ category });
  } catch (error) {
    console.error("Update category error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(_req: NextRequest, ctx: RouteContext) {
  const session = await requireRole("admin");
  if (!session) return forbidden();

  const { id } = await ctx.params;

  try {
    await connectDB();

    const productCount = await Product.countDocuments({ category: id });
    if (productCount > 0) {
      return NextResponse.json(
        { error: `Cannot delete: ${productCount} product(s) use this category` },
        { status: 409 }
      );
    }

    const category = await Category.findByIdAndDelete(id);
    if (!category) {
      return NextResponse.json(
        { error: "Category not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete category error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}