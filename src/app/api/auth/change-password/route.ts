import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth";
import { isMongoConfigured } from "@/lib/mongo";
import { updateAdminPassword } from "@/lib/identity";

export async function POST(request: NextRequest) {
  try {
    const session = await getAdminSession();
    if (!session?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!isMongoConfigured()) {
      return NextResponse.json(
        { error: "Authentication is temporarily unavailable" },
        { status: 503 },
      );
    }

    const body = await request.json();
    const { currentPassword, newPassword } = body;

    if (!currentPassword || !newPassword) {
      return NextResponse.json(
        { error: "Current password and new password are required" },
        { status: 400 },
      );
    }

    if (newPassword.length < 12) {
      return NextResponse.json(
        { error: "New password must be at least 12 characters" },
        { status: 400 },
      );
    }

    const result = await updateAdminPassword(
      String(session.email).toLowerCase(),
      String(currentPassword),
      String(newPassword),
    );
    if (result === "ok") return NextResponse.json({ success: true });
    if (result === "invalid") {
      return NextResponse.json(
        { error: "Current password is incorrect" },
        { status: 403 },
      );
    }
    return NextResponse.json({ error: "Admin not found" }, { status: 404 });
  } catch (error) {
    console.error("Password change error:", error);
    return NextResponse.json(
      { error: "Failed to change password" },
      { status: 500 },
    );
  }
}
