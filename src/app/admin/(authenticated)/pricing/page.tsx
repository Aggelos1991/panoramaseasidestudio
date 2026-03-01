"use client";

import { useEffect, useState } from "react";
import {
  Euro,
  Plus,
  Trash2,
  Calendar,
  Sun,
  Info,
  Leaf,
  Flame,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { format, differenceInDays } from "date-fns";

type Room = { id: string; nameEn: string; slug: string };

type PricingRule = {
  id: string;
  name: string;
  roomId: string;
  startDate: string;
  endDate: string;
  pricePerNight: number;
  daysOfWeek: number[];
  room: { nameEn: string; slug: string };
};

const DAY_LABELS = [
  { value: 0, label: "Sun" },
  { value: 1, label: "Mon" },
  { value: 2, label: "Tue" },
  { value: 3, label: "Wed" },
  { value: 4, label: "Thu" },
  { value: 5, label: "Fri" },
  { value: 6, label: "Sat" },
];

const SEASON_PRESETS = [
  {
    name: "Shoulder Season",
    icon: Leaf,
    color: "bg-amber-100 text-amber-700",
    start: "04-01",
    end: "05-31",
    description: "Apr – May",
  },
  {
    name: "High Season",
    icon: Sun,
    color: "bg-orange-100 text-orange-700",
    start: "06-01",
    end: "08-31",
    description: "Jun – Aug",
  },
  {
    name: "Peak Season",
    icon: Flame,
    color: "bg-red-100 text-red-700",
    start: "07-15",
    end: "08-31",
    description: "Jul 15 – Aug 31",
  },
];

export default function PricingPage() {
  const [rules, setRules] = useState<PricingRule[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);

  // Form state
  const [formName, setFormName] = useState("");
  const [formRoom, setFormRoom] = useState("");
  const [formStart, setFormStart] = useState("");
  const [formEnd, setFormEnd] = useState("");
  const [formPrice, setFormPrice] = useState("");
  const [formDays, setFormDays] = useState<number[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const [rulesRes, roomsRes] = await Promise.all([
        fetch("/api/pricing-rules"),
        fetch("/api/rooms"),
      ]);
      const rulesData = await rulesRes.json();
      const roomsData = await roomsRes.json();
      setRules(rulesData.rules || []);
      setRooms(Array.isArray(roomsData) ? roomsData : roomsData.rooms || []);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }

  async function handleAdd() {
    if (!formName || !formRoom || !formStart || !formEnd || !formPrice) return;
    setSaving(true);
    try {
      const res = await fetch("/api/pricing-rules", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formName,
          roomId: formRoom,
          startDate: formStart,
          endDate: formEnd,
          pricePerNight: Number(formPrice),
          daysOfWeek: formDays,
        }),
      });
      if (res.ok) {
        setShowForm(false);
        resetForm();
        loadData();
      } else {
        const data = await res.json();
        alert(data.error || "Failed to add rule");
      }
    } catch {
      alert("Failed to add pricing rule");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this pricing rule?")) return;
    try {
      await fetch(`/api/pricing-rules?id=${id}`, { method: "DELETE" });
      loadData();
    } catch {
      alert("Failed to delete");
    }
  }

  function resetForm() {
    setFormName("");
    setFormRoom("");
    setFormStart("");
    setFormEnd("");
    setFormPrice("");
    setFormDays([]);
  }

  function applyPreset(preset: (typeof SEASON_PRESETS)[number]) {
    const year = new Date().getFullYear();
    const nextYear = year + 1;

    setFormName(preset.name);

    // Handle seasons that cross year boundaries
    if (preset.start > preset.end) {
      setFormStart(`${year}-${preset.start}`);
      setFormEnd(`${nextYear}-${preset.end}`);
    } else {
      setFormStart(`${year}-${preset.start}`);
      setFormEnd(`${year}-${preset.end}`);
    }

    setShowForm(true);
  }

  // Group rules by room
  const rulesByRoom = rooms.map((room) => ({
    room,
    rules: rules
      .filter((r) => r.roomId === room.id)
      .sort(
        (a, b) =>
          new Date(a.startDate).getTime() - new Date(b.startDate).getTime(),
      ),
  }));

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center text-sm text-gray-400">
        Loading...
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <div className="mb-8 rounded-2xl bg-gradient-to-r from-deep-blue to-deep-blue-light p-6 text-white shadow-lg lg:p-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold lg:text-3xl">Seasonal Pricing</h1>
            <p className="mt-1 text-sm text-white/60">
              Set custom prices per room for specific date ranges. Falls back to
              base price when no rule applies.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button onClick={() => setShowForm(true)}>
              <Plus className="h-4 w-4" />
              Add Rule
            </Button>
            <div className="hidden rounded-xl bg-white/10 p-3 backdrop-blur-sm sm:block">
              <Euro className="h-6 w-6 text-white/80" />
            </div>
          </div>
        </div>
      </div>


      {/* Closed Season Info */}
      <div className="mb-6 flex items-start gap-3 rounded-xl border border-blue-200 bg-blue-50 px-5 py-4">
        <Info className="mt-0.5 h-5 w-5 flex-shrink-0 text-blue-500" />
        <p className="text-sm leading-relaxed text-blue-800">
          Rooms are closed November through March. Pricing rules only apply
          during the open season (April &ndash; October).
        </p>
      </div>

      {/* Season Presets */}
      <div className="mb-6 rounded-2xl bg-white p-5 shadow-sm">
        <h2 className="text-sm font-semibold text-gray-900">Quick Presets</h2>
        <p className="mt-1 text-xs text-gray-400">
          Click a preset to pre-fill the date range, then select a room and set
          the price
        </p>
        <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
          {SEASON_PRESETS.map((preset) => (
            <button
              key={preset.name}
              onClick={() => applyPreset(preset)}
              className="flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2.5 text-left transition-colors hover:border-gray-300 hover:bg-gray-50"
            >
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-lg ${preset.color}`}
              >
                <preset.icon className="h-4 w-4" />
              </div>
              <div>
                <div className="text-xs font-semibold text-gray-900">
                  {preset.name}
                </div>
                <div className="text-[10px] text-gray-400">
                  {preset.description}
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Add Rule Form */}
      {showForm && (
        <div className="mb-6 rounded-2xl border border-blue-200 bg-blue-50/30 p-6">
          <h3 className="text-sm font-semibold text-gray-900">
            Add Pricing Rule
          </h3>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <label className="block text-xs font-medium text-gray-600">
                Rule Name
              </label>
              <input
                type="text"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="e.g. High Season"
                className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-deep-blue focus:outline-none"
              />
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
                Price Per Night (&euro;)
              </label>
              <input
                type="number"
                min="1"
                step="1"
                value={formPrice}
                onChange={(e) => setFormPrice(e.target.value)}
                placeholder="95"
                className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-deep-blue focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600">
                Start Date
              </label>
              <input
                type="date"
                value={formStart}
                onChange={(e) => setFormStart(e.target.value)}
                className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-deep-blue focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600">
                End Date
              </label>
              <input
                type="date"
                value={formEnd}
                onChange={(e) => setFormEnd(e.target.value)}
                className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-deep-blue focus:outline-none"
              />
            </div>
            <div className="sm:col-span-2 lg:col-span-3">
              <label className="block text-xs font-medium text-gray-600">
                Days of Week{" "}
                <span className="text-xs font-normal text-gray-400">
                  (leave empty for all days)
                </span>
              </label>
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                {DAY_LABELS.map((d) => {
                  const isSelected = formDays.includes(d.value);
                  return (
                    <button
                      key={d.value}
                      type="button"
                      onClick={() =>
                        setFormDays((prev) =>
                          isSelected
                            ? prev.filter((v) => v !== d.value)
                            : [...prev, d.value],
                        )
                      }
                      className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
                        isSelected
                          ? "border-deep-blue bg-deep-blue/10 text-deep-blue"
                          : "border-gray-200 text-gray-500 hover:border-gray-300 hover:bg-gray-50"
                      }`}
                    >
                      {d.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
          <div className="mt-4 flex gap-2">
            <Button onClick={handleAdd} isLoading={saving}>
              Add Rule
            </Button>
            <Button
              variant="ghost"
              onClick={() => {
                setShowForm(false);
                resetForm();
              }}
            >
              Cancel
            </Button>
          </div>
        </div>
      )}

      {/* Rules by Room */}
      {rules.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-200 bg-white p-16 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-50">
            <Euro className="h-7 w-7 text-gray-300" />
          </div>
          <h3 className="mt-5 text-sm font-semibold text-gray-900">
            No pricing rules yet
          </h3>
          <p className="mx-auto mt-1.5 max-w-sm text-xs leading-relaxed text-gray-400">
            All rooms use their base price. Add seasonal rules to adjust prices
            for specific date ranges.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {rulesByRoom
            .filter((g) => g.rules.length > 0)
            .map(({ room, rules: roomRules }) => (
              <div
                key={room.id}
                className="rounded-2xl bg-white shadow-sm overflow-hidden"
              >
                <div className="border-b border-gray-100 px-5 py-3">
                  <h3 className="text-sm font-semibold text-gray-900">
                    {room.nameEn}
                  </h3>
                </div>

                {/* Timeline visualization */}
                <div className="px-5 py-3 border-b border-gray-50">
                  <div className="flex gap-1 overflow-x-auto">
                    {roomRules.map((rule) => {
                      const days = Math.max(
                        1,
                        differenceInDays(
                          new Date(rule.endDate),
                          new Date(rule.startDate),
                        ),
                      );
                      const width = Math.max(60, Math.min(days * 2, 300));
                      return (
                        <div
                          key={rule.id}
                          className="flex-shrink-0 rounded-md bg-gradient-to-r from-deep-blue/10 to-terracotta/10 px-3 py-1.5 text-center"
                          style={{ width: `${width}px` }}
                          title={`${rule.name}: €${Number(rule.pricePerNight)}/night (${format(new Date(rule.startDate), "MMM dd")} – ${format(new Date(rule.endDate), "MMM dd")})`}
                        >
                          <div className="truncate text-[10px] font-semibold text-deep-blue">
                            {rule.name}
                          </div>
                          <div className="text-[10px] text-gray-400">
                            &euro;{Number(rule.pricePerNight)}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Rules table */}
                <div className="divide-y divide-gray-50">
                  {roomRules.map((rule) => (
                    <div
                      key={rule.id}
                      className="flex items-center justify-between px-5 py-3"
                    >
                      <div className="flex items-center gap-4">
                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-100/80">
                          <Calendar className="h-4 w-4 text-emerald-600" />
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {rule.name}
                          </div>
                          <div className="text-xs text-gray-400">
                            {format(new Date(rule.startDate), "MMM dd, yyyy")}{" "}
                            &ndash;{" "}
                            {format(new Date(rule.endDate), "MMM dd, yyyy")}
                            <span className="ml-2 text-gray-300">
                              (
                              {differenceInDays(
                                new Date(rule.endDate),
                                new Date(rule.startDate),
                              )}{" "}
                              days)
                            </span>
                            {rule.daysOfWeek && rule.daysOfWeek.length > 0 && (
                              <span className="ml-2 inline-flex gap-0.5">
                                {rule.daysOfWeek
                                  .sort((a, b) => a - b)
                                  .map((d) => (
                                    <span
                                      key={d}
                                      className="rounded bg-deep-blue/10 px-1.5 py-0.5 text-[10px] font-medium text-deep-blue"
                                    >
                                      {DAY_LABELS.find((l) => l.value === d)?.label}
                                    </span>
                                  ))}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <div className="text-sm font-bold text-gray-900">
                            &euro;{Number(rule.pricePerNight)}
                          </div>
                          <div className="text-[10px] text-gray-400">
                            per night
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(rule.id)}
                        >
                          <Trash2 className="h-3.5 w-3.5 text-red-400" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
        </div>
      )}
    </div>
  );
}
