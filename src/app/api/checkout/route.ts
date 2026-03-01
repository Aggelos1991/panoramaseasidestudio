import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";
import { generateReferenceNumber } from "@/lib/utils";
import { parseISO } from "date-fns";
import { encrypt } from "@/lib/gdpr-crypto";
import { isInClosedSeason } from "@/lib/closed-season";
import { sendBookingNotification } from "@/lib/telegram";
import { sendBookingConfirmation } from "@/lib/email";

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

    // Ensure dates are parsed as UTC midnight to match DB storage
    const checkInDate = new Date(checkIn + "T00:00:00.000Z");
    const checkOutDate = new Date(checkOut + "T00:00:00.000Z");

    // Rooms closed Nov–Mar
    if (isInClosedSeason(checkInDate, checkOutDate)) {
      return NextResponse.json(
        { error: "Rooms are closed during this period (November – March)" },
        { status: 409 },
      );
    }

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

      const newBooking = await tx.booking.create({
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
        include: { room: true },
      });

      return newBooking;
    });

    // Create Stripe Checkout session
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "payment",
      customer_email: email,
      line_items: [
        {
          price_data: {
            currency: "eur",
            product_data: {
              name: booking.room.nameEn,
              description: `${nights} night${nights > 1 ? "s" : ""} · Check-in: ${checkIn.split("T")[0]} · Check-out: ${checkOut.split("T")[0]}`,
            },
            unit_amount: Math.round(Number(totalPrice) * 100), // Stripe uses cents
          },
          quantity: 1,
        },
      ],
      metadata: {
        bookingId: booking.id,
        referenceNumber: booking.referenceNumber,
      },
      success_url: `${appUrl}/${locale}/booking/success?ref=${booking.referenceNumber}&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/${locale}/booking/cancel`,
    });

    // Save Stripe session ID on booking
    await prisma.booking.update({
      where: { id: booking.id },
      data: { stripeSessionId: session.id },
    });

    // Telegram notification (fire-and-forget)
    sendBookingNotification({
      type: "internal",
      guestName: `${firstName} ${lastName}`,
      roomName: booking.room.nameEn,
      checkIn: booking.checkIn,
      checkOut: booking.checkOut,
      nights: booking.nights,
      totalPrice: Number(booking.totalPrice),
      referenceNumber: booking.referenceNumber,
    }).catch(() => {});

    // Confirmation email to guest (fire-and-forget)
    sendBookingConfirmation({
      guestName: `${firstName} ${lastName}`,
      guestEmail: email,
      roomName: booking.room.nameEn,
      checkIn: booking.checkIn,
      checkOut: booking.checkOut,
      nights: booking.nights,
      totalPrice: Number(booking.totalPrice),
      referenceNumber: booking.referenceNumber,
    }).catch(() => {});

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error("Checkout error:", error);
    const message =
      error instanceof Error ? error.message : "Failed to create checkout";

    if (
      message === "Room no longer available" ||
      message === "Some dates are blocked"
    ) {
      return NextResponse.json({ error: message }, { status: 409 });
    }

    return NextResponse.json(
      { error: "Failed to create checkout session" },
      { status: 500 },
    );
  }
}
