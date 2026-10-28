import { NextRequest, NextResponse } from "next/server";
import { btcAmountMatches, getBtcpayInvoice, verifyBtcpaySignature } from "@/lib/btcpay";
import { markBookingPaid } from "@/lib/booking-payment";
import { findBooking, updateBooking } from "@/lib/store";

// BTCPay Server webhook (Greenfield). Configure on the store with the URL
// <app>/api/webhooks/btcpay and the secret from BTCPAY_WEBHOOK_SECRET.
// A booking is marked paid only after the signature checks and the invoice
// itself is Settled for the server-computed amount.
export async function POST(request: NextRequest) {
  const rawBody = await request.text();
  const signature = request.headers.get("btcpay-sig");

  if (!verifyBtcpaySignature(rawBody, signature)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  let event: { type?: string; invoiceId?: string };
  try {
    event = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  if (!event.invoiceId) {
    return NextResponse.json({ received: true });
  }

  const booking = await findBooking({ btcpayInvoiceId: event.invoiceId });

  if (!booking) {
    return NextResponse.json({ received: true });
  }

  switch (event.type) {
    case "InvoiceSettled": {
      if (booking.paymentStatus === "PAID") break;
      const invoice = await getBtcpayInvoice(event.invoiceId);
      if (!invoice) {
        return NextResponse.json(
          { error: "Invoice could not be confirmed" },
          { status: 503 },
        );
      }
      const settled =
        invoice.status === "Settled" &&
        invoice.currency.toUpperCase() === "EUR" &&
        btcAmountMatches(invoice.amount, Number(booking.totalPrice));
      if (!settled) {
        return NextResponse.json(
          { error: "Invoice does not match the booking" },
          { status: 400 },
        );
      }
      await markBookingPaid(booking.id, { paymentMethod: "btcpay" });
      break;
    }

    case "InvoiceExpired":
    case "InvoiceInvalid": {
      if (booking.paymentStatus !== "PAID") {
        await updateBooking(booking.id, { status: "CANCELLED" });
      }
      break;
    }
  }

  return NextResponse.json({ received: true });
}
