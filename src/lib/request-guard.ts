import { NextResponse } from "next/server";

/**
 * Cookie auth is SameSite=Lax, so cross-site form posts do not include the
 * session cookie. Reject explicit cross-site fetches as well. Requests with
 * no Origin (curl, server-to-server) are allowed.
 */
export function crossSiteResponse(request: Request): NextResponse | null {
  const fetchSite = request.headers.get("sec-fetch-site");
  if (fetchSite === "cross-site") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const origin = request.headers.get("origin");
  if (!origin) return null;

  const host = request.headers.get("x-forwarded-host") || request.headers.get("host");
  try {
    if (!host || new URL(origin).host !== host) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  } catch {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  return null;
}
