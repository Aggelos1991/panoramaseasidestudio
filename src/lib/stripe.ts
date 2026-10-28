import Stripe from "stripe";

const LIVE_KEY_ERROR =
  "Live Stripe keys are not accepted. Use a test key that starts with sk_test_.";

export function stripeSecretKey(): string {
  return process.env.STRIPE_SECRET_KEY?.trim() || "";
}

/** Card checkout is offered only when a Stripe test secret key is configured. */
export function isStripeConfigured(): boolean {
  return stripeSecretKey().startsWith("sk_test_");
}

export function stripeTestGate():
  | { ok: true }
  | { ok: false; error: string; status: 400 | 503 } {
  const key = stripeSecretKey();
  if (!key) {
    return { ok: false, error: "Card payments are not configured", status: 503 };
  }
  if (!key.startsWith("sk_test_")) {
    return { ok: false, error: LIVE_KEY_ERROR, status: 400 };
  }
  return { ok: true };
}

let _stripe: Stripe | null = null;

export function getStripe(): Stripe {
  if (!_stripe) {
    const key = stripeSecretKey();
    if (!key.startsWith("sk_test_")) {
      throw new Error(key ? LIVE_KEY_ERROR : "STRIPE_SECRET_KEY is not set");
    }
    _stripe = new Stripe(key, {
      typescript: true,
    });
  }
  return _stripe;
}

export const stripe = new Proxy({} as Stripe, {
  get(_, prop) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (getStripe() as any)[prop];
  },
});
