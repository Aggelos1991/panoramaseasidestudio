import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateICal } from "@/lib/ical";

type Params = { params: Promise<{ roomSlug: string }> };

// GET — export iCal feed for a room
export async function GET(_request: NextRequest, { params }: Params) {
  try {
    const { roomSlug } = await params;

    const room = await prisma.room.findUnique({
      where: { slug: roomSlug },
    });

    if (!room) {
      return NextResponse.json({ error: "Room not found" }, { status: 404 });
    }

    // Get all active bookings for this room
    const bookings = await prisma.booking.findMany({
      where: {
        roomId: room.id,
        status: "CONFIRMED",
      },
      select: {
        id: true,
        checkIn: true,
        checkOut: true,
      },
    });

    // Get external bookings from other channels for this room
    const externalBookings = await prisma.externalBooking.findMany({
      where: { roomId: room.id },
      select: {
        uid: true,
        summary: true,
        checkIn: true,
        checkOut: true,
      },
    });

    // Combine into iCal events
    const events = [
      ...bookings.map((b) => ({
        uid: `booking-${b.id}@panoramaseasidekos.com`,
        summary: `${room.nameEn} - Reserved`,
        checkIn: new Date(b.checkIn),
        checkOut: new Date(b.checkOut),
      })),
      ...externalBookings.map((eb) => ({
        uid: eb.uid,
        summary: eb.summary || "Reserved",
        checkIn: new Date(eb.checkIn),
        checkOut: new Date(eb.checkOut),
      })),
    ];

    const icsContent = generateICal(events, `Panorama - ${room.nameEn}`);

    return new NextResponse(icsContent, {
      headers: {
        "Content-Type": "text/calendar; charset=utf-8",
        "Content-Disposition": `attachment; filename="${roomSlug.replace(/[^a-z0-9-]/g, "")}.ics"`,
      },
    });
  } catch (error) {
    console.error("iCal export error:", error);
    return NextResponse.json(
      { error: "Failed to generate calendar" },
      { status: 500 },
    );
  }
}
