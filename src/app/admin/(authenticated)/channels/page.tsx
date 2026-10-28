"use client";

import { useEffect, useState } from "react";
import {
  Link2,
  Plus,
  RefreshCw,
  Trash2,
  Copy,
  Check,
  ExternalLink,
  CalendarDays,
  Settings2,
} from "lucide-react";
import { BookingCalendar } from "@/components/admin/booking-calendar";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";

type Room = { id: string; nameEn: string; slug: string };

type Channel = {
  id: string;
  name: string;
  platform: string;
  icalImportUrl: string | null;
  roomId: string;
  color: string;
  isActive: boolean;
  lastSyncAt: string | null;
  lastSyncStatus: string | null;
  room: { nameEn: string; slug: string };
  _count: { externalBookings: number };
};

const PLATFORMS = [
  { value: "BOOKING_COM", label: "Booking.com", color: "#003580" },
  { value: "EXPEDIA", label: "Expedia", color: "#FBAF02" },
  { value: "AIRBNB", label: "Airbnb", color: "#FF5A5F" },
  { value: "VRBO", label: "Vrbo", color: "#3B5998" },
  { value: "OTHER", label: "Other", color: "#6366f1" },
];

export default function ChannelsPage() {
  const [activeTab, setActiveTab] = useState<"calendar" | "channels">("calendar");
  const [channels, setChannels] = useState<Channel[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [syncing, setSyncing] = useState<string | null>(null);
  const [syncingAll, setSyncingAll] = useState(false);
  const [copiedSlug, setCopiedSlug] = useState<string | null>(null);

  // Form state
  const [formName, setFormName] = useState("");
  const [formPlatform, setFormPlatform] = useState("BOOKING_COM");
  const [formRoom, setFormRoom] = useState("");
  const [formUrl, setFormUrl] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const [channelsRes, roomsRes] = await Promise.all([
        fetch("/api/channels"),
        fetch("/api/rooms"),
      ]);
      const channelsData = await channelsRes.json();
      const roomsData = await roomsRes.json();
      setChannels(channelsData.channels || []);
      // rooms API returns array directly
      setRooms(Array.isArray(roomsData) ? roomsData : roomsData.rooms || []);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }

  async function handleAdd() {
    if (!formName || !formRoom) return;
    setSaving(true);
    try {
      const platformInfo = PLATFORMS.find((p) => p.value === formPlatform);
      const res = await fetch("/api/channels", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formName,
          platform: formPlatform,
          icalImportUrl: formUrl || null,
          roomId: formRoom,
          color: platformInfo?.color || "#6366f1",
        }),
      });
      if (res.ok) {
        setShowForm(false);
        setFormName("");
        setFormUrl("");
        loadData();
      }
    } catch {
      alert("Failed to add channel");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this channel and all its imported bookings?")) return;
    try {
      await fetch(`/api/channels?id=${id}`, { method: "DELETE" });
      loadData();
    } catch {
      alert("Failed to delete");
    }
  }

  async function handleSync(channelId?: string) {
    if (channelId) {
      setSyncing(channelId);
    } else {
      setSyncingAll(true);
    }
    try {
      await fetch("/api/channels/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ channelId: channelId || undefined }),
      });
      loadData();
    } catch {
      alert("Sync failed");
    } finally {
      setSyncing(null);
      setSyncingAll(false);
    }
  }

  function copyExportUrl(slug: string) {
    const url = `${window.location.origin}/api/ical/${slug}`;
    navigator.clipboard.writeText(url);
    setCopiedSlug(slug);
    setTimeout(() => setCopiedSlug(null), 2000);
  }

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center text-sm text-gray-400">
        Loading...
      </div>
    );
  }

  // Get unique room slugs that have export URLs
  const roomSlugs = [...new Map(rooms.map((r) => [r.slug, r])).values()];

  return (
    <div className="animate-fade-in">
      <div className="mb-8 rounded-2xl bg-gradient-to-r from-deep-blue to-deep-blue-light p-6 text-white shadow-lg lg:p-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold lg:text-3xl">Channel Manager</h1>
            <p className="mt-1 text-sm text-white/60">
              Sync availability across Booking.com, Expedia, Airbnb & more via
              iCal
            </p>
          </div>
          <div className="flex items-center gap-3">
            {activeTab === "channels" && (
              <>
                <button
                  onClick={() => handleSync()}
                  disabled={syncingAll}
                  className="rounded-xl bg-white/20 px-4 py-2.5 text-sm font-medium text-white backdrop-blur-sm transition-colors hover:bg-white/30 disabled:opacity-50"
                >
                  <RefreshCw className={`mr-2 inline h-4 w-4 ${syncingAll ? "animate-spin" : ""}`} />
                  Sync All
                </button>
                <Button onClick={() => setShowForm(true)}>
                  <Plus className="h-4 w-4" />
                  Add Channel
                </Button>
              </>
            )}
            <div className="hidden rounded-xl bg-white/10 p-3 backdrop-blur-sm sm:block">
              <Link2 className="h-6 w-6 text-white/80" />
            </div>
          </div>
        </div>
      </div>

      {/* Tab Toggle */}
      <div className="mb-6 flex items-center gap-1 rounded-xl bg-gray-100 p-1">
        <button
          onClick={() => setActiveTab("calendar")}
          className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-all ${
            activeTab === "calendar"
              ? "bg-white text-gray-900 shadow-sm"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          <CalendarDays className="h-4 w-4" />
          Calendar
        </button>
        <button
          onClick={() => setActiveTab("channels")}
          className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-all ${
            activeTab === "channels"
              ? "bg-white text-gray-900 shadow-sm"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          <Settings2 className="h-4 w-4" />
          Channels
        </button>
      </div>

      {/* Calendar Tab */}
      {activeTab === "calendar" && <BookingCalendar />}

      {/* Channels Tab */}
      {activeTab === "channels" && (
        <>
      {/* Export URLs */}
      <div className="mb-6 rounded-2xl bg-white p-5 shadow-sm">
        <h2 className="text-sm font-semibold text-gray-900">
          Export URLs (paste into OTAs)
        </h2>
        <p className="mt-1 text-xs leading-relaxed text-gray-500">
          Booking.com sync uses calendar links. Paste each room&apos;s export
          URL into Booking.com under calendar sync, then add Booking.com&apos;s
          own export link as a channel below. Direct bookings and Booking.com
          reservations then block each other. Use Sync now, or leave the
          15-minute sync to pull new Booking.com stays onto this calendar.
        </p>
        <div className="mt-3 space-y-2">
          {roomSlugs.map((room) => (
            <div
              key={room.slug}
              className="flex items-center justify-between rounded-lg bg-gray-50 px-4 py-2.5"
            >
              <div>
                <span className="text-sm font-medium text-gray-700">
                  {room.nameEn}
                </span>
                <span className="ml-2 text-xs text-gray-400">
                  /api/ical/{room.slug}
                </span>
              </div>
              <button
                onClick={() => copyExportUrl(room.slug)}
                className="inline-flex items-center gap-1.5 rounded-md bg-white px-3 py-1.5 text-xs font-medium text-gray-600 shadow-sm transition-colors hover:bg-gray-100"
              >
                {copiedSlug === room.slug ? (
                  <>
                    <Check className="h-3.5 w-3.5 text-emerald-500" /> Copied
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5" /> Copy URL
                  </>
                )}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Add Channel Form */}
      {showForm && (
        <div className="mb-6 rounded-2xl border border-blue-200 bg-blue-50/30 p-6">
          <h3 className="text-sm font-semibold text-gray-900">
            Add New Channel
          </h3>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-medium text-gray-600">
                Channel Name
              </label>
              <input
                type="text"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="e.g. Booking.com - Deluxe Room"
                className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-deep-blue focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600">
                Platform
              </label>
              <select
                value={formPlatform}
                onChange={(e) => setFormPlatform(e.target.value)}
                className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-deep-blue focus:outline-none"
              >
                {PLATFORMS.map((p) => (
                  <option key={p.value} value={p.value}>
                    {p.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600">
                Room
              </label>
              <select
                value={formRoom}
                onChange={(e) => setFormRoom(e.target.value)}
                className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-deep-blue focus:outline-none"
              >
                <option value="">Select room...</option>
                {rooms.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.nameEn}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600">
                iCal Import URL
              </label>
              <input
                type="url"
                value={formUrl}
                onChange={(e) => setFormUrl(e.target.value)}
                placeholder="https://..."
                className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-deep-blue focus:outline-none"
              />
              <p className="mt-1 text-[10px] leading-relaxed text-gray-500">
                {formPlatform === "BOOKING_COM"
                  ? "In the Booking.com extranet, open the room’s calendar and copy the iCal export link."
                  : "Find this in the platform’s calendar export settings."}
              </p>
            </div>
          </div>
          <div className="mt-4 flex gap-2">
            <Button onClick={handleAdd} isLoading={saving}>
              Add Channel
            </Button>
            <Button variant="ghost" onClick={() => setShowForm(false)}>
              Cancel
            </Button>
          </div>
        </div>
      )}

      {/* Channels List */}
      {channels.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-200 bg-white p-16 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-50">
            <Link2 className="h-7 w-7 text-gray-300" />
          </div>
          <h3 className="mt-5 text-sm font-semibold text-gray-900">
            No channels connected
          </h3>
          <p className="mx-auto mt-1.5 max-w-sm text-xs leading-relaxed text-gray-400">
            Add a channel to start syncing availability from other platforms
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {channels.map((ch) => (
            <div
              key={ch.id}
              className="rounded-2xl bg-white p-5 shadow-sm transition-all hover:shadow-md"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className="h-10 w-10 rounded-lg"
                    style={{ backgroundColor: ch.color + "20" }}
                  >
                    <div className="flex h-full items-center justify-center">
                      <ExternalLink
                        className="h-5 w-5"
                        style={{ color: ch.color }}
                      />
                    </div>
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900">
                      {ch.name}
                    </h3>
                    <p className="text-xs text-gray-400">
                      {PLATFORMS.find((p) => p.value === ch.platform)?.label ||
                        ch.platform}{" "}
                      &middot; {ch.room.nameEn} &middot;{" "}
                      {ch._count.externalBookings} bookings
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleSync(ch.id)}
                    isLoading={syncing === ch.id}
                  >
                    <RefreshCw className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(ch.id)}
                  >
                    <Trash2 className="h-3.5 w-3.5 text-red-400" />
                  </Button>
                </div>
              </div>
              {ch.lastSyncAt && (
                <div className="mt-3 flex items-center gap-2 border-t border-gray-100 pt-3">
                  <span
                    className={`h-1.5 w-1.5 rounded-full ${ch.lastSyncStatus?.startsWith("OK") ? "bg-emerald-500" : "bg-red-500"}`}
                  />
                  <span className="text-[11px] text-gray-400">
                    Last sync: {format(new Date(ch.lastSyncAt), "MMM dd, HH:mm")}
                    {ch.lastSyncStatus && ` — ${ch.lastSyncStatus}`}
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
        </>
      )}
    </div>
  );
}
