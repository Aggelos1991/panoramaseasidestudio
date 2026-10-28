import { NextResponse } from "next/server";
import { getGuestSession } from "@/lib/auth";
import { format } from "date-fns";
import { isMongoConfigured } from "@/lib/mongo";
import { listBookings } from "@/lib/store";

export async function GET() {
  const session = await getGuestSession();
  if (!session?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!isMongoConfigured()) {
    return NextResponse.json(
      { error: "unavailable", message: "Account sign-in is temporarily unavailable." },
      { status: 503 },
    );
  }

  const bookings = await listBookings(
    { guestId: String(session.id) },
    { includeRoom: true, sort: "checkIn" },
  );

  return NextResponse.json({
    stays: bookings.map((booking) => ({
      id: booking.id,
      referenceNumber: booking.referenceNumber,
      checkIn: format(booking.checkIn, "yyyy-MM-dd"),
      checkOut: format(booking.checkOut, "yyyy-MM-dd"),
      nights: booking.nights,
      guests: booking.guests,
      status: booking.status,
      totalPrice: Number(booking.totalPrice),
      currency: booking.currency,
      room: booking.room
        ? {
            nameEn: booking.room.nameEn,
            nameEl: booking.room.nameEl,
            nameDe: booking.room.nameDe,
            slug: booking.room.slug,
          }
        : null,
    })),
  });
}
