import { NextRequest, NextResponse } from "next/server";
import { createGuestToken, setGuestCookie } from "@/lib/auth";
import { createRateLimiter, getClientIp, rateLimitResponse } from "@/lib/rate-limit";
import { crossSiteResponse } from "@/lib/request-guard";
import { isIdentityUnavailable, isMongoConfigured } from "@/lib/mongo";
import { normalizeEmail, verifyGuestOtp, type OtpPurpose } from "@/lib/identity";
import { clearPendingOtp, readPendingOtp } from "@/lib/otp-cookie";

export const dynamic = "force-dynamic";

const limiter = createRateLimiter({ maxRequests: 10, windowMs: 15 * 60_000 });

function unavailable() {
  return NextResponse.json(
    {
      error: "unavailable",
      message: "Account sign-in is temporarily unavailable.",
    },
    { status: 503 },
  );
}

export async function POST(request: NextRequest) {
  const blocked = crossSiteResponse(request);
  if (blocked) return blocked;

  const limited = limiter(`guest-otp:${getClientIp(request)}`);
  if (!limited.success) return rateLimitResponse(limited.resetMs);

  if (!isMongoConfigured()) return unavailable();

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid" }, { status: 400 });
  }

  const pending = await readPendingOtp();
  const bodyEmail = normalizeEmail(body.email);
  const cookieEmail = normalizeEmail(pending.email);
  if (bodyEmail && cookieEmail && bodyEmail !== cookieEmail) {
    return NextResponse.json({ error: "invalid" }, { status: 401 });
  }
  const email = bodyEmail || cookieEmail;
  const purpose: OtpPurpose | null =
    body.purpose === "register" || body.purpose === "signin"
      ? body.purpose
      : body.mode === "register"
        ? "register"
        : body.mode === "login" || body.mode === "signin"
          ? "signin"
          : pending.purpose;
  const code = typeof body.code === "string" ? body.code.trim() : "";

  if (!email || !purpose || !/^\d{6}$/.test(code)) {
    return NextResponse.json({ error: "invalid" }, { status: 400 });
  }

  const emailLimited = limiter(`guest-otp-email:${email}`);
  if (!emailLimited.success) return rateLimitResponse(emailLimited.resetMs);

  try {
    const verified = await verifyGuestOtp({ email, purpose, code });
    if (!verified) {
      return NextResponse.json({ error: "invalid" }, { status: 401 });
    }
    const id = String(verified._id);
    await setGuestCookie(
      await createGuestToken({
        id,
        email: verified.email,
        uid: id,
      }),
    );
    await clearPendingOtp();
    return NextResponse.json({
      guest: {
        id,
        email: verified.email,
        firstName: verified.firstName,
        lastName: verified.lastName,
      },
    });
  } catch (error) {
    if (isIdentityUnavailable(error)) return unavailable();
    console.error("Guest OTP error");
    return NextResponse.json({ error: "failed" }, { status: 500 });
  }
}
