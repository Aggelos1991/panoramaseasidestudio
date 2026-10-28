import { NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";
import { isBtcpayConfigured } from "@/lib/btcpay";

export const dynamic = "force-dynamic";

// Which payment options the booking page should offer.
// PayPal rides on Stripe and only appears once activated in the Stripe
// Dashboard (Settings → Payment methods), so we ask Stripe rather than
// hardcoding it. Cached because the answer rarely changes.
let paypalCache: { value: boolean; at: number } | null = null;
const PAYPAL_CACHE_MS = 5 * 60 * 1000;

async function isPaypalActive(): Promise<boolean> {
  if (paypalCache && Date.now() - paypalCache.at < PAYPAL_CACHE_MS) {
    return paypalCache.value;
  }
  let value = false;
  try {
    const configs = await getStripe().paymentMethodConfigurations.list({
      limit: 100,
    });
    value = configs.data.some(
      (c) => c.active && c.paypal?.display_preference?.value === "on",
    );
  } catch {
    value = false;
  }
  paypalCache = { value, at: Date.now() };
  return value;
}

export async function GET() {
  const stripeConfigured = Boolean(process.env.STRIPE_SECRET_KEY);
  return NextResponse.json({
    card: stripeConfigured,
    wallets: stripeConfigured, // Apple Pay / Google Pay via Stripe Checkout
    paypal: stripeConfigured ? await isPaypalActive() : false,
    btcpay: isBtcpayConfigured(),
  });
}
