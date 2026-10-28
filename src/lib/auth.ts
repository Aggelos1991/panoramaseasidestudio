import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

if (!process.env.JWT_SECRET) {
  throw new Error("JWT_SECRET environment variable is required");
}
const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET);

const COOKIE_NAME = "admin_token";

export async function createToken(payload: { id: string; email: string }) {
  return new SignJWT({ ...payload, role: "admin" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("24h")
    .sign(JWT_SECRET);
}

export async function verifyToken(token: string) {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload as { id: string; email: string; role?: string };
  } catch {
    return null;
  }
}

export async function getAdminSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;
  const session = await verifyToken(token);
  if (!session || session.role === "guest") return null;
  return session;
}

export async function setAdminCookie(token: string) {
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: (process.env.APP_URL || process.env.NEXT_PUBLIC_APP_URL || "").startsWith("https"),
    sameSite: "lax",
    maxAge: 60 * 60 * 24, // 24 hours
    path: "/",
  });
}

export async function clearAdminCookie() {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}

const GUEST_COOKIE = "guest_token";

export async function createGuestToken(payload: { id: string; email: string }) {
  return new SignJWT({ ...payload, role: "guest" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("30d")
    .sign(JWT_SECRET);
}

export async function getGuestSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(GUEST_COOKIE)?.value;
  if (!token) return null;
  const session = await verifyToken(token);
  if (!session || session.role !== "guest") return null;
  return session;
}

export async function setGuestCookie(token: string) {
  const cookieStore = await cookies();
  cookieStore.set(GUEST_COOKIE, token, {
    httpOnly: true,
    secure: (process.env.APP_URL || process.env.NEXT_PUBLIC_APP_URL || "").startsWith("https"),
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 30,
    path: "/",
  });
}

export async function clearGuestCookie() {
  const cookieStore = await cookies();
  cookieStore.delete(GUEST_COOKIE);
}
