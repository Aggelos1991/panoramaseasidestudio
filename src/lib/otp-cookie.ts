import { cookies } from "next/headers";
import type { OtpPurpose } from "@/lib/identity";

const EMAIL_COOKIE = "guest_otp_email";
const PURPOSE_COOKIE = "guest_otp_purpose";

function options() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    maxAge: 60 * 10,
    path: "/",
  };
}

export async function setPendingOtp(email: string, purpose: OtpPurpose) {
  const store = await cookies();
  store.set(EMAIL_COOKIE, email, options());
  store.set(PURPOSE_COOKIE, purpose, options());
}

export async function readPendingOtp(): Promise<{ email: string; purpose: OtpPurpose | null }> {
  const store = await cookies();
  const purpose = store.get(PURPOSE_COOKIE)?.value;
  return {
    email: store.get(EMAIL_COOKIE)?.value || "",
    purpose: purpose === "register" || purpose === "signin" ? purpose : null,
  };
}

export async function clearPendingOtp() {
  const store = await cookies();
  store.delete(EMAIL_COOKIE);
  store.delete(PURPOSE_COOKIE);
}
