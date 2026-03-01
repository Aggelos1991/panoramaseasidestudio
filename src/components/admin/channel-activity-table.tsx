"use client";

import { useState, useMemo } from "react";
import { format } from "date-fns";
import { ChevronDown, X, Link2 } from "lucide-react";

type ExternalBookingRow = {
  id: string;
  summary: string | null;
  checkIn: string;
  checkOut: string;
  roomName: string;
  platform: string;
};

const PLATFORM_BADGE: Record<string, { label: string; cls: string }> = {
  BOOKING_COM: { label: "Booking.com", cls: "bg-blue-50 text-blue-700 border border-blue-200/50" },
  EXPEDIA: { label: "Expedia", cls: "bg-yellow-50 text-yellow-700 border border-yellow-200/50" },
  AIRBNB: { label: "Airbnb", cls: "bg-rose-50 text-rose-700 border border-rose-200/50" },
  VRBO: { label: "VRBO", cls: "bg-indigo-50 text-indigo-700 border border-indigo-200/50" },
  OTHER: { label: "Other", cls: "bg-gray-50 text-gray-600 border border-gray-200/50" },
};

const PLATFORMS = ["ALL", "BOOKING_COM", "AIRBNB", "EXPEDIA", "VRBO", "OTHER"] as const;

function platformLabel(p: string) {
  return PLATFORM_BADGE[p]?.label ?? p;
}

export function ChannelActivityTable({ data }: { data: ExternalBookingRow[] }) {
  const [platformFilter, setPlatformFilter] = useState("ALL");
  const [roomFilter, setRoomFilter] = useState("ALL");

  const uniqueRooms = useMemo(() => {
    const set = new Set(data.map((d) => d.roomName));
    return Array.from(set).sort();
  }, [data]);

  const filtered = data.filter((eb) => {
    if (platformFilter !== "ALL" && eb.platform !== platformFilter) return false;
    if (roomFilter !== "ALL" && eb.roomName !== roomFilter) return false;
    return true;
  });

  const hasActiveFilters = platformFilter !== "ALL" || roomFilter !== "ALL";

  return (
    <div className="overflow-hidden rounded-2xl bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
        <h2 className="text-base font-semibold text-gray-900">Channel Activity</h2>
        <div className="inline-flex items-center gap-1.5 rounded-lg bg-amber-50 px-3 py-1.5 text-xs font-medium text-amber-700">
          <Link2 className="h-3 w-3" />
          External Platforms
        </div>
      </div>

      {/* Filters bar */}
      <div className="flex flex-wrap items-center gap-2 border-b border-gray-100 px-6 py-3">
        {/* Platform dropdown */}
        <div className="relative">
          <select
            value={platformFilter}
            onChange={(e) => setPlatformFilter(e.target.value)}
            className="h-9 cursor-pointer appearance-none rounded-lg bg-gray-50 pl-3 pr-8 text-sm text-gray-600 outline-none transition-colors hover:bg-gray-100 focus:bg-gray-100"
          >
            <option value="ALL">All Platforms</option>
            {PLATFORMS.filter((p) => p !== "ALL").map((p) => (
              <option key={p} value={p}>{platformLabel(p)}</option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400" />
        </div>

        {/* Divider */}
        <div className="hidden h-6 w-px bg-gray-200 sm:block" />

        {/* Room dropdown */}
        <div className="relative">
          <select
            value={roomFilter}
            onChange={(e) => setRoomFilter(e.target.value)}
            className="h-9 cursor-pointer appearance-none rounded-lg bg-gray-50 pl-3 pr-8 text-sm text-gray-600 outline-none transition-colors hover:bg-gray-100 focus:bg-gray-100"
          >
            <option value="ALL">All Rooms</option>
            {uniqueRooms.map((r) => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400" />
        </div>

        {/* Clear */}
        {hasActiveFilters && (
          <>
            <div className="h-6 w-px bg-gray-200" />
            <button
              onClick={() => { setPlatformFilter("ALL"); setRoomFilter("ALL"); }}
              className="flex h-9 items-center gap-1 rounded-lg px-2.5 text-xs font-medium text-gray-400 transition-colors hover:bg-red-50 hover:text-red-500"
            >
              <X className="h-3 w-3" />
            </button>
          </>
        )}
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50/80">
            <tr>
              <th className="px-3 sm:px-6 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-gray-400">Guest</th>
              <th className="px-3 sm:px-6 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-gray-400">Room</th>
              <th className="px-3 sm:px-6 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-gray-400">Dates</th>
              <th className="px-3 sm:px-6 py-3 text-right text-[11px] font-semibold uppercase tracking-wider text-gray-400">Platform</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={4} className="py-12 text-center text-sm text-gray-300">
                  {data.length === 0 ? "No channel bookings yet" : "No bookings match your filters"}
                </td>
              </tr>
            ) : (
              filtered.map((eb) => {
                const badge = PLATFORM_BADGE[eb.platform] ?? PLATFORM_BADGE.OTHER;
                return (
                  <tr key={eb.id} className="transition-colors hover:bg-gray-50/50">
                    <td className="px-3 sm:px-6 py-4">
                      <span className="font-medium text-gray-900">{eb.summary || "Untitled reservation"}</span>
                    </td>
                    <td className="px-3 sm:px-6 py-4 text-gray-500">{eb.roomName}</td>
                    <td className="px-3 sm:px-6 py-4 text-gray-500 whitespace-nowrap">
                      {format(new Date(eb.checkIn), "MMM dd")} &ndash; {format(new Date(eb.checkOut), "MMM dd")}
                    </td>
                    <td className="px-3 sm:px-6 py-4 text-right">
                      <span className={`inline-block rounded-md px-2.5 py-1 text-[11px] font-semibold ${badge.cls}`}>
                        {badge.label}
                      </span>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Footer */}
      <div className="border-t border-gray-100 px-3 sm:px-6 py-3">
        <p className="text-[11px] text-gray-400">
          Showing {filtered.length} of {data.length} channel booking{data.length !== 1 ? "s" : ""}
        </p>
      </div>
    </div>
  );
}
