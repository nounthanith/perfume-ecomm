import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Order from "@/models/Order";
import { requireRole, forbidden } from "@/lib/guard";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(_req: NextRequest, ctx: RouteContext) {
  const session = await requireRole("admin", "cashier");
  if (!session) return forbidden();

  const { id } = await ctx.params;

  await connectDB();

  const order = await Order.findById(id)
    .populate("cashier", "name email")
    .lean();

  if (!order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  return NextResponse.json({ order });
}