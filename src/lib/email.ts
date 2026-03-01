import { Resend } from "resend";
import { format } from "date-fns";
import { HOTEL_INFO } from "./constants";

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

type BookingConfirmationData = {
  guestName: string;
  guestEmail: string;
  roomName: string;
  checkIn: Date;
  checkOut: Date;
  nights: number;
  totalPrice: number;
  referenceNumber: string;
};

function buildConfirmationHtml(data: BookingConfirmationData): string {
  const h = HOTEL_INFO;
  const checkIn = format(data.checkIn, "EEEE, d MMMM yyyy");
  const checkOut = format(data.checkOut, "EEEE, d MMMM yyyy");

  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f5f5f4;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f4;padding:40px 20px">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.06)">

        <!-- Header -->
        <tr><td style="background:#1a3a5c;padding:32px 40px;text-align:center">
          <h1 style="margin:0;color:#ffffff;font-size:22px;font-weight:700;letter-spacing:-0.3px">${h.name}</h1>
          <p style="margin:6px 0 0;color:rgba(255,255,255,0.6);font-size:13px">${h.location}</p>
        </td></tr>

        <!-- Confirmation badge -->
        <tr><td style="padding:32px 40px 0;text-align:center">
          <div style="display:inline-block;background:#ecfdf5;border:1px solid #a7f3d0;border-radius:8px;padding:10px 24px">
            <span style="color:#059669;font-size:14px;font-weight:600">Booking Confirmed</span>
          </div>
        </td></tr>

        <!-- Greeting -->
        <tr><td style="padding:24px 40px 0">
          <p style="margin:0;color:#1a1a1a;font-size:15px;line-height:1.6">
            Dear ${escapeHtml(data.guestName)},
          </p>
          <p style="margin:12px 0 0;color:#525252;font-size:14px;line-height:1.6">
            Thank you for choosing ${h.name}. We are pleased to confirm your reservation. Below you will find the details of your stay.
          </p>
        </td></tr>

        <!-- Booking details -->
        <tr><td style="padding:24px 40px">
          <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9fafb;border-radius:10px;border:1px solid #e5e7eb">
            <tr><td style="padding:20px 24px">
              <p style="margin:0 0 4px;color:#9ca3af;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.5px">Reference Number</p>
              <p style="margin:0;color:#1a1a1a;font-size:16px;font-weight:700;letter-spacing:0.5px">${data.referenceNumber}</p>
            </td></tr>
            <tr><td style="padding:0 24px"><div style="border-top:1px solid #e5e7eb"></div></td></tr>
            <tr><td style="padding:16px 24px">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td width="50%" style="padding:0 0 12px;vertical-align:top">
                    <p style="margin:0 0 2px;color:#9ca3af;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.5px">Room</p>
                    <p style="margin:0;color:#1a1a1a;font-size:14px;font-weight:500">${escapeHtml(data.roomName)}</p>
                  </td>
                  <td width="50%" style="padding:0 0 12px;vertical-align:top">
                    <p style="margin:0 0 2px;color:#9ca3af;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.5px">Duration</p>
                    <p style="margin:0;color:#1a1a1a;font-size:14px;font-weight:500">${data.nights} night${data.nights > 1 ? "s" : ""}</p>
                  </td>
                </tr>
                <tr>
                  <td width="50%" style="padding:0 0 12px;vertical-align:top">
                    <p style="margin:0 0 2px;color:#9ca3af;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.5px">Check-in</p>
                    <p style="margin:0;color:#1a1a1a;font-size:14px;font-weight:500">${checkIn}</p>
                  </td>
                  <td width="50%" style="padding:0 0 12px;vertical-align:top">
                    <p style="margin:0 0 2px;color:#9ca3af;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.5px">Check-out</p>
                    <p style="margin:0;color:#1a1a1a;font-size:14px;font-weight:500">${checkOut}</p>
                  </td>
                </tr>
              </table>
            </td></tr>
            <tr><td style="padding:0 24px"><div style="border-top:1px solid #e5e7eb"></div></td></tr>
            <tr><td style="padding:16px 24px">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td><p style="margin:0;color:#525252;font-size:14px">Total Paid</p></td>
                  <td align="right"><p style="margin:0;color:#1a1a1a;font-size:18px;font-weight:700">&euro;${data.totalPrice.toFixed(2)}</p></td>
                </tr>
              </table>
            </td></tr>
          </table>
        </td></tr>

        <!-- Hotel info -->
        <tr><td style="padding:0 40px 24px">
          <table width="100%" cellpadding="0" cellspacing="0" style="background:#fffbeb;border-radius:10px;border:1px solid #fde68a">
            <tr><td style="padding:20px 24px">
              <p style="margin:0 0 12px;color:#92400e;font-size:13px;font-weight:600">Important Information</p>
              <table width="100%" cellpadding="0" cellspacing="0" style="font-size:13px;color:#78350f;line-height:1.6">
                <tr><td style="padding:2px 0"><strong>Check-in time:</strong> ${h.checkIn} onwards</td></tr>
                <tr><td style="padding:2px 0"><strong>Check-out time:</strong> by ${h.checkOut}</td></tr>
                <tr><td style="padding:2px 0"><strong>Address:</strong> ${h.address}</td></tr>
                <tr><td style="padding:2px 0"><strong>Phone:</strong> ${h.phone}</td></tr>
              </table>
            </td></tr>
          </table>
        </td></tr>

        <!-- Closing -->
        <tr><td style="padding:0 40px 32px">
          <p style="margin:0;color:#525252;font-size:14px;line-height:1.6">
            If you have any questions or special requests, please do not hesitate to contact us at
            <a href="mailto:${h.email}" style="color:#1a3a5c;text-decoration:underline">${h.email}</a>
            or call us at <strong>${h.phone}</strong>.
          </p>
          <p style="margin:16px 0 0;color:#525252;font-size:14px;line-height:1.6">
            We look forward to welcoming you!
          </p>
          <p style="margin:16px 0 0;color:#1a1a1a;font-size:14px;font-weight:500">
            Warm regards,<br>The ${h.name} Team
          </p>
        </td></tr>

        <!-- Footer -->
        <tr><td style="background:#f9fafb;border-top:1px solid #e5e7eb;padding:20px 40px;text-align:center">
          <p style="margin:0;color:#9ca3af;font-size:11px;line-height:1.5">
            ${h.nameFull}<br>${h.address}<br>${h.phone} &middot; ${h.email}
          </p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

function escapeHtml(text: string): string {
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

export async function sendBookingConfirmation(
  data: BookingConfirmationData,
): Promise<void> {
  if (!resend) {
    console.warn("Resend not configured — skipping confirmation email");
    return;
  }

  try {
    const { error } = await resend.emails.send({
      from: `${HOTEL_INFO.name} <onboarding@resend.dev>`,
      to: data.guestEmail,
      subject: `Booking Confirmed — ${HOTEL_INFO.name} | Ref: ${data.referenceNumber}`,
      html: buildConfirmationHtml(data),
    });

    if (error) {
      console.error("Email send error:", error);
    }
  } catch (error) {
    console.error("Email error:", error);
  }
}
