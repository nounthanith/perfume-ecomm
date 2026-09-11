import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Category from "@/models/Category";
import { requireRole, forbidden } from "@/lib/guard";
import { findAll } from "@/lib/crud";

function toSlug(name: string) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export async function GET() {
  const categories = await findAll(Category);
  return NextResponse.json({ categories });
}

export async function POST(req: NextRequest) {
  const session = await requireRole("admin");
  if (!session) return forbidden();

  try {
    const { name, description, image } = await req.json();

    if (!name) {
      return NextResponse.json(
        { error: "Category name is required" },
        { status: 400 }
      );
    }

    await connectDB();

    const slug = toSlug(name);

    const existing = await Category.findOne({ slug });
    if (existing) {
      return NextResponse.json(
        { error: "Category with this name already exists" },
        { status: 409 }
      );
    }

    const category = await Category.create({
      name,
      slug,
      description: description || "",
      image: image || "",
    });

    return NextResponse.json({ category }, { status: 201 });
  } catch (error) {
    console.error("Create category error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
