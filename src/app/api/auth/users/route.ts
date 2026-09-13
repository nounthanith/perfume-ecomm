import { paginateAll } from "@/lib/crud";
import { connectDB } from "@/lib/db";
import { requireRole, forbidden } from "@/lib/guard";
import User from "@/models/User";
import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";

const USER_SELECT = "-password -googleId -otp -otpExpires";
const VALID_ROLES = ["user", "admin"] as const;

export async function GET(req: NextRequest) {
    await connectDB();

    const { searchParams } = req.nextUrl;
    const page = searchParams.get("page");
    const limit = searchParams.get("limit");
    const search = searchParams.get("search");

    const filter: Record<string, unknown> = {};
    if (search) {
        const regex = { $regex: new RegExp(search, "i") };
        filter.$or = [{ name: regex }, { email: regex }];
    }

    if (page) {
        const result = await paginateAll(User, {
            page: parseInt(page, 10) || 1,
            limit: limit ? parseInt(limit, 10) || 10 : 10,
            filter,
            select: USER_SELECT,
        });
        return NextResponse.json({
            users: result.items,
            pagination: result.pagination,
        });
    }

    const users = await User.find(filter).select(USER_SELECT).sort({ createdAt: -1 }).lean();
    return NextResponse.json({ users });
}

export async function POST(req: NextRequest) {
    const session = await requireRole("admin");
    if (!session) return forbidden();

    try {
        const { name, email, password, role, emailVerified } = await req.json();

        if (!name?.trim() || !email?.trim()) {
            return NextResponse.json(
                { error: "Name and email are required" },
                { status: 400 }
            );
        }

        if (!password || password.length < 6) {
            return NextResponse.json(
                { error: "Password must be at least 6 characters" },
                { status: 400 }
            );
        }

        if (role && !VALID_ROLES.includes(role)) {
            return NextResponse.json(
                { error: "Invalid role. Must be 'user' or 'admin'" },
                { status: 400 }
            );
        }

        const normalizedEmail = email.toLowerCase();

        await connectDB();

        const existing = await User.findOne({ email: normalizedEmail }).lean();
        if (existing) {
            return NextResponse.json(
                { error: "An account with this email already exists" },
                { status: 409 }
            );
        }

        const hashedPassword = await bcrypt.hash(password, 12);

        const user = await User.create({
            name: name.trim(),
            email: normalizedEmail,
            password: hashedPassword,
            provider: "credentials",
            role: role ?? "user",
            emailVerified: emailVerified ?? true,
        });

        return NextResponse.json(
            { user: { _id: user._id, name: user.name, email: user.email } },
            { status: 201 }
        );
    } catch (error) {
        console.error("Create user error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}