import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyBtcpaySignature } from "@/lib/btcpay";
import { decrypt } from "@/lib/gdpr-crypto";
import { sendBookingNotification } from "@/lib/telegram";
import { sendBookingConfirmation } from "@/lib/email";

// BTCPay Server webhook (Greenfield). Configure on the store with the URL
// <app>/api/webhooks/btcpay and the secret from BTCPAY_WEBHOOK_SECRET.
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

  const booking = await prisma.booking.findUnique({
    where: { btcpayInvoiceId: event.invoiceId },
    include: { room: true },
  });

  if (!booking) {
    // Unknown invoice — acknowledge so BTCPay stops retrying
    return NextResponse.json({ received: true });
  }

  switch (event.type) {
    case "InvoiceSettled": {
      if (booking.paymentStatus !== "PAID") {
        await prisma.booking.update({
          where: { id: booking.id },
          data: { status: "CONFIRMED", paymentStatus: "PAID" },
        });

        // Notifications were deferred until settlement for bitcoin payments
        try {
          const guestName = `${decrypt(booking.guestFirstName)} ${decrypt(booking.guestLastName)}`;
          const guestEmail = decrypt(booking.guestEmail);
          const payload = {
            guestName,
            roomName: booking.room.nameEn,
            checkIn: booking.checkIn,
            checkOut: booking.checkOut,
            nights: booking.nights,
            totalPrice: Number(booking.totalPrice),
            referenceNumber: booking.referenceNumber,
          };
          sendBookingNotification({ type: "internal", ...payload }).catch(() => {});
          sendBookingConfirmation({ guestEmail, ...payload }).catch(() => {});
        } catch {
          // Decryption/notification failure must not fail the webhook
        }
      }
      break;
    }

    case "InvoiceExpired":
    case "InvoiceInvalid": {
      if (booking.paymentStatus !== "PAID") {
        await prisma.booking.update({
          where: { id: booking.id },
          data: { status: "CANCELLED" },
        });
      }
      break;
    }
  }

  return NextResponse.json({ received: true });
}
