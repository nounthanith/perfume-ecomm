import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { forbidden, requireRole } from "@/lib/guard";
import Product from "@/models/Product";
import Setting, { SETTING_KEY } from "@/models/Setting";
import User from "@/models/User";

export const dynamic = "force-dynamic";

const MAX_MESSAGE = 200;

interface SettingDoc {
  key: string;
  shopStatus: boolean;
  message: string;
  updatedAt?: Date;
}

const DEFAULT_SETTING = {
  key: SETTING_KEY,
  shopStatus: true,
  message: "",
};

function toSettingPayload(doc: SettingDoc | null) {
  if (!doc) {
    return { ...DEFAULT_SETTING, updatedAt: null as string | null };
  }

  return {
    key: doc.key,
    shopStatus: doc.shopStatus,
    message: doc.message ?? "",
    updatedAt: doc.updatedAt ? new Date(doc.updatedAt).toISOString() : null,
  };
}

export async function GET() {
  const session = await requireRole("admin");
  if (!session) return forbidden();

  try {
    await connectDB();

    // Read-only: the singleton is created lazily on the first PATCH
    const setting = await Setting.findOne({ key: SETTING_KEY }).lean<SettingDoc>();

    const [users, products] = await Promise.all([
      User.countDocuments(),
      Product.countDocuments(),
    ]);

    return NextResponse.json({
      setting: toSettingPayload(setting),
      stats: { users, products },
    });
  } catch (error) {
    console.error("GET /api/setting failed:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  const session = await requireRole("admin");
  if (!session) return forbidden();

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (typeof body !== "object" || body === null || Array.isArray(body)) {
    return NextResponse.json({ error: "Body must be a JSON object" }, { status: 400 });
  }

  const payload = body as Record<string, unknown>;
  const update: { shopStatus?: boolean; message?: string } = {};

  if ("shopStatus" in payload) {
    if (typeof payload.shopStatus !== "boolean") {
      return NextResponse.json(
        { error: "shopStatus must be a boolean" },
        { status: 400 }
      );
    }
    update.shopStatus = payload.shopStatus;
  }

  if ("message" in payload) {
    if (typeof payload.message !== "string") {
      return NextResponse.json(
        { error: "message must be a string" },
        { status: 400 }
      );
    }

    const message = payload.message.trim();
    if (message.length > MAX_MESSAGE) {
      return NextResponse.json(
        { error: `message must be ${MAX_MESSAGE} characters or fewer` },
        { status: 400 }
      );
    }
    update.message = message;
  }

  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
  }

  try {
    await connectDB();

    const setting = await Setting.findOneAndUpdate(
      { key: SETTING_KEY },
      { $set: update, $setOnInsert: { key: SETTING_KEY } },
      { upsert: true, new: true }
    ).lean<SettingDoc>();

    if (!setting) {
      return NextResponse.json(
        { error: "Failed to update setting" },
        { status: 500 }
      );
    }

    return NextResponse.json({ setting: toSettingPayload(setting) });
  } catch (error) {
    console.error("PATCH /api/setting failed:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}