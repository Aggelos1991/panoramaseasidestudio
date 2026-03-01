import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateReferenceNumber } from "@/lib/utils";
import { encrypt, decryptPII, BOOKING_PII_FIELDS } from "@/lib/gdpr-crypto";
import { getAdminSession } from "@/lib/auth";
import { calculateStayPrice } from "@/lib/pricing";
import { createRateLimiter, getClientIp, rateLimitResponse } from "@/lib/rate-limit";

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

    // Ensure dates are parsed as UTC midnight to match DB storage
    // Handle both date-only ("2026-04-01") and ISO datetime strings
    const ciStr = String(checkIn).split("T")[0];
    const coStr = String(checkOut).split("T")[0];
    const checkInDate = new Date(ciStr + "T00:00:00.000Z");
    const checkOutDate = new Date(coStr + "T00:00:00.000Z");

    // Server-side price calculation — never trust client-submitted prices
    const { totalPrice, nights } = await calculateStayPrice(
      roomId,
      checkInDate,
      checkOutDate,
    );

    // Use a transaction to prevent double booking
    const booking = await prisma.$transaction(async (tx) => {
      const room = await tx.room.findUnique({
        where: { id: roomId },
      });

      if (!room) {
        throw new Error("Room not found");
      }

      const [overlappingBookings, overlappingExternal] = await Promise.all([
        tx.booking.count({
          where: {
            roomId,
            status: "CONFIRMED",
            checkIn: { lt: checkOutDate },
            checkOut: { gt: checkInDate },
          },
        }),
        tx.externalBooking.count({
          where: {
            roomId,
            checkIn: { lt: checkOutDate },
            checkOut: { gt: checkInDate },
          },
        }),
      ]);

      if (overlappingBookings + overlappingExternal >= room.totalUnits) {
        throw new Error("Room no longer available");
      }

      const blockedDates = await tx.blockedDate.count({
        where: {
          roomId,
          date: {
            gte: checkInDate,
            lt: checkOutDate,
          },
        },
      });

      if (blockedDates > 0) {
        throw new Error("Some dates are blocked");
      }

      let referenceNumber: string;
      let attempts = 0;
      do {
        referenceNumber = generateReferenceNumber();
        const existing = await tx.booking.findUnique({
          where: { referenceNumber },
        });
        if (!existing) break;
        attempts++;
      } while (attempts < 10);

      return tx.booking.create({
        data: {
          referenceNumber,
          roomId,
          checkIn: checkInDate,
          checkOut: checkOutDate,
          nights,
          guests,
          totalPrice,
          guestFirstName: encrypt(firstName),
          guestLastName: encrypt(lastName),
          guestEmail: encrypt(email),
          guestPhone: phone ? encrypt(phone) : null,
          guestCountry: country ? encrypt(country) : null,
          specialRequests: specialRequests ? encrypt(specialRequests) : null,
          gdprConsent: true,
          gdprConsentAt: new Date(),
          locale,
          status: "CONFIRMED",
          paymentStatus: "PAID",
        },
      });
    });

    return NextResponse.json({
      bookingId: booking.id,
      referenceNumber: booking.referenceNumber,
    });
  } catch (error) {
    console.error("Booking creation error:", error);
    const message =
      error instanceof Error ? error.message : "Failed to create booking";

    if (
      message === "Room no longer available" ||
      message === "Some dates are blocked"
    ) {
      return NextResponse.json({ error: message }, { status: 409 });
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

    const where: Record<string, unknown> = {};
    if (status) where.status = status;

    const [rawBookings, total] = await Promise.all([
      prisma.booking.findMany({
        where,
        include: { room: true },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.booking.count({ where }),
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
