import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { decryptPII, BOOKING_PII_FIELDS } from "@/lib/gdpr-crypto";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const booking = await prisma.booking.findUnique({
      where: { id },
      include: { room: true },
    });

    if (!booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    const decrypted = decryptPII(
      booking as unknown as Record<string, unknown>,
      [...BOOKING_PII_FIELDS],
    );

    return NextResponse.json(decrypted);
  } catch (error) {
    console.error("Booking fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch booking" },
      { status: 500 },
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { status, paymentStatus } = body;

    const data: Record<string, unknown> = {};
    if (status) data.status = status;
    if (paymentStatus) data.paymentStatus = paymentStatus;

    const booking = await prisma.booking.update({
      where: { id },
      data,
    });

    const decrypted = decryptPII(
      booking as unknown as Record<string, unknown>,
      [...BOOKING_PII_FIELDS],
    );

    return NextResponse.json(decrypted);
  } catch (error) {
    console.error("Booking update error:", error);
    return NextResponse.json(
      { error: "Failed to update booking" },
      { status: 500 },
    );
  }
}
