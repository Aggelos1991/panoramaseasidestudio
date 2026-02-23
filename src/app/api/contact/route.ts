import { NextRequest, NextResponse } from "next/server";
import { contactFormSchema } from "@/lib/validators";
import { prisma } from "@/lib/prisma";
import { encrypt } from "@/lib/gdpr-crypto";

export async function POST(request: NextRequest) {
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
          subject: subject || null,
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
