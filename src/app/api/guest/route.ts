import { NextRequest, NextResponse } from "next/server";
import { hash, compare } from "bcryptjs";
import { prisma } from "@/lib/prisma";
import {
  clearGuestCookie,
  createGuestToken,
  getGuestSession,
  setGuestCookie,
} from "@/lib/auth";
import { createRateLimiter, getClientIp, rateLimitResponse } from "@/lib/rate-limit";

const limiter = createRateLimiter({ maxRequests: 10, windowMs: 15 * 60_000 });

export async function GET() {
  const session = await getGuestSession();
  if (!session) {
    return NextResponse.json({ guest: null }, { status: 401 });
  }

  const guest = await prisma.guest.findUnique({
    where: { id: session.id },
    select: { id: true, email: true, firstName: true, lastName: true },
  });

  if (!guest) {
    await clearGuestCookie();
    return NextResponse.json({ guest: null }, { status: 401 });
  }

  return NextResponse.json({ guest });
}

function accountUrl(request: NextRequest, locale: string, error?: string) {
  const path = locale === "el" || locale === "de" ? `/${locale}/account` : "/account";
  const url = new URL(path, request.url);
  if (error) url.searchParams.set("error", error);
  return url;
}

function redirectTo(url: URL) {
  return NextResponse.redirect(url, 303);
}

export async function POST(request: NextRequest) {
  const rl = limiter(`guest-auth:${getClientIp(request)}`);
  if (!rl.success) return rateLimitResponse(rl.resetMs);

  const wantsJson = (request.headers.get("content-type") || "").includes("application/json");

  try {
    const body = wantsJson
      ? await request.json()
      : Object.fromEntries(await request.formData());
    const locale = String(body.locale || "en");
    const mode = body.mode === "register" ? "register" : "login";
    const email = String(body.email || "").trim().toLowerCase();
    const password = String(body.password || "");

    if (!email || !password) {
      if (!wantsJson) return redirectTo(accountUrl(request, locale, "missing"));
      return NextResponse.json({ error: "missing" }, { status: 400 });
    }

    if (mode === "register") {
      const firstName = String(body.firstName || "").trim();
      const lastName = String(body.lastName || "").trim();
      if (firstName.length < 2 || lastName.length < 2 || password.length < 8) {
        if (!wantsJson) return redirectTo(accountUrl(request, locale, "missing"));
        return NextResponse.json({ error: "missing" }, { status: 400 });
      }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        if (!wantsJson) return redirectTo(accountUrl(request, locale, "invalid"));
        return NextResponse.json({ error: "invalid" }, { status: 400 });
      }

      const existing = await prisma.guest.findUnique({ where: { email } });
      if (existing) {
        if (!wantsJson) return redirectTo(accountUrl(request, locale, "exists"));
        return NextResponse.json({ error: "exists" }, { status: 409 });
      }

      const guest = await prisma.guest.create({
        data: {
          email,
          password: await hash(password, 12),
          firstName,
          lastName,
        },
        select: { id: true, email: true, firstName: true, lastName: true },
      });

      await setGuestCookie(await createGuestToken({ id: guest.id, email: guest.email }));
      if (!wantsJson) return redirectTo(accountUrl(request, locale));
      return NextResponse.json({ guest });
    }

    const guest = await prisma.guest.findUnique({ where: { email } });
    if (!guest || !(await compare(password, guest.password))) {
      if (!wantsJson) return redirectTo(accountUrl(request, locale, "invalid"));
      return NextResponse.json({ error: "invalid" }, { status: 401 });
    }

    await setGuestCookie(await createGuestToken({ id: guest.id, email: guest.email }));
    const sessionGuest = {
      id: guest.id,
      email: guest.email,
      firstName: guest.firstName,
      lastName: guest.lastName,
    };
    if (!wantsJson) return redirectTo(accountUrl(request, locale));
    return NextResponse.json({ guest: sessionGuest });
  } catch (error) {
    console.error("Guest auth error:", error);
    if (!wantsJson) return redirectTo(accountUrl(request, "en", "failed"));
    return NextResponse.json({ error: "failed" }, { status: 500 });
  }
}

export async function DELETE() {
  await clearGuestCookie();
  return NextResponse.json({ ok: true });
}
