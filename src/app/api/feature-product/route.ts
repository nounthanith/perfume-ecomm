import { connectDB } from "@/lib/db";
import Product from "@/models/Product";
import { NextResponse } from "next/server";

export async function GET() {
    await connectDB()
    const products = await Product.find({ isFeature: true })
        .select("name price image category isFeature")
        .lean(); return NextResponse.json({ success: true, data: products });

} 