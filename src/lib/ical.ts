import { format } from "date-fns";

// ─── iCal Parser ────────────────────────────────────────────

export type ICalEvent = {
  uid: string;
  summary: string;
  dtstart: string; // YYYY-MM-DD
  dtend: string; // YYYY-MM-DD
};

export function parseICal(icsText: string): ICalEvent[] {
  const events: ICalEvent[] = [];
  const lines = icsText.replace(/\r\n /g, "").split(/\r?\n/);

  let inEvent = false;
  let uid = "";
  let summary = "";
  let dtstart = "";
  let dtend = "";

  for (const line of lines) {
    if (line === "BEGIN:VEVENT") {
      inEvent = true;
      uid = "";
      summary = "";
      dtstart = "";
      dtend = "";
    } else if (line === "END:VEVENT" && inEvent) {
      inEvent = false;
      if (uid && dtstart && dtend) {
        events.push({ uid, summary: summary || "Reserved", dtstart, dtend });
      }
    } else if (inEvent) {
      if (line.startsWith("UID:")) {
        uid = line.slice(4).trim();
      } else if (line.startsWith("SUMMARY:")) {
        summary = line.slice(8).trim();
      } else if (line.startsWith("DTSTART")) {
        dtstart = parseICalDate(line);
      } else if (line.startsWith("DTEND")) {
        dtend = parseICalDate(line);
      }
    }
  }

  return events;
}

function parseICalDate(line: string): string {
  // Handle formats: DTSTART;VALUE=DATE:20260315 or DTSTART:20260315T000000Z
  const colonIdx = line.indexOf(":");
  if (colonIdx === -1) return "";
  const value = line.slice(colonIdx + 1).trim();
  // Extract YYYYMMDD from various formats
  const dateStr = value.replace(/T.*$/, "").replace(/-/g, "");
  if (dateStr.length < 8) return "";
  return `${dateStr.slice(0, 4)}-${dateStr.slice(4, 6)}-${dateStr.slice(6, 8)}`;
}

// ─── iCal Generator ─────────────────────────────────────────

type CalendarEvent = {
  uid: string;
  summary: string;
  checkIn: Date;
  checkOut: Date;
};

export function generateICal(
  events: CalendarEvent[],
  calendarName: string,
): string {
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Panorama Seaside Studios//Channel Manager//EN",
    `X-WR-CALNAME:${calendarName}`,
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
  ];

  for (const event of events) {
    const dtstart = format(event.checkIn, "yyyyMMdd");
    const dtend = format(event.checkOut, "yyyyMMdd");
    lines.push(
      "BEGIN:VEVENT",
      `UID:${event.uid}`,
      `DTSTART;VALUE=DATE:${dtstart}`,
      `DTEND;VALUE=DATE:${dtend}`,
      `SUMMARY:${event.summary}`,
      `DTSTAMP:${format(new Date(), "yyyyMMdd'T'HHmmss'Z'")}`,
      "END:VEVENT",
    );
  }

  lines.push("END:VCALENDAR");
  return lines.join("\r\n");
}
