import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminSession } from "@/lib/auth";

export async function GET() {
  try {
    const session = await getAdminSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const admin = await prisma.adminUser.findUnique({
      where: { id: session.id },
      select: { twoFactorEnabled: true },
    });

    return NextResponse.json({
      enabled: admin?.twoFactorEnabled ?? false,
    });
  } catch (error) {
    console.error("2FA status error:", error);
    return NextResponse.json(
      { error: "Failed to get 2FA status" },
      { status: 500 },
    );
  }
}
