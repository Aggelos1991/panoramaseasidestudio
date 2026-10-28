import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth";
import { compare } from "bcryptjs";
import { findUserById, updateAdminById } from "@/lib/identity";

export async function POST(request: NextRequest) {
  try {
    const session = await getAdminSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { password } = await request.json();

    if (!password) {
      return NextResponse.json(
        { error: "Password is required to disable 2FA" },
        { status: 400 },
      );
    }

    const admin = await findUserById(String(session.id));

    if (!admin || admin.role !== "admin") {
      return NextResponse.json({ error: "Admin not found" }, { status: 404 });
    }

    if (!admin.twoFactorEnabled) {
      return NextResponse.json(
        { error: "2FA is not enabled" },
        { status: 400 },
      );
    }

    const isValid = await compare(password, admin.passwordHash);
    if (!isValid) {
      return NextResponse.json(
        { error: "Incorrect password" },
        { status: 403 },
      );
    }

    await updateAdminById(String(admin._id), {
      twoFactorEnabled: false,
      twoFactorSecret: null,
      backupCodes: null,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("2FA disable error:", error);
    return NextResponse.json(
      { error: "Failed to disable 2FA" },
      { status: 500 },
    );
  }
}
