import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Product from "@/models/Product";
import "@/models/Category";
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

  const product = await Product.findById(id)
    .populate("category", "name slug")
    .lean();

  if (!product) {
    return NextResponse.json({ error: "Product not found" }, { status: 404 });
  }

  return NextResponse.json({
    product: {
      _id: String(product._id),
      name: product.name,
      slug: product.slug,
      description: product.description ?? "",
      price: product.price,
      stock: product.stock,
      images: product.images ?? [],
      category: product.category,
    },
  });
}

export async function PUT(req: NextRequest, ctx: RouteContext) {
  const session = await requireRole("admin");
  if (!session) return forbidden();

  const { id } = await ctx.params;

  try {
    const { name, description, price, category, images, stock } =
      await req.json();

    if (!name || price === undefined || !category) {
      return NextResponse.json(
        { error: "Name, price, and category are required" },
        { status: 400 }
      );
    }

    await connectDB();

    const existing = await Product.findById(id);
    if (!existing) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    const slug = toSlug(name);
    const slugOwner = await Product.findOne({ slug, _id: { $ne: id } });
    if (slugOwner) {
      return NextResponse.json(
        { error: "Product with this name already exists" },
        { status: 409 }
      );
    }

    const product = await Product.findByIdAndUpdate(
      id,
      {
        name,
        slug,
        description: description || "",
        price,
        category,
        images: images || [],
        stock: stock ?? 0,
      },
      { new: true }
    ).populate("category", "name slug");

    return NextResponse.json({ product });
  } catch (error) {
    console.error("Update product error:", error);
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

    const product = await Product.findByIdAndDelete(id);
    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete product error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}