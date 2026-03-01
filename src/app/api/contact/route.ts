import { NextRequest, NextResponse } from "next/server";
import { contactFormSchema } from "@/lib/validators";
import { prisma } from "@/lib/prisma";
import { encrypt } from "@/lib/gdpr-crypto";
import { createRateLimiter, getClientIp, rateLimitResponse } from "@/lib/rate-limit";

// 5 requests per minute — contact form submissions
const limiter = createRateLimiter({ maxRequests: 5, windowMs: 60_000 });

export async function POST(request: NextRequest) {
  const rl = limiter(`contact:${getClientIp(request)}`);
  if (!rl.success) return rateLimitResponse(rl.resetMs);

  try {
    const body = await request.json();

    const parsed = contactFormSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, errors: parsed.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    const { name, email, subject, message } = parsed.data;

    // Try to save to database, but don't fail if DB isn't connected
    try {
      await prisma.contactSubmission.create({
        data: {
          name: encrypt(name),
          email: encrypt(email),
          subject: subject ? encrypt(subject) : null,
          message: encrypt(message),
        },
      });
    } catch {
      // DB not connected — that's okay, just log and continue
      console.warn("Could not save contact submission to database");
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { success: false, error: "Invalid request" },
      { status: 400 },
    );
  }
}
