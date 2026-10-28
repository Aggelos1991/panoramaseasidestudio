import { NextRequest, NextResponse } from "next/server";
import { stripe, stripeTestGate } from "@/lib/stripe";
import type Stripe from "stripe";
import { chargeMatchesCents, markBookingPaid } from "@/lib/booking-payment";
import { findBooking, updateBookings } from "@/lib/store";

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get("stripe-signature");

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!signature) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }
  if (!webhookSecret) {
    console.error("STRIPE_WEBHOOK_SECRET is not configured");
    return NextResponse.json(
      { error: "Webhook not configured" },
      { status: 500 },
    );
  }
  const gate = stripeTestGate();
  if (!gate.ok) {
    return NextResponse.json({ error: gate.error }, { status: gate.status });
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch {
    console.error("Webhook signature verification failed");
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  if (event.livemode) {
    return NextResponse.json({ error: "Live mode events are not accepted" }, { status: 400 });
  }

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      if (session.livemode) {
        return NextResponse.json({ error: "Live mode events are not accepted" }, { status: 400 });
      }
      if (session.payment_status !== "paid" || session.currency !== "eur") break;

      const booking = await findBooking({ stripeSessionId: session.id });
      if (!booking) break;
      if (session.metadata?.bookingId && session.metadata.bookingId !== booking.id) {
        return NextResponse.json({ error: "Booking mismatch" }, { status: 400 });
      }
      if (!chargeMatchesCents(Number(booking.totalPrice), session.amount_total)) {
        console.error("Stripe amount mismatch", booking.id);
        return NextResponse.json({ error: "Amount mismatch" }, { status: 400 });
      }

      await markBookingPaid(booking.id, {
        paymentMethod: "card",
        stripePaymentId:
          typeof session.payment_intent === "string" ? session.payment_intent : null,
      });
      break;
    }

    case "checkout.session.expired": {
      const session = event.data.object as Stripe.Checkout.Session;
      await updateBookings(
        { stripeSessionId: session.id, paymentStatusNot: "PAID" },
        { status: "CANCELLED" },
      );
      break;
    }
  }

  return NextResponse.json({ received: true });
}
