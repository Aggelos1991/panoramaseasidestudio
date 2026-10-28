import { NextRequest, NextResponse } from "next/server";
import { parseICal } from "@/lib/ical";
import {
  deleteExternalByUids,
  externalUids,
  listChannels,
  updateChannel,
  upsertExternalBooking,
} from "@/lib/store";
import { parseISO, differenceInCalendarDays } from "date-fns";
import { sendBookingNotification } from "@/lib/telegram";

// GET — called by Vercel Cron every 15 minutes
export async function GET(request: NextRequest) {
  // Verify the request is from cron (secret must be set and match)
  const cronSecret = process.env.CRON_SECRET;
  const authHeader = request.headers.get("authorization");
  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const channels = await listChannels({ activeOnly: true, requireIcal: true });

    if (channels.length === 0) {
      return NextResponse.json({ message: "No channels to sync", results: [] });
    }

    const results: { id: string; name: string; status: string; count: number }[] = [];

    for (const channel of channels) {
      if (!channel.icalImportUrl) continue;

      try {
        const res = await fetch(channel.icalImportUrl, {
          headers: { "User-Agent": "PanoramaStudios-ChannelManager/1.0" },
        });

        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`);
        }

        const icsText = await res.text();
        const events = parseICal(icsText);

        const existingUids = new Set(await externalUids(channel.id));

        const incomingUids = new Set(events.map((e) => e.uid));

        const newBookings: { summary: string; checkIn: Date; checkOut: Date }[] = [];

        for (const event of events) {
          const isNew = !existingUids.has(event.uid);

          await upsertExternalBooking({
            channelId: channel.id,
            roomId: channel.roomId,
            uid: event.uid,
            summary: event.summary,
            checkIn: parseISO(event.dtstart),
            checkOut: parseISO(event.dtend),
          });

          if (isNew) {
            newBookings.push({
              summary: event.summary,
              checkIn: parseISO(event.dtstart),
              checkOut: parseISO(event.dtend),
            });
          }
        }

        // Telegram notifications for new bookings
        for (const nb of newBookings) {
          sendBookingNotification({
            type: "external",
            summary: nb.summary,
            roomName: channel.room?.nameEn || "Room",
            platform: channel.platform,
            checkIn: nb.checkIn,
            checkOut: nb.checkOut,
            nights: differenceInCalendarDays(nb.checkOut, nb.checkIn),
          }).catch(() => {});
        }

        const toRemove = [...existingUids].filter((uid) => !incomingUids.has(uid));
        if (toRemove.length > 0) {
          await deleteExternalByUids(channel.id, toRemove);
        }

        await updateChannel(channel.id, {
          lastSyncAt: new Date(),
          lastSyncStatus: `OK — ${events.length} events`,
        });

        results.push({ id: channel.id, name: channel.name, status: "success", count: events.length });
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : "Unknown error";
        await updateChannel(channel.id, {
          lastSyncAt: new Date(),
          lastSyncStatus: `Error: ${errorMsg}`,
        });
        results.push({ id: channel.id, name: channel.name, status: `error: ${errorMsg}`, count: 0 });
      }
    }

    return NextResponse.json({
      message: `Synced ${results.length} channel(s)`,
      results,
    });
  } catch (error) {
    console.error("Cron sync error:", error);
    return NextResponse.json(
      { error: "Cron sync failed" },
      { status: 500 },
    );
  }
}
