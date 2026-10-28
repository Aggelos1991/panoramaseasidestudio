import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth";
import { findUserById, updateAdminById } from "@/lib/identity";
import {
  verifyTOTP,
  generateBackupCodes,
  hashBackupCode,
} from "@/lib/totp";

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

    const admin = await findUserById(String(session.id));

    if (!admin || admin.role !== "admin" || !admin.twoFactorSecret) {
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

    const isValid = verifyTOTP(token, admin.twoFactorSecret);
    if (!isValid) {
      return NextResponse.json(
        { error: "Invalid code. Please try again." },
        { status: 400 },
      );
    }

    const backupCodes = generateBackupCodes();
    const hashedCodes = backupCodes.map(hashBackupCode);

    await updateAdminById(String(admin._id), {
      twoFactorEnabled: true,
      backupCodes: JSON.stringify(hashedCodes),
    });

    return NextResponse.json({
      success: true,
      backupCodes,
    });
  } catch (error) {
    console.error("2FA verify error:", error);
    return NextResponse.json(
      { error: "Failed to verify 2FA" },
      { status: 500 },
    );
  }
}
