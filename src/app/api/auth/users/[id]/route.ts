import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { requireRole, forbidden } from "@/lib/guard";
import User from "@/models/User";
import bcrypt from "bcryptjs";

type RouteContext = {
    params: Promise<{ id: string }>;
};

const USER_SELECT = "-password -googleId -otp -otpExpires";
const VALID_ROLES = ["user", "admin"] as const;

export async function GET(_req: NextRequest, ctx: RouteContext) {
    const session = await requireRole("admin");
    if (!session) return forbidden();

    const { id } = await ctx.params;

    await connectDB();

    const user = await User.findById(id).select(USER_SELECT).lean();
    if (!user) {
        return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({ user });
}

export async function PUT(req: NextRequest, ctx: RouteContext) {
    const session = await requireRole("admin");
    if (!session) return forbidden();

    const { id } = await ctx.params;

    try {
        const { name, email, password, role, emailVerified } = await req.json();

        if (!name?.trim() || !email?.trim()) {
            return NextResponse.json(
                { error: "Name and email are required" },
                { status: 400 }
            );
        }

        if (role && !VALID_ROLES.includes(role)) {
            return NextResponse.json(
                { error: "Invalid role. Must be 'user' or 'admin'" },
                { status: 400 }
            );
        }

        if (password && password.length < 6) {
            return NextResponse.json(
                { error: "Password must be at least 6 characters" },
                { status: 400 }
            );
        }

        const normalizedEmail = email.toLowerCase();

        await connectDB();

        const existing = await User.findById(id);
        if (!existing) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        const emailOwner = await User.findOne({
            email: normalizedEmail,
            _id: { $ne: id },
        }).lean();
        if (emailOwner) {
            return NextResponse.json(
                { error: "An account with this email already exists" },
                { status: 409 }
            );
        }

        const updates: Record<string, unknown> = {
            name: name.trim(),
            email: normalizedEmail,
            role: role ?? existing.role,
            emailVerified: emailVerified ?? existing.emailVerified,
        };

        if (password) {
            updates.password = await bcrypt.hash(password, 12);
        }

        const user = await User.findByIdAndUpdate(id, updates, { new: true })
            .select(USER_SELECT)
            .lean();

        return NextResponse.json({ user });
    } catch (error) {
        console.error("Update user error:", error);
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

        if (String(session.user.id) === id) {
            return NextResponse.json(
                { error: "You cannot delete your own account" },
                { status: 400 }
            );
        }

        const user = await User.findByIdAndDelete(id);
        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Delete user error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}