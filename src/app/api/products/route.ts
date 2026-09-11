import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Product from "@/models/Product";
import "@/models/Category";
import { requireRole, forbidden } from "@/lib/guard";
import { create } from "@/lib/crud";

function toSlug(name: string) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export async function GET() {
  await connectDB();
  const products = await Product.find()
    .populate("category", "name slug")
    .sort({ createdAt: -1 })
    .lean();
  return NextResponse.json({ products });
}

export async function POST(req: NextRequest) {
  const session = await requireRole("admin");
  if (!session) return forbidden();

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

    const slug = toSlug(name);

    const existing = await Product.findOne({ slug });
    if (existing) {
      return NextResponse.json(
        { error: "Product with this name already exists" },
        { status: 409 }
      );
    }

    const product = await create(Product, {
      name,
      slug,
      description: description || "",
      price,
      category,
      images: images || [],
      stock: stock || 0,
    });

    return NextResponse.json({ product }, { status: 201 });
  } catch (error) {
    console.error("Create product error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
