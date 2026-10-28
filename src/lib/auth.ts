import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { findUserByEmail } from "@/lib/identity";
import { isMongoConfigured } from "@/lib/mongo";

if (!process.env.JWT_SECRET) {
  throw new Error("JWT_SECRET environment variable is required");
}
const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET);

const COOKIE_NAME = "admin_token";
const ADMIN_MAX_AGE = 60 * 60 * 12;

function cookieSecure(): boolean {
  return process.env.NODE_ENV === "production";
}

export async function createToken(payload: { id: string; email: string }) {
  return new SignJWT({ ...payload, role: "admin" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("12h")
    .sign(JWT_SECRET);
}

export async function verifyToken(token: string) {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload as { id: string; email: string; role?: string; uid?: string };
  } catch {
    return null;
  }
}

async function mongoAccountBlocked(
  email: string,
  expectedRole: "guest" | "admin",
): Promise<boolean> {
  if (!isMongoConfigured()) return false;
  try {
    const user = await findUserByEmail(email);
    if (!user) return false;
    if (user.status !== "active" || user.role !== expectedRole) {
      const cookieStore = await cookies();
      cookieStore.delete(expectedRole === "guest" ? "guest_token" : COOKIE_NAME);
      return true;
    }
    return false;
  } catch {
    return false;
  }
}

export async function getAdminSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;
  const session = await verifyToken(token);
  if (!session || session.role === "guest") return null;
  if (session.email && (await mongoAccountBlocked(String(session.email), "admin"))) {
    return null;
  }
  return session;
}

export async function setAdminCookie(token: string) {
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: cookieSecure(),
    sameSite: "lax",
    maxAge: ADMIN_MAX_AGE,
    path: "/",
  });
}

export async function clearAdminCookie() {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}

const GUEST_COOKIE = "guest_token";

const GUEST_MAX_AGE = 60 * 60 * 24 * 7;

export async function createGuestToken(payload: { id: string; email: string; uid?: string }) {
  return new SignJWT({ ...payload, role: "guest" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(JWT_SECRET);
}

export async function getGuestSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(GUEST_COOKIE)?.value;
  if (!token) return null;
  const session = await verifyToken(token);
  if (!session || session.role !== "guest") return null;
  if (session.email && (await mongoAccountBlocked(String(session.email), "guest"))) {
    return null;
  }
  return session;
}

export async function setGuestCookie(token: string) {
  const cookieStore = await cookies();
  cookieStore.set(GUEST_COOKIE, token, {
    httpOnly: true,
    secure: cookieSecure(),
    sameSite: "lax",
    maxAge: GUEST_MAX_AGE,
    path: "/",
  });
}

export async function clearGuestCookie() {
  const cookieStore = await cookies();
  cookieStore.delete(GUEST_COOKIE);
}
