import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { compare } from "bcryptjs";
import { createToken, setAdminCookie, clearAdminCookie } from "@/lib/auth";
import { verifyTOTP, verifyBackupCode } from "@/lib/totp";
import { createRateLimiter, getClientIp, rateLimitResponse } from "@/lib/rate-limit";

// 10 attempts per 15 minutes — brute-force protection (on top of account lockout)
const limiter = createRateLimiter({ maxRequests: 10, windowMs: 15 * 60_000 });

export async function POST(request: NextRequest) {
  const rl = limiter(`auth:${getClientIp(request)}`);
  if (!rl.success) return rateLimitResponse(rl.resetMs);

  try {
    const body = await request.json();
    const { email, password, totpToken, backupCode } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 },
      );
    }

    const admin = await prisma.adminUser.findUnique({
      where: { email },
    });

    if (!admin) {
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 },
      );
    }

    // Account lockout: 5 failed attempts = 15 min lock
    if (admin.lockedUntil && admin.lockedUntil > new Date()) {
      return NextResponse.json(
        { error: "Account temporarily locked. Try again later." },
        { status: 429 },
      );
    }

    const isValid = await compare(password, admin.password);
    if (!isValid) {
      const attempts = admin.failedLoginAttempts + 1;
      const lockout =
        attempts >= 5 ? new Date(Date.now() + 15 * 60 * 1000) : null;
      await prisma.adminUser.update({
        where: { id: admin.id },
        data: { failedLoginAttempts: attempts, lockedUntil: lockout },
      });
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 },
      );
    }

    // Reset failed attempts on successful login
    if (admin.failedLoginAttempts > 0) {
      await prisma.adminUser.update({
        where: { id: admin.id },
        data: { failedLoginAttempts: 0, lockedUntil: null },
      });
    }

    // If 2FA is enabled, require TOTP token or backup code
    if (admin.twoFactorEnabled && admin.twoFactorSecret) {
      // First login attempt — tell the client 2FA is needed
      if (!totpToken && !backupCode) {
        return NextResponse.json({
          requires2FA: true,
          message: "Please enter your 2FA code",
        });
      }

      // Verify TOTP token
      if (totpToken) {
        const totpValid = verifyTOTP(totpToken, admin.twoFactorSecret);
        if (!totpValid) {
          return NextResponse.json(
            { error: "Invalid 2FA code" },
            { status: 401 },
          );
        }
      }
      // Verify backup code
      else if (backupCode) {
        const storedCodes: string[] = admin.backupCodes
          ? JSON.parse(admin.backupCodes)
          : [];

        const result = verifyBackupCode(backupCode, storedCodes);
        if (!result.valid) {
          return NextResponse.json(
            { error: "Invalid backup code" },
            { status: 401 },
          );
        }

        // Update remaining backup codes
        await prisma.adminUser.update({
          where: { id: admin.id },
          data: { backupCodes: JSON.stringify(result.remainingCodes) },
        });
      }
    }

    const token = await createToken({ id: admin.id, email: admin.email });
    await setAdminCookie(token);

    return NextResponse.json({
      success: true,
      user: { id: admin.id, email: admin.email, name: admin.name },
    });
  } catch (error) {
    console.error("Auth error:", error);
    return NextResponse.json(
      { error: "Authentication failed" },
      { status: 500 },
    );
  }
}

export async function DELETE() {
  try {
    await clearAdminCookie();
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Logout error:", error);
    return NextResponse.json(
      { error: "Logout failed" },
      { status: 500 },
    );
  }
}
