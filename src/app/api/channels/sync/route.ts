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
import { getAdminSession } from "@/lib/auth";

// POST — sync a single channel or all channels
export async function POST(request: NextRequest) {
  try {
    const session = await getAdminSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { channelId } = body;

    // Sync a single channel or all active channels
    const channels = channelId
      ? await listChannels({ id: channelId, activeOnly: true })
      : await listChannels({ activeOnly: true, requireIcal: true });

    const results: { id: string; name: string; status: string; count: number }[] = [];

    for (const channel of channels) {
      if (!channel.icalImportUrl) {
        results.push({ id: channel.id, name: channel.name, status: "skipped", count: 0 });
        continue;
      }

      try {
        // Fetch the iCal feed
        const res = await fetch(channel.icalImportUrl, {
          headers: { "User-Agent": "PanoramaStudios-ChannelManager/1.0" },
        });

        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`);
        }

        const icsText = await res.text();
        const events = parseICal(icsText);

        // Get all current UIDs from this channel
        const existingUids = new Set(await externalUids(channel.id));

        const incomingUids = new Set(events.map((e) => e.uid));

        // Upsert events and track new ones
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

        // Remove events that no longer exist in the feed
        const toRemove = [...existingUids].filter((uid) => !incomingUids.has(uid));
        if (toRemove.length > 0) {
          await deleteExternalByUids(channel.id, toRemove);
        }

        // Update channel sync status
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

    return NextResponse.json({ results });
  } catch (error) {
    console.error("Sync error:", error);
    return NextResponse.json(
      { error: "Failed to sync channels" },
      { status: 500 },
    );
  }
}
