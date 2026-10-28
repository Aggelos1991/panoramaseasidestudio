import { NextRequest, NextResponse } from "next/server";
import { generateReferenceNumber } from "@/lib/utils";
import { findUserById } from "@/lib/identity";
import {
  countBookings,
  isStoreUnavailable,
  listBookings,
  referenceExists,
  reserveBooking,
} from "@/lib/store";
import { encrypt, decryptPII, BOOKING_PII_FIELDS } from "@/lib/gdpr-crypto";
import { getAdminSession, getGuestSession } from "@/lib/auth";
import { calculateStayPrice } from "@/lib/pricing";
import { createRateLimiter, getClientIp, rateLimitResponse } from "@/lib/rate-limit";
import { validateBookingRequest } from "@/lib/stay-rules";

// 10 requests per minute — booking creation
const limiter = createRateLimiter({ maxRequests: 10, windowMs: 60_000 });

export async function POST(request: NextRequest) {
  const rl = limiter(`bookings:${getClientIp(request)}`);
  if (!rl.success) return rateLimitResponse(rl.resetMs);

  try {
    const body = await request.json();
    const {
      roomId,
      checkIn,
      checkOut,
      guests,
      firstName,
      lastName,
      email,
      phone,
      country,
      specialRequests,
      locale = "en",
    } = body;

    if (!roomId || !checkIn || !checkOut || !firstName || !lastName || !email) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    const ciStr = String(checkIn).split("T")[0];
    const coStr = String(checkOut).split("T")[0];
    const checkInDate = new Date(ciStr + "T00:00:00.000Z");
    const checkOutDate = new Date(coStr + "T00:00:00.000Z");

    const rules = validateBookingRequest({
      guests,
      checkIn: checkInDate,
      checkOut: checkOutDate,
      firstName,
      lastName,
      email,
      phone,
      country,
      specialRequests,
      dateOfBirth: body.dateOfBirth,
      age: body.age,
      pets: body.pets,
      arrivalTime: body.arrivalTime,
      departureTime: body.departureTime,
    });
    if (!rules.ok) {
      return NextResponse.json({ error: rules.error }, { status: rules.status });
    }

    const { totalPrice, nights } = await calculateStayPrice(
      roomId,
      checkInDate,
      checkOutDate,
    );

    const guest = rules.guest;
    const guestSession = await getGuestSession();
    let guestId: string | null = null;
    if (guestSession?.id) {
      const linked = await findUserById(String(guestSession.id)).catch(() => null);
      if (linked?.role === "guest" && linked.status === "active") guestId = String(linked._id);
    }

    let referenceNumber = generateReferenceNumber();
    for (let attempts = 0; attempts < 10; attempts++) {
      if (!(await referenceExists(referenceNumber))) break;
      referenceNumber = generateReferenceNumber();
    }

    const booking = await reserveBooking({
      referenceNumber,
      roomId,
      checkIn: checkInDate,
      checkOut: checkOutDate,
      nights,
      guests: guest.guests,
      totalPrice,
      guestFirstName: encrypt(guest.firstName),
      guestLastName: encrypt(guest.lastName),
      guestEmail: encrypt(guest.email),
      guestPhone: guest.phone ? encrypt(guest.phone) : null,
      guestCountry: guest.country ? encrypt(guest.country) : null,
      specialRequests: guest.specialRequests ? encrypt(guest.specialRequests) : null,
      locale,
      guestId,
      paymentMethod: null,
      paymentNotes: "check-in from 14:00 until midnight; check-out by 12:00",
    });

    return NextResponse.json({
      bookingId: booking.id,
      referenceNumber: booking.referenceNumber,
    });
  } catch (error) {
    console.error("Booking creation error:", error);
    const message =
      error instanceof Error ? error.message : "Failed to create booking";

    if (isStoreUnavailable(error)) {
      return NextResponse.json({ error: "Bookings are temporarily unavailable" }, { status: 503 });
    }

    if (
      message === "Room no longer available" ||
      message === "Some dates are blocked" ||
      message === "Each room allows at most 2 guests"
    ) {
      return NextResponse.json(
        { error: message },
        { status: message === "Each room allows at most 2 guests" ? 400 : 409 },
      );
    }

    return NextResponse.json(
      { error: "Failed to create booking" },
      { status: 500 },
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getAdminSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const page = Math.max(parseInt(searchParams.get("page") || "1") || 1, 1);
    const limit = Math.min(
      Math.max(parseInt(searchParams.get("limit") || "20") || 20, 1),
      100,
    );

    const where = status ? { status } : {};

    const [rawBookings, total] = await Promise.all([
      listBookings(where, {
        includeRoom: true,
        skip: (page - 1) * limit,
        take: limit,
      }),
      countBookings(where),
    ]);

    const bookings = rawBookings.map((b) =>
      decryptPII(b as unknown as Record<string, unknown>, [...BOOKING_PII_FIELDS]),
    );

    return NextResponse.json({
      bookings,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Bookings fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch bookings" },
      { status: 500 },
    );
  }
}
