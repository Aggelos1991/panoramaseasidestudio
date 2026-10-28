import crypto from "crypto";

// BTCPay Server (Greenfield API) integration.
// Requires a self-hosted or third-party BTCPay Server instance:
//   BTCPAY_URL            e.g. https://btcpay.example.com
//   BTCPAY_STORE_ID       store ID from the BTCPay dashboard
//   BTCPAY_API_KEY        Greenfield API key with btcpay.store.cancreateinvoice
//   BTCPAY_WEBHOOK_SECRET secret set on the store webhook pointing to /api/webhooks/btcpay

export function isBtcpayConfigured(): boolean {
  return Boolean(
    process.env.BTCPAY_URL &&
      process.env.BTCPAY_STORE_ID &&
      process.env.BTCPAY_API_KEY,
  );
}

type CreateInvoiceInput = {
  amount: number; // EUR
  bookingId: string;
  referenceNumber: string;
  redirectUrl: string;
  buyerEmail?: string;
};

export type BtcpayInvoice = {
  id: string;
  checkoutLink: string;
};

export async function createBtcpayInvoice(
  input: CreateInvoiceInput,
): Promise<BtcpayInvoice> {
  if (!isBtcpayConfigured()) {
    throw new Error("BTCPay is not configured");
  }

  const base = process.env.BTCPAY_URL!.replace(/\/$/, "");
  const res = await fetch(
    `${base}/api/v1/stores/${process.env.BTCPAY_STORE_ID}/invoices`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `token ${process.env.BTCPAY_API_KEY}`,
      },
      body: JSON.stringify({
        amount: input.amount.toFixed(2),
        currency: "EUR",
        metadata: {
          bookingId: input.bookingId,
          orderId: input.referenceNumber,
          buyerEmail: input.buyerEmail,
        },
        checkout: {
          redirectURL: input.redirectUrl,
          redirectAutomatically: true,
        },
      }),
    },
  );

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`BTCPay invoice creation failed (${res.status}): ${text}`);
  }

  const data = await res.json();
  return { id: data.id, checkoutLink: data.checkoutLink };
}

// BTCPay signs webhook bodies with HMAC-SHA256 of the raw payload,
// sent as "BTCPay-Sig: sha256=<hex>".
export function verifyBtcpaySignature(
  rawBody: string,
  signatureHeader: string | null,
): boolean {
  const secret = process.env.BTCPAY_WEBHOOK_SECRET;
  if (!secret || !signatureHeader) return false;

  const expected =
    "sha256=" +
    crypto.createHmac("sha256", secret).update(rawBody, "utf8").digest("hex");

  const a = Buffer.from(signatureHeader);
  const b = Buffer.from(expected);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}
