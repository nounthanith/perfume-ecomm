import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Setting, { SETTING_KEY } from "@/models/Setting";

export const dynamic = "force-dynamic";

interface SettingDoc {
  shopStatus: boolean;
  message: string;
  updatedAt?: Date;
}

export async function GET() {
  try {
    await connectDB();

    const setting = await Setting.findOne({ key: SETTING_KEY })
      .select("shopStatus message updatedAt")
      .lean<SettingDoc>();

    return NextResponse.json({
      setting: {
        shopStatus: setting?.shopStatus ?? true,
        message: setting?.message ?? "",
        updatedAt: setting?.updatedAt
          ? new Date(setting.updatedAt).toISOString()
          : null,
      },
    });
  } catch (error) {
    console.error("GET /api/setting/public failed:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
