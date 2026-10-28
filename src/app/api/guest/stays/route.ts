import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getGuestSession } from "@/lib/auth";
import { format } from "date-fns";

export async function GET() {
  const session = await getGuestSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const bookings = await prisma.booking.findMany({
    where: { guestId: session.id },
    include: {
      room: { select: { nameEn: true, nameEl: true, nameDe: true, slug: true } },
    },
    orderBy: { checkIn: "desc" },
  });

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
      room: booking.room,
    })),
  });
}
