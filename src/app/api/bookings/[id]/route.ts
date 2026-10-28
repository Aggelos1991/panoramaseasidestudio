import { NextRequest, NextResponse } from "next/server";
import { decryptPII, BOOKING_PII_FIELDS } from "@/lib/gdpr-crypto";
import { findBooking, updateBooking } from "@/lib/store";
import { getAdminSession } from "@/lib/auth";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await getAdminSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const booking = await findBooking({ id }, true);

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
    const session = await getAdminSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { status, paymentStatus } = body;

    const VALID_STATUSES = ["CONFIRMED", "CANCELLED"];
    const VALID_PAYMENT = ["PAID", "REFUNDED"];

    const data: Record<string, unknown> = {};
    if (status) {
      if (!VALID_STATUSES.includes(status)) {
        return NextResponse.json({ error: "Invalid status" }, { status: 400 });
      }
      data.status = status;
    }
    if (paymentStatus) {
      if (!VALID_PAYMENT.includes(paymentStatus)) {
        return NextResponse.json(
          { error: "Invalid payment status" },
          { status: 400 },
        );
      }
      data.paymentStatus = paymentStatus;
    }

    const booking = await updateBooking(id, data as {
      status?: "CONFIRMED" | "CANCELLED";
      paymentStatus?: "PAID" | "REFUNDED";
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
    console.error("Booking update error:", error);
    return NextResponse.json(
      { error: "Failed to update booking" },
      { status: 500 },
    );
  }
}
