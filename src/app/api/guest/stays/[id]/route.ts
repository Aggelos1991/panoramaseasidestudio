import { NextRequest, NextResponse } from "next/server";
import { format } from "date-fns";
import { getGuestSession } from "@/lib/auth";
import { isMongoConfigured } from "@/lib/mongo";
import { findBooking, updateBookings, type BookingRecord } from "@/lib/store";

export const dynamic = "force-dynamic";

function ownStayId(id: string): boolean {
  return /^[a-zA-Z0-9_-]{8,40}$/.test(id);
}

function unavailable() {
  return NextResponse.json(
    { error: "unavailable", message: "Account sign-in is temporarily unavailable." },
    { status: 503 },
  );
}

async function ownedStay(id: string, guestId: string) {
  return findBooking({ id, guestId }, true);
}

function present(booking: BookingRecord) {
  return {
    id: booking.id,
    referenceNumber: booking.referenceNumber,
    checkIn: format(booking.checkIn, "yyyy-MM-dd"),
    checkOut: format(booking.checkOut, "yyyy-MM-dd"),
    nights: booking.nights,
    guests: booking.guests,
    status: booking.status,
    paymentStatus: booking.paymentStatus,
    room: booking.room
      ? {
          nameEn: booking.room.nameEn,
          nameEl: booking.room.nameEl,
          nameDe: booking.room.nameDe,
          slug: booking.room.slug,
        }
      : null,
  };
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getGuestSession();
  if (!session?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!isMongoConfigured()) return unavailable();

  const { id } = await params;
  if (!ownStayId(id)) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const booking = await ownedStay(id, session.id);
  if (!booking) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json({ stay: present(booking) });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getGuestSession();
  if (!session?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!isMongoConfigured()) return unavailable();

  const { id } = await params;
  if (!ownStayId(id)) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  let body: { status?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  if (body.status !== "CANCELLED") {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const updated = await updateBookings(
    { id, guestId: session.id, status: "CONFIRMED" },
    { status: "CANCELLED" },
  );
  if (updated !== 1) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const booking = await ownedStay(id, session.id);
  if (!booking) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json({ stay: present(booking) });
}
