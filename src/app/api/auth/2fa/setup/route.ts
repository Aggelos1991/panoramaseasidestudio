import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminSession } from "@/lib/auth";
import { generateTOTPSecret } from "@/lib/totp";
import QRCode from "qrcode";

// POST — generate TOTP secret and QR code for setup
export async function POST() {
  try {
    const session = await getAdminSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const admin = await prisma.adminUser.findUnique({
      where: { id: session.id },
    });

    if (!admin) {
      return NextResponse.json({ error: "Admin not found" }, { status: 404 });
    }

    if (admin.twoFactorEnabled) {
      return NextResponse.json(
        { error: "2FA is already enabled" },
        { status: 400 },
      );
    }

    // Generate new secret
    const { secret, uri } = generateTOTPSecret(admin.email);

    // Store secret temporarily (not yet enabled until verified)
    await prisma.adminUser.update({
      where: { id: session.id },
      data: { twoFactorSecret: secret },
    });

    // Generate QR code as data URL
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
