import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateReferenceNumber } from "@/lib/utils";
import { parseISO } from "date-fns";
import { encrypt, decryptPII, BOOKING_PII_FIELDS } from "@/lib/gdpr-crypto";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      roomId,
      checkIn,
      checkOut,
      guests,
      nights,
      totalPrice,
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

    const checkInDate = parseISO(checkIn);
    const checkOutDate = parseISO(checkOut);

    // For fallback rooms (no DB), create a lightweight response
    if (roomId.startsWith("fallback-")) {
      const referenceNumber = generateReferenceNumber();
      return NextResponse.json({
        bookingId: `pending-${referenceNumber}`,
        referenceNumber,
      });
    }

    // Use a transaction to prevent double booking
    const booking = await prisma.$transaction(async (tx) => {
      const room = await tx.room.findUnique({
        where: { id: roomId },
      });

      if (!room) {
        throw new Error("Room not found");
      }

      const overlappingBookings = await tx.booking.count({
        where: {
          roomId,
          status: { in: ["PENDING", "CONFIRMED"] },
          checkIn: { lt: checkOutDate },
          checkOut: { gt: checkInDate },
        },
      });

      if (overlappingBookings >= room.totalUnits) {
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
          status: "PENDING",
          paymentStatus: "UNPAID",
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
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");

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
