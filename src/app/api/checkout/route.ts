import { NextRequest, NextResponse } from "next/server";
import { stripe, stripeTestGate } from "@/lib/stripe";
import { findUserById } from "@/lib/identity";
import {
  isStoreUnavailable,
  referenceExists,
  reserveBooking,
  updateBooking,
} from "@/lib/store";
import { generateReferenceNumber } from "@/lib/utils";
import { encrypt } from "@/lib/gdpr-crypto";
import { calculateStayPrice } from "@/lib/pricing";
import { createRateLimiter, getClientIp, rateLimitResponse } from "@/lib/rate-limit";
import { createBtcpayInvoice, isBtcpayConfigured } from "@/lib/btcpay";
import { getGuestSession } from "@/lib/auth";
import { validateBookingRequest } from "@/lib/stay-rules";
import { crossSiteResponse } from "@/lib/request-guard";

// 10 requests per minute — payment flow
const limiter = createRateLimiter({ maxRequests: 10, windowMs: 60_000 });

function parseStayDate(value: unknown): Date | null {
  if (typeof value !== "string") return null;
  const day = value.split("T")[0];
  if (!/^\d{4}-\d{2}-\d{2}$/.test(day)) return null;
  return new Date(`${day}T00:00:00.000Z`);
}

function normalizePaymentMethod(value: unknown): "card" | "btcpay" | null {
  if (value === "card" || value === "stripe") return "card";
  if (value === "btcpay" || value === "btc" || value === "bitcoin") return "btcpay";
  return null;
}

export async function POST(request: NextRequest) {
  const blocked = crossSiteResponse(request);
  if (blocked) return blocked;

  const rl = limiter(`checkout:${getClientIp(request)}`);
  if (!rl.success) return rateLimitResponse(rl.resetMs);

  try {
    const body = await request.json();
    const paymentMethod =
      body.paymentMethod == null ? "card" : normalizePaymentMethod(body.paymentMethod);
    if (!paymentMethod) {
      return NextResponse.json({ error: "Unknown payment method" }, { status: 400 });
    }
    if (paymentMethod === "card") {
      const gate = stripeTestGate();
      if (!gate.ok) {
        return NextResponse.json({ error: gate.error }, { status: gate.status });
      }
    }
    if (paymentMethod === "btcpay" && !isBtcpayConfigured()) {
      return NextResponse.json(
        { error: "Bitcoin payments are not available" },
        { status: 503 },
      );
    }

    const checkInDate = parseStayDate(body.checkIn);
    const checkOutDate = parseStayDate(body.checkOut);
    if (!body.roomId || typeof body.roomId !== "string" || !checkInDate || !checkOutDate) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Client totals are ignored. Price is calculated below from the room record.
    const rules = validateBookingRequest({
      guests: body.guests,
      checkIn: checkInDate,
      checkOut: checkOutDate,
      firstName: body.firstName,
      lastName: body.lastName,
      email: body.email,
      phone: body.phone,
      country: body.country,
      specialRequests: body.specialRequests,
      dateOfBirth: body.dateOfBirth,
      age: body.age,
      pets: body.pets,
      arrivalTime: body.arrivalTime,
      departureTime: body.departureTime,
    });
    if (!rules.ok) {
      return NextResponse.json({ error: rules.error }, { status: rules.status });
    }
    const guest = rules.guest;
    const locale = body.locale === "el" || body.locale === "de" ? body.locale : "en";

    // SERVER-SIDE price calculation — never trust client-submitted prices
    const { totalPrice, nights } = await calculateStayPrice(
      body.roomId,
      checkInDate,
      checkOutDate,
    );

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

    const checkInLabel = checkInDate.toISOString().slice(0, 10);
    const booking = await reserveBooking({
      referenceNumber,
      roomId: body.roomId,
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
      paymentMethod,
      paymentNotes: `check-in ${checkInLabel} from 14:00 until midnight; check-out by 12:00`,
    });

    // APP_URL is read at runtime (NEXT_PUBLIC_* gets inlined at build time)
    const appUrl = process.env.APP_URL || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const checkOutLabel = checkOutDate.toISOString().slice(0, 10);

    // ─── Bitcoin via BTCPay Server ───
    if (paymentMethod === "btcpay") {
      try {
        const invoice = await createBtcpayInvoice({
          amount: Number(totalPrice),
          bookingId: booking.id,
          referenceNumber: booking.referenceNumber,
          redirectUrl: `${appUrl}/${locale}/booking/success?ref=${booking.referenceNumber}`,
          buyerEmail: guest.email,
        });

        await updateBooking(booking.id, { btcpayInvoiceId: invoice.id, paymentMethod: "btcpay" });

        // Guest notifications are sent from the BTCPay webhook once the
        // invoice settles — bitcoin payments are not instant.
        return NextResponse.json({ url: invoice.checkoutLink });
      } catch (err) {
        // Release the room hold — no invoice means no way to pay
        await updateBooking(booking.id, { status: "CANCELLED" }).catch(() => {});
        throw err;
      }
    }

    // ─── Card / Apple Pay / Google Pay / PayPal via Stripe Checkout ───
    // The amount is the server total. payment_method_types is omitted so
    // Stripe offers the methods enabled in the Dashboard.
    let session;
    try {
      session = await stripe.checkout.sessions.create({
        mode: "payment",
        customer_email: guest.email,
        line_items: [
          {
            price_data: {
              currency: "eur",
              product_data: {
                name: booking.room?.nameEn || "Stay",
                description: `${nights} night${nights > 1 ? "s" : ""} · Check-in: ${checkInLabel} · Check-out: ${checkOutLabel}`,
              },
              unit_amount: Math.round(Number(totalPrice) * 100),
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
    } catch (err) {
      await updateBooking(booking.id, { status: "CANCELLED", paymentStatus: "PENDING" }).catch(() => {});
      throw err;
    }

    if (!session.url) {
      await updateBooking(booking.id, { status: "CANCELLED", paymentStatus: "PENDING" }).catch(() => {});
      return NextResponse.json(
        { error: "Failed to create checkout session" },
        { status: 500 },
      );
    }

    await updateBooking(booking.id, { stripeSessionId: session.id, paymentMethod: "card" });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error("Checkout error:", error);
    const message = error instanceof Error ? error.message : "Failed to create checkout";

    if (isStoreUnavailable(error)) {
      return NextResponse.json({ error: "Bookings are temporarily unavailable" }, { status: 503 });
    }

    if (
      message === "Room no longer available" ||
      message === "Some dates are blocked" ||
      message === "Each room allows at most 2 guests" ||
      message === "Room not found"
    ) {
      return NextResponse.json({ error: message }, { status: message === "Room not found" ? 404 : 409 });
    }

    return NextResponse.json(
      { error: "Failed to create checkout session" },
      { status: 500 },
    );
  }
}
