import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth";
import { findUserById } from "@/lib/identity";

export async function GET() {
  try {
    const session = await getAdminSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const admin = await findUserById(String(session.id));

    return NextResponse.json({
      enabled: admin?.role === "admin" && Boolean(admin.twoFactorEnabled),
    });
  } catch (error) {
    console.error("2FA status error:", error);
    return NextResponse.json(
      { error: "Failed to get 2FA status" },
      { status: 500 },
    );
  }
}
