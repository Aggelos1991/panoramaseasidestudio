import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminSession } from "@/lib/auth";
import { compare } from "bcryptjs";

// POST — disable 2FA (requires current password for confirmation)
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

    const admin = await prisma.adminUser.findUnique({
      where: { id: session.id },
    });

    if (!admin) {
      return NextResponse.json({ error: "Admin not found" }, { status: 404 });
    }

    if (!admin.twoFactorEnabled) {
      return NextResponse.json(
        { error: "2FA is not enabled" },
        { status: 400 },
      );
    }

    // Verify password
    const isValid = await compare(password, admin.password);
    if (!isValid) {
      return NextResponse.json(
        { error: "Incorrect password" },
        { status: 403 },
      );
    }

    // Disable 2FA
    await prisma.adminUser.update({
      where: { id: session.id },
      data: {
        twoFactorEnabled: false,
        twoFactorSecret: null,
        backupCodes: null,
      },
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
