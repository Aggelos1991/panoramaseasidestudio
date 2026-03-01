import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";
import type Stripe from "stripe";

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

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err) {
    console.error("Webhook signature verification failed:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;

      if (session.payment_status === "paid") {
        // Booking already CONFIRMED+PAID at creation — just save Stripe payment ID
        await prisma.booking.update({
          where: { stripeSessionId: session.id },
          data: {
            paymentMethod: "stripe",
            stripePaymentId: session.payment_intent as string,
          },
        });
      }
      break;
    }

    case "checkout.session.expired": {
      const session = event.data.object as Stripe.Checkout.Session;

      // Cancel abandoned checkout
      await prisma.booking.update({
        where: { stripeSessionId: session.id },
        data: {
          status: "CANCELLED",
        },
      });
      break;
    }
  }

  return NextResponse.json({ received: true });
}
