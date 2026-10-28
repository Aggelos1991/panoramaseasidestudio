import { NextRequest, NextResponse } from "next/server";
import {
  clearGuestCookie,
  getGuestSession,
} from "@/lib/auth";
import { createRateLimiter, getClientIp, rateLimitResponse } from "@/lib/rate-limit";
import { crossSiteResponse } from "@/lib/request-guard";
import { isIdentityUnavailable, isMongoConfigured } from "@/lib/mongo";
import {
  EmailDeliveryUnavailableError,
  beginGuestRegister,
  beginGuestSignIn,
  cleanPersonName,
  findUserByEmail,
  normalizeEmail,
  passwordAccepted,
  updateOwnProfile,
} from "@/lib/identity";
import { clearPendingOtp, setPendingOtp } from "@/lib/otp-cookie";

export const dynamic = "force-dynamic";

const loginLimiter = createRateLimiter({ maxRequests: 10, windowMs: 15 * 60_000 });
const registerLimiter = createRateLimiter({ maxRequests: 5, windowMs: 15 * 60_000 });

function unavailable() {
  return NextResponse.json(
    {
      error: "unavailable",
      message: "Account sign-in is temporarily unavailable.",
    },
    { status: 503 },
  );
}

function accountUrl(request: NextRequest, locale: string, error?: string, otp = false) {
  const path = locale === "el" || locale === "de" ? `/${locale}/account` : "/account";
  const url = new URL(path, request.url);
  if (error) url.searchParams.set("error", error);
  if (otp) url.searchParams.set("otp", "1");
  return url;
}

function redirectTo(url: URL) {
  return NextResponse.redirect(url, 303);
}

export async function GET() {
  const session = await getGuestSession();
  if (!session?.email) {
    return NextResponse.json({ guest: null }, { status: 401 });
  }

  if (!isMongoConfigured()) return unavailable();

  try {
    const user = await findUserByEmail(String(session.email));
    if (!user || user.role !== "guest" || user.status !== "active") {
      await clearGuestCookie();
      return NextResponse.json({ guest: null }, { status: 401 });
    }
    return NextResponse.json({
      guest: {
        id: String(user._id),
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
      },
    });
  } catch (error) {
    if (isIdentityUnavailable(error)) return unavailable();
    console.error("Guest profile error");
    return unavailable();
  }
}

export async function POST(request: NextRequest) {
  const blocked = crossSiteResponse(request);
  if (blocked) return blocked;

  const wantsJson = (request.headers.get("content-type") || "").includes("application/json");

  let body: Record<string, unknown>;
  try {
    body = wantsJson
      ? await request.json()
      : Object.fromEntries(await request.formData());
  } catch {
    return NextResponse.json({ error: "invalid" }, { status: 400 });
  }

  const locale = body.locale === "el" || body.locale === "de" ? body.locale : "en";
  const mode = body.mode === "register" ? "register" : "login";
  const limiter = mode === "register" ? registerLimiter : loginLimiter;
  const limited = limiter(`guest-${mode}:${getClientIp(request)}`);
  if (!limited.success) return rateLimitResponse(limited.resetMs);

  const email = normalizeEmail(body.email);
  const password = body.password;
  if (!email || !passwordAccepted(password)) {
    if (!wantsJson) return redirectTo(accountUrl(request, locale, "missing"));
    return NextResponse.json({ error: "missing" }, { status: 400 });
  }
  const emailLimited = limiter(`guest-${mode}-email:${email}`);
  if (!emailLimited.success) return rateLimitResponse(emailLimited.resetMs);

  if (!isMongoConfigured()) {
    if (!wantsJson) return redirectTo(accountUrl(request, locale, "unavailable"));
    return unavailable();
  }

  try {
    if (mode === "register") {
      const firstName = cleanPersonName(body.firstName);
      const lastName = cleanPersonName(body.lastName);
      if (!firstName || !lastName) {
        if (!wantsJson) return redirectTo(accountUrl(request, locale, "missing"));
        return NextResponse.json({ error: "missing" }, { status: 400 });
      }
      await beginGuestRegister({ email, password, firstName, lastName });
    } else {
      const result = await beginGuestSignIn(email, password);
      if ("error" in result) {
        if (!wantsJson) return redirectTo(accountUrl(request, locale, "invalid"));
        return NextResponse.json({ error: "invalid" }, { status: 401 });
      }
    }

    await setPendingOtp(email, mode === "register" ? "register" : "signin");
    if (!wantsJson) return redirectTo(accountUrl(request, locale, undefined, true));
    return NextResponse.json({ otpRequired: true });
  } catch (error) {
    if (error instanceof EmailDeliveryUnavailableError || isIdentityUnavailable(error)) {
      if (!wantsJson) return redirectTo(accountUrl(request, locale, "unavailable"));
      return unavailable();
    }
    console.error("Guest auth error");
    if (!wantsJson) return redirectTo(accountUrl(request, locale, "failed"));
    return NextResponse.json({ error: "failed" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  const blocked = crossSiteResponse(request);
  if (blocked) return blocked;
  const limited = loginLimiter(`guest-profile:${getClientIp(request)}`);
  if (!limited.success) return rateLimitResponse(limited.resetMs);
  if (!isMongoConfigured()) return unavailable();

  const session = await getGuestSession();
  if (!session?.email) {
    return NextResponse.json({ error: "invalid" }, { status: 401 });
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid" }, { status: 400 });
  }

  if (body.email && normalizeEmail(body.email) !== String(session.email).toLowerCase()) {
    return NextResponse.json({ error: "invalid" }, { status: 400 });
  }
  if (body.role || body.status || body.id) {
    return NextResponse.json({ error: "invalid" }, { status: 400 });
  }

  const firstName = body.firstName == null ? undefined : cleanPersonName(body.firstName);
  const lastName = body.lastName == null ? undefined : cleanPersonName(body.lastName);
  if (body.firstName != null && !firstName) {
    return NextResponse.json({ error: "missing" }, { status: 400 });
  }
  if (body.lastName != null && !lastName) {
    return NextResponse.json({ error: "missing" }, { status: 400 });
  }
  if (body.newPassword != null && !passwordAccepted(body.newPassword)) {
    return NextResponse.json({ error: "missing" }, { status: 400 });
  }

  try {
    const updated = await updateOwnProfile(String(session.email).toLowerCase(), {
      firstName: firstName || undefined,
      lastName: lastName || undefined,
      currentPassword: typeof body.currentPassword === "string" ? body.currentPassword : undefined,
      newPassword: typeof body.newPassword === "string" ? body.newPassword : undefined,
    });
    if (updated === "unauthorized") {
      await clearGuestCookie();
      return NextResponse.json({ error: "invalid" }, { status: 401 });
    }
    if (updated === "invalid") {
      return NextResponse.json({ error: "invalid" }, { status: 401 });
    }
    return NextResponse.json({
      guest: {
        id: session.id,
        email: updated.email,
        firstName: updated.firstName,
        lastName: updated.lastName,
      },
    });
  } catch (error) {
    if (isIdentityUnavailable(error)) return unavailable();
    console.error("Guest profile update error");
    return NextResponse.json({ error: "failed" }, { status: 500 });
  }
}

export async function DELETE() {
  await clearGuestCookie();
  await clearPendingOtp();
  return NextResponse.json({ ok: true });
}
