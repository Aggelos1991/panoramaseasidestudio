import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth";
import { generateTOTPSecret } from "@/lib/totp";
import { findUserById, updateAdminById } from "@/lib/identity";
import QRCode from "qrcode";

export async function POST() {
  try {
    const session = await getAdminSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const admin = await findUserById(String(session.id));
    if (!admin || admin.role !== "admin") {
      return NextResponse.json({ error: "Admin not found" }, { status: 404 });
    }

    if (admin.twoFactorEnabled) {
      return NextResponse.json(
        { error: "2FA is already enabled" },
        { status: 400 },
      );
    }

    const { secret, uri } = generateTOTPSecret(admin.email);
    await updateAdminById(String(admin._id), { twoFactorSecret: secret });

    const qrCodeDataUrl = await QRCode.toDataURL(uri, {
      width: 256,
      margin: 2,
      color: { dark: "#1a365d", light: "#ffffff" },
    });

    return NextResponse.json({
      secret,
      qrCode: qrCodeDataUrl,
    });
  } catch (error) {
    console.error("2FA setup error:", error);
    return NextResponse.json(
      { error: "Failed to set up 2FA" },
      { status: 500 },
    );
  }
}
