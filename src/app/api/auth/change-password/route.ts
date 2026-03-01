import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminSession } from "@/lib/auth";
import { hash, compare } from "bcryptjs";

export async function POST(request: NextRequest) {
  try {
    const session = await getAdminSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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

    // Verify current password
    const admin = await prisma.adminUser.findUnique({
      where: { id: session.id },
    });

    if (!admin) {
      return NextResponse.json({ error: "Admin not found" }, { status: 404 });
    }

    const isValid = await compare(currentPassword, admin.password);
    if (!isValid) {
      return NextResponse.json(
        { error: "Current password is incorrect" },
        { status: 403 },
      );
    }

    // Update password
    const hashedPassword = await hash(newPassword, 12);
    await prisma.adminUser.update({
      where: { id: session.id },
      data: { password: hashedPassword },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Password change error:", error);
    return NextResponse.json(
      { error: "Failed to change password" },
      { status: 500 },
    );
  }
}
