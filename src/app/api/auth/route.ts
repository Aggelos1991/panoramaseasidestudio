import { NextRequest, NextResponse } from "next/server";
import { createToken, setAdminCookie, clearAdminCookie } from "@/lib/auth";
import { verifyTOTP, verifyBackupCode } from "@/lib/totp";
import { createRateLimiter, getClientIp, rateLimitResponse } from "@/lib/rate-limit";
import { crossSiteResponse } from "@/lib/request-guard";
import { isIdentityUnavailable, isMongoConfigured } from "@/lib/mongo";
import {
  clearAdminFailures,
  normalizeEmail,
  replaceAdminBackupCodes,
  verifyAdminPassword,
} from "@/lib/identity";

// 10 attempts per 15 minutes — brute-force protection (on top of account lockout)
const limiter = createRateLimiter({ maxRequests: 10, windowMs: 15 * 60_000 });

export async function POST(request: NextRequest) {
  const blocked = crossSiteResponse(request);
  if (blocked) return blocked;

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

    if (!isMongoConfigured()) {
      return NextResponse.json(
        { error: "Authentication is temporarily unavailable" },
        { status: 503 },
      );
    }

    const emailNorm = normalizeEmail(email);
    if (!emailNorm) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    try {
        const mongo = await verifyAdminPassword(emailNorm, String(password));
        if (mongo.ok) {
          const admin = mongo.user;
          if (admin.twoFactorEnabled && admin.twoFactorSecret) {
            if (!totpToken && !backupCode) {
              return NextResponse.json({
                requires2FA: true,
                message: "Please enter your 2FA code",
              });
            }
            if (totpToken) {
              if (!verifyTOTP(String(totpToken), admin.twoFactorSecret)) {
                return NextResponse.json({ error: "Invalid 2FA code" }, { status: 401 });
              }
            } else if (backupCode) {
              let storedCodes: string[] = [];
              try {
                storedCodes = admin.backupCodes ? JSON.parse(admin.backupCodes) : [];
              } catch {
                storedCodes = [];
              }
              const result = verifyBackupCode(String(backupCode), storedCodes);
              if (!result.valid) {
                return NextResponse.json({ error: "Invalid backup code" }, { status: 401 });
              }
              await replaceAdminBackupCodes(
                admin.email,
                JSON.stringify(result.remainingCodes),
              );
            }
          }
          await clearAdminFailures(admin._id);
          const token = await createToken({ id: String(admin._id), email: admin.email });
          await setAdminCookie(token);
          return NextResponse.json({
            success: true,
            user: {
              id: String(admin._id),
              email: admin.email,
              name: `${admin.firstName} ${admin.lastName}`.trim(),
            },
          });
        }
        if (mongo.reason === "locked") {
          return NextResponse.json(
            { error: "Account temporarily locked. Try again later." },
            { status: 429 },
          );
        }
        return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
      } catch (error) {
        if (isIdentityUnavailable(error)) {
          return NextResponse.json(
            { error: "Authentication is temporarily unavailable" },
            { status: 503 },
          );
        }
        throw error;
      }
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
