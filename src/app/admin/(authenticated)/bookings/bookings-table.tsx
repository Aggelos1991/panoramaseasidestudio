"use client";

import { useState } from "react";
import { format } from "date-fns";
import Link from "next/link";
import { Search, ChevronDown, X } from "lucide-react";

type Booking = {
  id: string;
  guestFirstName: string;
  guestLastName: string;
  guestEmail: string;
  checkIn: string;
  checkOut: string;
  nights: number;
  totalPrice: string;
  status: string;
  room: { nameEn: string };
};

const STATUS_STYLES: Record<string, string> = {
  CONFIRMED: "bg-emerald-50 text-emerald-700",
  CANCELLED: "bg-red-50 text-red-600",
};

const STATUSES = ["ALL", "CONFIRMED", "CANCELLED"] as const;

function statusLabel(s: string) {
  if (s === "CONFIRMED") return "Active";
  if (s === "CANCELLED") return "Cancelled";
  return s.charAt(0) + s.slice(1).toLowerCase();
}

export function BookingsTable({ bookings }: { bookings: Booking[] }) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  const filtered = bookings.filter((b) => {
    if (statusFilter !== "ALL" && b.status !== statusFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      const match =
        b.guestFirstName.toLowerCase().includes(q) ||
        b.guestLastName.toLowerCase().includes(q) ||
        b.guestEmail.toLowerCase().includes(q) ||
        b.room.nameEn.toLowerCase().includes(q);
      if (!match) return false;
    }
    return true;
  });

  const hasActiveFilters = statusFilter !== "ALL" || search !== "";

  return (
    <>
      {/* Filters bar */}
      <div className="flex flex-wrap items-center gap-2 rounded-2xl bg-white p-2 shadow-sm">
        {/* Search */}
        <div className="relative w-full sm:w-auto sm:flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-300" />
          <input
            type="text"
            placeholder="Search guest or room..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-9 w-full rounded-lg bg-gray-50 pl-10 pr-3 text-sm text-gray-700 outline-none transition-colors placeholder:text-gray-400 focus:bg-gray-100"
          />
        </div>

        {/* Divider */}
        <div className="hidden h-6 w-px bg-gray-200 sm:block" />

        {/* Status dropdown */}
        <div className="relative">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-9 cursor-pointer appearance-none rounded-lg bg-gray-50 pl-3 pr-8 text-sm text-gray-600 outline-none transition-colors hover:bg-gray-100 focus:bg-gray-100"
          >
            <option value="ALL">All Statuses</option>
            {STATUSES.filter((s) => s !== "ALL").map((s) => (
              <option key={s} value={s}>{statusLabel(s)}</option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400" />
        </div>

        {/* Clear */}
        {hasActiveFilters && (
          <>
            <div className="h-6 w-px bg-gray-200" />
            <button
              onClick={() => { setSearch(""); setStatusFilter("ALL"); }}
              className="flex h-9 items-center gap-1 rounded-lg px-2.5 text-xs font-medium text-gray-400 transition-colors hover:bg-red-50 hover:text-red-500"
            >
              <X className="h-3 w-3" />
            </button>
          </>
        )}
      </div>

      {/* Table */}
      <div className="mt-4 overflow-hidden rounded-2xl bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50/80">
              <tr>
                <th className="px-3 sm:px-6 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-gray-400">Guest</th>
                <th className="px-3 sm:px-6 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-gray-400">Room</th>
                <th className="px-3 sm:px-6 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-gray-400">Dates</th>
                <th className="px-3 sm:px-6 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-gray-400">Status</th>
                <th className="px-6 py-3 text-right text-[11px] font-semibold uppercase tracking-wider text-gray-400">Total</th>
                <th className="px-3 sm:px-6 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-16 text-center text-sm text-gray-400">
                    {bookings.length === 0 ? "No bookings yet" : "No bookings match your filters"}
                  </td>
                </tr>
              ) : (
                filtered.map((b) => (
                  <tr key={b.id} className="transition-colors hover:bg-gray-50/50">
                    <td className="px-3 sm:px-6 py-4">
                      <p className="font-medium text-gray-900">
                        {b.guestFirstName} {b.guestLastName}
                      </p>
                      <p className="mt-0.5 text-[11px] text-gray-400">{b.guestEmail}</p>
                    </td>
                    <td className="px-3 sm:px-6 py-4 text-gray-500">{b.room.nameEn}</td>
                    <td className="px-3 sm:px-6 py-4 text-gray-500 whitespace-nowrap">
                      {format(new Date(b.checkIn), "MMM dd")} &ndash;{" "}
                      {format(new Date(b.checkOut), "MMM dd")}
                      <span className="ml-1 text-[11px] text-gray-300">({b.nights}n)</span>
                    </td>
                    <td className="px-3 sm:px-6 py-4">
                      <span className={`inline-block rounded-md px-2.5 py-1 text-[11px] font-semibold ${STATUS_STYLES[b.status] || "bg-gray-100"}`}>
                        {statusLabel(b.status)}
                      </span>
                    </td>
                    <td className="px-3 sm:px-6 py-4 text-right font-semibold text-gray-900">
                      &euro;{Number(b.totalPrice)}
                    </td>
                    <td className="px-3 sm:px-6 py-4 text-right">
                      <Link
                        href={`/admin/bookings/${b.id}`}
                        className="rounded-md px-3 py-1.5 text-xs font-medium text-deep-blue transition-colors hover:bg-deep-blue/5"
                      >
                        View
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {/* Footer */}
        <div className="border-t border-gray-100 px-3 sm:px-6 py-3">
          <p className="text-[11px] text-gray-400">
            Showing {filtered.length} of {bookings.length} booking{bookings.length !== 1 ? "s" : ""}
          </p>
        </div>
      </div>
    </>
  );
}
