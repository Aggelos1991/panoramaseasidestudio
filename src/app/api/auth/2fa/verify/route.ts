import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminSession } from "@/lib/auth";
import {
  verifyTOTP,
  generateBackupCodes,
  hashBackupCode,
} from "@/lib/totp";

// POST — verify TOTP code and enable 2FA
export async function POST(request: NextRequest) {
  try {
    const session = await getAdminSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { token } = await request.json();

    if (!token || typeof token !== "string" || token.length !== 6) {
      return NextResponse.json(
        { error: "Please enter a valid 6-digit code" },
        { status: 400 },
      );
    }

    const admin = await prisma.adminUser.findUnique({
      where: { id: session.id },
    });

    if (!admin || !admin.twoFactorSecret) {
      return NextResponse.json(
        { error: "2FA setup not initiated" },
        { status: 400 },
      );
    }

    if (admin.twoFactorEnabled) {
      return NextResponse.json(
        { error: "2FA is already enabled" },
        { status: 400 },
      );
    }

    // Verify the TOTP token
    const isValid = verifyTOTP(token, admin.twoFactorSecret);
    if (!isValid) {
      return NextResponse.json(
        { error: "Invalid code. Please try again." },
        { status: 400 },
      );
    }

    // Generate backup codes
    const backupCodes = generateBackupCodes();
    const hashedCodes = backupCodes.map(hashBackupCode);

    // Enable 2FA
    await prisma.adminUser.update({
      where: { id: session.id },
      data: {
        twoFactorEnabled: true,
        backupCodes: JSON.stringify(hashedCodes),
      },
    });

    return NextResponse.json({
      success: true,
      backupCodes, // Return plaintext backup codes ONCE — user must save them
    });
  } catch (error) {
    console.error("2FA verify error:", error);
    return NextResponse.json(
      { error: "Failed to verify 2FA" },
      { status: 500 },
    );
  }
}
