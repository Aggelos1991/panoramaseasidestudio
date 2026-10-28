import { decrypt } from "@/lib/gdpr-crypto";
import { sendBookingConfirmation } from "@/lib/email";
import { sendBookingNotification } from "@/lib/telegram";
import { findBooking, updateBookings } from "@/lib/store";

export function expectedChargeCents(total: number): number {
  return Math.round(Number(total) * 100);
}

export function chargeMatchesCents(total: number, amountCents: number | null | undefined): boolean {
  return amountCents != null && amountCents === expectedChargeCents(total);
}

/**
 * Mark a booking paid once. Notifications fire only on the transition into PAID,
 * so a webhook and the success page cannot each send a confirmation.
 */
export async function markBookingPaid(
  bookingId: string,
  extra: { paymentMethod: string; stripePaymentId?: string | null },
): Promise<boolean> {
  const existing = await findBooking({ id: bookingId }, true);
  if (!existing || existing.paymentStatus === "PAID" || existing.paymentStatus === "REFUNDED") {
    return false;
  }

  const updated = await updateBookings(
    { id: bookingId, paymentStatus: "PENDING" },
    {
      status: "CONFIRMED",
      paymentStatus: "PAID",
      paymentMethod: extra.paymentMethod,
      ...(extra.stripePaymentId ? { stripePaymentId: extra.stripePaymentId } : {}),
    },
  );

  if (updated !== 1) return false;

  try {
    const guestName = `${decrypt(existing.guestFirstName)} ${decrypt(existing.guestLastName)}`;
    const guestEmail = decrypt(existing.guestEmail);
    const payload = {
      guestName,
      roomName: existing.room?.nameEn || "Room",
      checkIn: existing.checkIn,
      checkOut: existing.checkOut,
      nights: existing.nights,
      totalPrice: Number(existing.totalPrice),
      referenceNumber: existing.referenceNumber,
    };
    sendBookingNotification({ type: "internal", ...payload }).catch(() => {});
    sendBookingConfirmation({ guestEmail, ...payload }).catch(() => {});
  } catch {
    // A notification failure must not undo a confirmed payment.
  }

  return true;
}
