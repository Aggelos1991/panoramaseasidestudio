import { format } from "date-fns";

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;

type InternalBooking = {
  type: "internal";
  guestName: string;
  roomName: string;
  checkIn: Date;
  checkOut: Date;
  nights: number;
  totalPrice: number;
  referenceNumber: string;
};

type ExternalBooking = {
  type: "external";
  summary: string;
  roomName: string;
  platform: string;
  checkIn: Date;
  checkOut: Date;
  nights: number;
};

type BookingNotification = InternalBooking | ExternalBooking;

const PLATFORM_NAMES: Record<string, string> = {
  BOOKING_COM: "Booking.com",
  AIRBNB: "Airbnb",
  EXPEDIA: "Expedia",
  VRBO: "Vrbo",
  OTHER: "Other",
};

function esc(text: string): string {
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function buildMessage(n: BookingNotification): string {
  if (n.type === "internal") {
    return [
      `<b>🏨 New Direct Booking!</b>`,
      ``,
      `<b>Guest:</b> ${esc(n.guestName)}`,
      `<b>Room:</b> ${esc(n.roomName)}`,
      `<b>Check-in:</b> ${format(n.checkIn, "dd MMM yyyy")}`,
      `<b>Check-out:</b> ${format(n.checkOut, "dd MMM yyyy")}`,
      `<b>Nights:</b> ${n.nights}`,
      `<b>Total:</b> €${n.totalPrice.toFixed(2)}`,
      `<b>Ref:</b> ${n.referenceNumber}`,
    ].join("\n");
  }

  return [
    `<b>🏨 New Channel Booking!</b>`,
    ``,
    `<b>Guest:</b> ${esc(n.summary)}`,
    `<b>Room:</b> ${esc(n.roomName)}`,
    `<b>Check-in:</b> ${format(n.checkIn, "dd MMM yyyy")}`,
    `<b>Check-out:</b> ${format(n.checkOut, "dd MMM yyyy")}`,
    `<b>Nights:</b> ${n.nights}`,
    `<b>Source:</b> ${PLATFORM_NAMES[n.platform] || n.platform}`,
  ].join("\n");
}

export async function sendBookingNotification(
  notification: BookingNotification,
): Promise<void> {
  if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) {
    console.warn("Telegram not configured — skipping notification");
    return;
  }

  try {
    const res = await fetch(
      `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: TELEGRAM_CHAT_ID,
          text: buildMessage(notification),
          parse_mode: "HTML",
        }),
      },
    );

    if (!res.ok) {
      const body = await res.text();
      console.error("Telegram notification failed:", res.status, body);
    }
  } catch (error) {
    console.error("Telegram notification error:", error);
  }
}
