import { NextRequest, NextResponse } from "next/server";
import { createRateLimiter, getClientIp, rateLimitResponse } from "@/lib/rate-limit";
import { listBlockedDates, listBookings, listExternalBookings, listRooms } from "@/lib/store";

const limiter = createRateLimiter({ maxRequests: 60, windowMs: 60_000 });
const CLOSED_MONTHS = new Set([11, 12, 1, 2, 3]);
const DAY = /^\d{4}-\d{2}-\d{2}$/;

function utcDay(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function addUtcDay(iso: string): string {
  const date = new Date(iso + "T00:00:00.000Z");
  date.setUTCDate(date.getUTCDate() + 1);
  return date.toISOString().slice(0, 10);
}

function eachIsoDay(from: string, to: string): string[] {
  const days: string[] = [];
  let cursor = from;
  while (cursor <= to) {
    days.push(cursor);
    cursor = addUtcDay(cursor);
  }
  return days;
}

type NightStatus = "open" | "busy" | "full" | "closed";

export async function GET(request: NextRequest) {
  const rl = limiter(`public-calendar:${getClientIp(request)}`);
  if (!rl.success) return rateLimitResponse(rl.resetMs);

  const from = request.nextUrl.searchParams.get("from") || "";
  const to = request.nextUrl.searchParams.get("to") || "";
  if (!DAY.test(from) || !DAY.test(to) || from > to) {
    return NextResponse.json({ error: "from and to must be YYYY-MM-DD" }, { status: 400 });
  }

  const span = eachIsoDay(from, to);
  if (span.length > 120) {
    return NextResponse.json({ error: "Range is too long" }, { status: 400 });
  }

  try {
    const rangeStart = new Date(from + "T00:00:00.000Z");
    const rangeEnd = new Date(to + "T00:00:00.000Z");

    const [rooms, bookings, external, blocked] = await Promise.all([
      listRooms({ activeOnly: true }),
      listBookings(
        { status: "CONFIRMED", checkInLte: rangeEnd, checkOutGt: rangeStart },
        { take: 2000 },
      ),
      listExternalBookings({ checkInLte: rangeEnd, checkOutGt: rangeStart }),
      listBlockedDates(rangeStart, rangeEnd),
    ]);

    const blockedKeys = new Set(
      blocked.map((entry) => `${entry.roomId}:${utcDay(entry.date)}`),
    );

    const dates: Record<string, NightStatus> = {};

    for (const key of span) {
      const month = Number(key.slice(5, 7));
      if (CLOSED_MONTHS.has(month)) {
        dates[key] = "closed";
        continue;
      }

      if (rooms.length === 0) {
        dates[key] = "open";
        continue;
      }

      let anyTaken = false;
      let allFull = true;

      for (const room of rooms) {
        let taken = 0;
        for (const booking of bookings) {
          if (booking.roomId !== room.id) continue;
          const start = utcDay(booking.checkIn);
          const end = utcDay(booking.checkOut);
          if (key >= start && key < end) taken += 1;
        }
        for (const booking of external) {
          if (booking.roomId !== room.id) continue;
          const start = utcDay(booking.checkIn);
          const end = utcDay(booking.checkOut);
          if (key >= start && key < end) taken += 1;
        }
        if (blockedKeys.has(`${room.id}:${key}`)) taken = room.totalUnits;
        if (taken > 0) anyTaken = true;
        if (taken < room.totalUnits) allFull = false;
      }

      dates[key] = allFull ? "full" : anyTaken ? "busy" : "open";
    }

    return NextResponse.json({ dates });
  } catch (error) {
    console.error("Public calendar error:", error);
    return NextResponse.json({ dates: {} });
  }
}
