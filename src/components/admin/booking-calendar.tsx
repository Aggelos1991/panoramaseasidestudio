"use client";

import { useState, useEffect, useMemo } from "react";
import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  format,
  isSameMonth,
  isToday,
  addMonths,
  subMonths,
  parseISO,
  isBefore,
  isAfter,
  isSameDay,
} from "date-fns";
import {
  ChevronLeft,
  ChevronRight,
  Loader2,
  LogIn,
  LogOut,
  BedDouble,
  Circle,
} from "lucide-react";

/* ───── types ───── */
type CalendarEvent = {
  id: string;
  type: "internal" | "external";
  roomId: string;
  roomName: string;
  label: string;
  checkIn: string;
  checkOut: string;
  color: string;
  platform?: string;
  status?: string;
};

type CalendarRoom = { id: string; name: string };

/* ───── constants ───── */
const ROOM_COLORS = [
  "#3b82f6", // blue
  "#10b981", // emerald
  "#f59e0b", // amber
  "#8b5cf6", // violet
  "#ef4444", // red
  "#06b6d4", // cyan
  "#ec4899", // pink
  "#f97316", // orange
];

const PLATFORM_LABELS: Record<string, string> = {
  BOOKING_COM: "Booking.com",
  AIRBNB: "Airbnb",
  EXPEDIA: "Expedia",
  VRBO: "VRBO",
  OTHER: "Other",
};

const DAY_NAMES = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

// Timeline: 6:00 to 00:00 (18h span)
const TL_START = 6;
const TL_END = 24;
const TL_SPAN = TL_END - TL_START;
const CO_HOUR = 11; // checkout
const CI_HOUR = 14; // checkin
const TL_TICKS = [6, 8, 10, 12, 14, 16, 18, 20, 22, 24];

/* ───── helpers ───── */
function getMonthDays(month: string): Date[] {
  const ms = startOfMonth(parseISO(month + "-01"));
  return eachDayOfInterval({
    start: startOfWeek(ms, { weekStartsOn: 1 }),
    end: endOfWeek(endOfMonth(ms), { weekStartsOn: 1 }),
  });
}

const isOnDay = (e: CalendarEvent, d: Date) => {
  const ci = parseISO(e.checkIn);
  const co = parseISO(e.checkOut);
  return (isBefore(ci, d) || isSameDay(ci, d)) && isAfter(co, d);
};
const isCODay = (e: CalendarEvent, d: Date) =>
  isSameDay(parseISO(e.checkOut), d);
const isCIDay = (e: CalendarEvent, d: Date) =>
  isSameDay(parseISO(e.checkIn), d);
const hasActivity = (e: CalendarEvent, d: Date) =>
  isOnDay(e, d) || isCODay(e, d);
const pct = (h: number) => ((h - TL_START) / TL_SPAN) * 100;

/* ───── segment type ───── */
type Seg = {
  kind: "checkout" | "checkin" | "staying";
  event: CalendarEvent;
  left: number;
  width: number;
};

/* ═══════════════════════════════════════════════════════ */
export function BookingCalendar() {
  const [month, setMonth] = useState(() => format(new Date(), "yyyy-MM"));
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [rooms, setRooms] = useState<CalendarRoom[]>([]);
  const [loading, setLoading] = useState(true);
  const [selDay, setSelDay] = useState<string | null>(null);

  /* fetch */
  useEffect(() => {
    setLoading(true);
    fetch(`/api/calendar?month=${month}`)
      .then((r) => r.json())
      .then((d) => {
        setEvents(d.events || []);
        setRooms(d.rooms || []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [month]);

  const ms = parseISO(month + "-01");

  /* room → color */
  const rcMap = useMemo(() => {
    const m = new Map<string, string>();
    rooms.forEach((r, i) => m.set(r.id, ROOM_COLORS[i % ROOM_COLORS.length]));
    return m;
  }, [rooms]);

  /* events with room-based colors */
  const evts = useMemo(
    () => events.map((e) => ({ ...e, color: rcMap.get(e.roomId) || e.color })),
    [events, rcMap],
  );

  /* month grid */
  const days = useMemo(() => getMonthDays(month), [month]);
  const weeks: Date[][] = [];
  for (let i = 0; i < days.length; i += 7) weeks.push(days.slice(i, i + 7));

  /* events per day (including checkout days) */
  const dayMap = useMemo(() => {
    const m = new Map<string, CalendarEvent[]>();
    for (const d of days) {
      const k = format(d, "yyyy-MM-dd");
      const de = evts.filter((e) => hasActivity(e, d));
      if (de.length) m.set(k, de);
    }
    return m;
  }, [evts, days]);

  /* room timeline for selected day */
  const timeline = useMemo(() => {
    if (!selDay) return [];
    const d = parseISO(selDay);

    return rooms.map((room) => {
      const color = rcMap.get(room.id) || "#9ca3af";
      const re = evts.filter((e) => e.roomId === room.id);

      const co = re.find((e) => isCODay(e, d));
      const stay = re.find((e) => isOnDay(e, d) && !isCIDay(e, d));
      const ci = re.find((e) => isOnDay(e, d) && isCIDay(e, d));

      const segs: Seg[] = [];

      if (stay) {
        // guest occupies all day (mid-stay)
        segs.push({ kind: "staying", event: stay, left: 0, width: 100 });
      } else {
        if (co)
          segs.push({
            kind: "checkout",
            event: co,
            left: 0,
            width: pct(CO_HOUR),
          });
        if (ci)
          segs.push({
            kind: "checkin",
            event: ci,
            left: pct(CI_HOUR),
            width: 100 - pct(CI_HOUR),
          });
      }

      return {
        roomId: room.id,
        roomName: room.name,
        color,
        segs,
        available: segs.length === 0,
      };
    });
  }, [selDay, rooms, evts, rcMap]);

  /* stats for the selected day */
  const stats = useMemo(() => {
    const ci = timeline.filter((r) =>
      r.segs.some((s) => s.kind === "checkin"),
    ).length;
    const co = timeline.filter((r) =>
      r.segs.some((s) => s.kind === "checkout"),
    ).length;
    const occ = timeline.filter((r) =>
      r.segs.some((s) => s.kind === "staying"),
    ).length;
    const free = timeline.filter((r) => r.available).length;
    return { ci, co, occ, free };
  }, [timeline]);

  const selEvents = selDay ? dayMap.get(selDay) || [] : [];

  /* nav */
  const prev = () => {
    setMonth(format(subMonths(ms, 1), "yyyy-MM"));
    setSelDay(null);
  };
  const next = () => {
    setMonth(format(addMonths(ms, 1), "yyyy-MM"));
    setSelDay(null);
  };
  const today = () => {
    setMonth(format(new Date(), "yyyy-MM"));
    setSelDay(format(new Date(), "yyyy-MM-dd"));
  };

  /* ═══════ render ═══════ */
  return (
    <div>
      {/* ─── Header ─── */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <button
            onClick={prev}
            className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 transition-colors"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <h2 className="min-w-[160px] text-center text-lg font-semibold text-gray-900">
            {format(ms, "MMMM yyyy")}
          </h2>
          <button
            onClick={next}
            className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 transition-colors"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
          <button
            onClick={today}
            className="ml-2 rounded-lg bg-gray-100 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-200 transition-colors"
          >
            Today
          </button>
        </div>

        {/* Room color legend */}
        <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500">
          <span className="rounded-full bg-gray-100 px-2.5 py-1 font-medium">
            {events.length} booking{events.length !== 1 ? "s" : ""}
          </span>
          {rooms.map((r) => (
            <div key={r.id} className="flex items-center gap-1.5">
              <div
                className="h-2.5 w-2.5 rounded-sm"
                style={{ backgroundColor: rcMap.get(r.id) }}
              />
              <span className="max-w-[120px] truncate">{r.name}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ─── Month Grid ─── */}
      <div className="overflow-hidden rounded-2xl bg-white shadow-sm">
        {/* Day names */}
        <div className="grid grid-cols-7 border-b border-gray-200 bg-gray-50">
          {DAY_NAMES.map((d) => (
            <div
              key={d}
              className="px-2 py-2.5 text-center text-[11px] font-semibold uppercase tracking-wide text-gray-500"
            >
              {d}
            </div>
          ))}
        </div>

        {loading ? (
          <div className="flex h-64 items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-gray-300" />
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {weeks.map((wk, wi) => (
              <div
                key={wi}
                className="grid grid-cols-7 divide-x divide-gray-100"
              >
                {wk.map((day) => {
                  const k = format(day, "yyyy-MM-dd");
                  const de = dayMap.get(k) || [];
                  const inM = isSameMonth(day, ms);
                  const td = isToday(day);
                  const sel = selDay === k;

                  return (
                    <div
                      key={k}
                      onClick={() => setSelDay(sel ? null : k)}
                      className={`min-h-[90px] cursor-pointer p-1.5 transition-colors sm:min-h-[110px] ${
                        !inM
                          ? "bg-gray-50/70"
                          : "bg-white hover:bg-blue-50/30"
                      } ${sel ? "ring-2 ring-inset ring-blue-400 bg-blue-50/40" : ""}`}
                    >
                      {/* day number */}
                      <div className="mb-1 flex items-center justify-between">
                        <span
                          className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold ${
                            td
                              ? "bg-blue-600 text-white"
                              : inM
                                ? "text-gray-700"
                                : "text-gray-300"
                          }`}
                        >
                          {format(day, "d")}
                        </span>
                        {de.length > 0 && (
                          <span className="text-[10px] font-medium text-gray-400">
                            {de.length}
                          </span>
                        )}
                      </div>

                      {/* event chips – room-colored */}
                      <div className="space-y-0.5">
                        {de.slice(0, 3).map((ev) => {
                          const onlyCheckout =
                            isCODay(ev, day) && !isOnDay(ev, day);
                          return (
                            <div
                              key={ev.id}
                              className={`flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-medium leading-tight ${onlyCheckout ? "opacity-40" : ""}`}
                              style={{
                                backgroundColor: ev.color + "18",
                                color: ev.color,
                                borderLeft: `3px solid ${ev.color}`,
                              }}
                            >
                              {onlyCheckout && (
                                <LogOut className="h-2.5 w-2.5 flex-shrink-0" />
                              )}
                              <span className="truncate">
                                {ev.roomName.split(" ")[0]}
                              </span>
                            </div>
                          );
                        })}
                        {de.length > 3 && (
                          <div className="px-1 text-[10px] font-medium text-blue-500">
                            +{de.length - 3} more
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ─── Day Detail — Room Timeline ─── */}
      {selDay && (
        <div className="mt-4 animate-fade-in overflow-hidden rounded-2xl bg-white shadow-sm">
          {/* header */}
          <div className="border-b border-gray-100 px-5 py-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h3 className="text-sm font-semibold text-gray-900">
                  {format(parseISO(selDay), "EEEE, MMMM d, yyyy")}
                </h3>
                <p className="mt-0.5 text-xs text-gray-400">
                  Room availability &amp; timeline
                </p>
              </div>
              {/* quick stats */}
              <div className="flex flex-wrap items-center gap-2">
                {stats.ci > 0 && (
                  <div className="flex items-center gap-1.5 rounded-lg bg-emerald-50 px-2.5 py-1.5 text-[11px] font-semibold text-emerald-700">
                    <LogIn className="h-3 w-3" />
                    {stats.ci} Check-in{stats.ci > 1 ? "s" : ""}
                  </div>
                )}
                {stats.co > 0 && (
                  <div className="flex items-center gap-1.5 rounded-lg bg-orange-50 px-2.5 py-1.5 text-[11px] font-semibold text-orange-700">
                    <LogOut className="h-3 w-3" />
                    {stats.co} Check-out{stats.co > 1 ? "s" : ""}
                  </div>
                )}
                {stats.occ > 0 && (
                  <div className="flex items-center gap-1.5 rounded-lg bg-blue-50 px-2.5 py-1.5 text-[11px] font-semibold text-blue-700">
                    <BedDouble className="h-3 w-3" />
                    {stats.occ} Occupied
                  </div>
                )}
                <div className="flex items-center gap-1.5 rounded-lg bg-gray-50 px-2.5 py-1.5 text-[11px] font-semibold text-gray-500">
                  <Circle className="h-3 w-3" />
                  {stats.free} Available
                </div>
              </div>
            </div>
          </div>

          {/* timeline */}
          <div className="overflow-x-auto">
            <div className="min-w-[600px] p-5">
              {/* hour labels */}
              <div className="mb-1 flex">
                <div className="w-44 flex-shrink-0" />
                <div className="relative h-5 flex-1">
                  {TL_TICKS.map((h) => (
                    <span
                      key={h}
                      className="absolute -translate-x-1/2 text-[10px] font-medium text-gray-400"
                      style={{ left: `${pct(h)}%` }}
                    >
                      {h === 24 ? "00" : String(h).padStart(2, "0")}
                    </span>
                  ))}
                </div>
              </div>

              {/* room rows */}
              <div className="space-y-1.5">
                {timeline.map((room) => (
                  <div
                    key={room.roomId}
                    className="group flex items-center gap-3"
                  >
                    {/* room name */}
                    <div className="flex w-44 flex-shrink-0 items-center gap-2">
                      <div
                        className="h-3 w-3 flex-shrink-0 rounded shadow-sm"
                        style={{ backgroundColor: room.color }}
                      />
                      <span className="truncate text-[11px] font-medium text-gray-700">
                        {room.roomName}
                      </span>
                    </div>

                    {/* timeline bar */}
                    <div className="relative h-10 flex-1 overflow-hidden rounded-lg border border-gray-100 bg-gray-50/80 transition-colors group-hover:border-gray-200">
                      {/* tick grid lines */}
                      {TL_TICKS.map((h) => (
                        <div
                          key={h}
                          className="absolute bottom-0 top-0 w-px bg-gray-100"
                          style={{ left: `${pct(h)}%` }}
                        />
                      ))}
                      {/* checkout / checkin markers (dashed) */}
                      <div
                        className="absolute bottom-0 top-0 border-l border-dashed border-gray-200"
                        style={{ left: `${pct(CO_HOUR)}%` }}
                      />
                      <div
                        className="absolute bottom-0 top-0 border-l border-dashed border-gray-200"
                        style={{ left: `${pct(CI_HOUR)}%` }}
                      />

                      {room.available ? (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className="text-[10px] font-medium text-gray-300">
                            Available
                          </span>
                        </div>
                      ) : (
                        room.segs.map((s, i) => (
                          <div
                            key={i}
                            className="absolute bottom-1 top-1 flex items-center gap-1.5 overflow-hidden rounded-md px-2 shadow-sm"
                            style={{
                              left: `${s.left}%`,
                              width: `${s.width}%`,
                              backgroundColor: room.color,
                            }}
                          >
                            {s.kind === "checkout" && (
                              <LogOut className="h-3 w-3 flex-shrink-0 text-white/80" />
                            )}
                            {s.kind === "checkin" && (
                              <LogIn className="h-3 w-3 flex-shrink-0 text-white/80" />
                            )}
                            {s.kind === "staying" && (
                              <BedDouble className="h-3 w-3 flex-shrink-0 text-white/80" />
                            )}
                            <span className="truncate text-[10px] font-medium text-white">
                              {s.event.label}
                            </span>
                            {s.kind === "checkout" && (
                              <span className="ml-auto flex-shrink-0 text-[9px] text-white/60">
                                → 11:00
                              </span>
                            )}
                            {s.kind === "checkin" && (
                              <span className="ml-auto flex-shrink-0 text-[9px] text-white/60">
                                14:00 →
                              </span>
                            )}
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* legend bar */}
              <div className="mt-4 flex items-center gap-4 border-t border-gray-100 pt-3 text-[10px] text-gray-400">
                <div className="flex items-center gap-1.5">
                  <div className="h-0.5 w-4 border-t border-dashed border-gray-300" />
                  <span>11:00 Check-out</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="h-0.5 w-4 border-t border-dashed border-gray-300" />
                  <span>14:00 Check-in</span>
                </div>
              </div>
            </div>
          </div>

          {/* ─── Booking details grid ─── */}
          {selEvents.length > 0 && (
            <div className="border-t border-gray-100 px-5 py-4">
              <h4 className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-gray-400">
                Booking Details
              </h4>
              <div className="grid gap-2 sm:grid-cols-2">
                {selEvents.map((ev) => {
                  const d = parseISO(selDay);
                  const isCI = isCIDay(ev, d);
                  const isCO = isCODay(ev, d) && !isOnDay(ev, d);
                  const label = isCI
                    ? "Check-in"
                    : isCO
                      ? "Check-out"
                      : "Staying";
                  const Icon = isCI ? LogIn : isCO ? LogOut : BedDouble;

                  return (
                    <div
                      key={ev.id}
                      className="flex items-center gap-3 rounded-xl p-3"
                      style={{ backgroundColor: ev.color + "08" }}
                    >
                      <div
                        className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg text-white"
                        style={{ backgroundColor: ev.color }}
                      >
                        <Icon className="h-4 w-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="truncate text-xs font-semibold text-gray-900">
                            {ev.label}
                          </span>
                          <span
                            className="inline-flex flex-shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold text-white"
                            style={{ backgroundColor: ev.color }}
                          >
                            {label}
                          </span>
                        </div>
                        <div className="mt-0.5 text-[11px] text-gray-500">
                          <span
                            className="font-medium"
                            style={{ color: ev.color }}
                          >
                            {ev.roomName}
                          </span>
                          <span className="mx-1.5 text-gray-300">&middot;</span>
                          {format(parseISO(ev.checkIn), "MMM d")} &rarr;{" "}
                          {format(parseISO(ev.checkOut), "MMM d")}
                          {ev.type === "external" && ev.platform && (
                            <span className="ml-1.5 text-gray-400">
                              via{" "}
                              {PLATFORM_LABELS[ev.platform] || ev.platform}
                            </span>
                          )}
                        </div>
                        <div className="mt-1 flex items-center gap-3 text-[10px]">
                          <span className="flex items-center gap-1 rounded-md bg-emerald-50 px-1.5 py-0.5 font-medium text-emerald-600">
                            <LogIn className="h-2.5 w-2.5" />
                            Check-in 14:00
                          </span>
                          <span className="flex items-center gap-1 rounded-md bg-orange-50 px-1.5 py-0.5 font-medium text-orange-600">
                            <LogOut className="h-2.5 w-2.5" />
                            Check-out 11:00
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* empty day */}
          {selEvents.length === 0 && (
            <div className="px-5 pb-5 text-center text-sm text-gray-300">
              All rooms available this day
            </div>
          )}
        </div>
      )}
    </div>
  );
}
