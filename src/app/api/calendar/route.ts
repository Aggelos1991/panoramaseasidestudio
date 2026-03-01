import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { decryptPII, BOOKING_PII_FIELDS } from "@/lib/gdpr-crypto";
import { getAdminSession } from "@/lib/auth";
import { startOfMonth, endOfMonth, addDays, parseISO, format } from "date-fns";

const INTERNAL_COLOR = "#10b981"; // emerald-500

export async function GET(request: NextRequest) {
  try {
    const session = await getAdminSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const monthParam = request.nextUrl.searchParams.get("month");
    const monthDate = monthParam
      ? parseISO(monthParam + "-01")
      : new Date();

    const rangeStart = startOfMonth(monthDate);
    const rangeEnd = addDays(endOfMonth(monthDate), 1);

    const [bookings, externalBookings, rooms] = await Promise.all([
      prisma.booking.findMany({
        where: {
          status: "CONFIRMED",
          checkIn: { lt: rangeEnd },
          checkOut: { gt: rangeStart },
        },
        include: { room: { select: { id: true, nameEn: true } } },
      }),
      prisma.externalBooking.findMany({
        where: {
          checkIn: { lt: rangeEnd },
          checkOut: { gt: rangeStart },
        },
        include: {
          room: { select: { id: true, nameEn: true } },
          channel: { select: { color: true, platform: true } },
        },
      }),
      prisma.room.findMany({
        where: { isActive: true },
        select: { id: true, nameEn: true },
        orderBy: { sortOrder: "asc" },
      }),
    ]);

    const internalEvents = bookings.map((b) => {
      const decrypted = decryptPII(
        b as unknown as Record<string, unknown>,
        [...BOOKING_PII_FIELDS],
      ) as unknown as typeof b;
      return {
        id: b.id,
        type: "internal" as const,
        roomId: b.roomId,
        roomName: b.room.nameEn,
        label: `${decrypted.guestFirstName} ${decrypted.guestLastName}`,
        checkIn: format(b.checkIn, "yyyy-MM-dd"),
        checkOut: format(b.checkOut, "yyyy-MM-dd"),
        color: INTERNAL_COLOR,
        status: b.status,
      };
    });

    const externalEvents = externalBookings.map((eb) => ({
      id: eb.id,
      type: "external" as const,
      roomId: eb.roomId,
      roomName: eb.room.nameEn,
      label: eb.summary || "Reserved",
      checkIn: format(eb.checkIn, "yyyy-MM-dd"),
      checkOut: format(eb.checkOut, "yyyy-MM-dd"),
      color: eb.channel.color || "#6366f1",
      platform: eb.channel.platform,
    }));

    return NextResponse.json({
      events: [...internalEvents, ...externalEvents],
      rooms: rooms.map((r) => ({ id: r.id, name: r.nameEn })),
    });
  } catch (error) {
    console.error("Calendar API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch calendar data" },
      { status: 500 },
    );
  }
}
