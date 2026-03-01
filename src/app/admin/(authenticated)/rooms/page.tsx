"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { BedDouble, Plus, Pencil, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { RoomForm } from "./room-form";

type RoomImage = {
  id: string;
  url: string;
  alt: string | null;
  isPrimary: boolean;
  sortOrder: number;
};

type Room = {
  id: string;
  slug: string;
  nameEn: string;
  nameEl: string;
  nameDe: string;
  descEn: string;
  descEl: string;
  descDe: string;
  capacity: number;
  bedType: string;
  sizeSqm: number;
  basePrice: number | string;
  totalUnits: number;
  amenities: string[];
  isActive: boolean;
  images: RoomImage[];
};

export default function AdminRoomsPage() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingRoom, setEditingRoom] = useState<Room | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    loadRooms();
  }, []);

  async function loadRooms() {
    try {
      const res = await fetch("/api/rooms");
      const data = await res.json();
      setRooms(Array.isArray(data) ? data : []);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }

  function handleCreate() {
    setEditingRoom(null);
    setShowForm(true);
  }

  function handleEdit(room: Room) {
    setEditingRoom(room);
    setShowForm(true);
  }

  async function handleDelete(room: Room) {
    if (!confirm(`Delete "${room.nameEn}"? This cannot be undone if the room has no bookings.`)) return;
    setDeleting(room.id);
    try {
      await fetch(`/api/rooms/${room.id}`, { method: "DELETE" });
      loadRooms();
    } catch {
      alert("Failed to delete room");
    } finally {
      setDeleting(null);
    }
  }

  function handleSaved() {
    setShowForm(false);
    setEditingRoom(null);
    loadRooms();
  }

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center text-sm text-gray-400">
        Loading...
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="mb-8 rounded-2xl bg-gradient-to-r from-deep-blue to-deep-blue-light p-6 text-white shadow-lg lg:p-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold lg:text-3xl">Rooms</h1>
            <p className="mt-1 text-sm text-white/60">
              Manage room types, photos, amenities & pricing
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button onClick={handleCreate}>
              <Plus className="h-4 w-4" />
              Add Room
            </Button>
            <div className="hidden rounded-xl bg-white/10 p-3 backdrop-blur-sm sm:block">
              <BedDouble className="h-6 w-6 text-white/80" />
            </div>
          </div>
        </div>
      </div>

      {/* Form */}
      {showForm && (
        <div className="mb-6">
          <div className="flex items-center justify-between rounded-t-2xl border border-b-0 border-blue-200 bg-blue-50/50 px-6 py-4">
            <h2 className="text-sm font-semibold text-gray-900">
              {editingRoom ? `Edit: ${editingRoom.nameEn}` : "Create New Room"}
            </h2>
            <button
              onClick={() => { setShowForm(false); setEditingRoom(null); }}
              className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-200 hover:text-gray-600"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <RoomForm
            room={editingRoom}
            onSaved={handleSaved}
            onCancel={() => { setShowForm(false); setEditingRoom(null); }}
          />
        </div>
      )}

      {/* Room Cards */}
      {rooms.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-200 bg-white p-16 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-50">
            <BedDouble className="h-7 w-7 text-gray-300" />
          </div>
          <h3 className="mt-5 text-sm font-semibold text-gray-900">
            No rooms yet
          </h3>
          <p className="mx-auto mt-1.5 max-w-sm text-xs leading-relaxed text-gray-400">
            Create your first room to start accepting bookings.
          </p>
          <Button className="mt-4" onClick={handleCreate}>
            <Plus className="h-4 w-4" /> Add Room
          </Button>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {rooms.map((room, i) => {
            const primaryImage = room.images.find((img) => img.isPrimary) || room.images[0];
            return (
              <div
                key={room.id}
                className="group relative overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
                style={{ animation: `slide-up 0.4s ease-out ${i * 0.06}s both` }}
              >
                {/* Image */}
                <div className="relative aspect-video overflow-hidden">
                  {primaryImage ? (
                    <Image
                      src={primaryImage.url}
                      alt={room.nameEn}
                      fill
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                      sizes="400px"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center bg-gray-100">
                      <BedDouble className="h-12 w-12 text-gray-300" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent" />

                  {/* Hover actions */}
                  <div className="absolute right-3 top-3 flex gap-1.5 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                    <button
                      onClick={() => handleEdit(room)}
                      className="rounded-lg bg-white/90 p-2 text-gray-700 shadow-sm backdrop-blur-sm transition-colors hover:bg-white"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(room)}
                      disabled={deleting === room.id}
                      className="rounded-lg bg-white/90 p-2 text-red-500 shadow-sm backdrop-blur-sm transition-colors hover:bg-white disabled:opacity-50"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>

                  {/* Price badge */}
                  <div className="absolute bottom-3 left-3">
                    <div className="flex items-baseline gap-1 rounded-lg bg-black/50 px-3 py-1.5 backdrop-blur-sm">
                      <span className="text-lg font-bold text-white">
                        &euro;{Number(room.basePrice)}
                      </span>
                      <span className="text-xs text-white/70">/ night</span>
                    </div>
                  </div>

                  {/* Image count */}
                  {room.images.length > 1 && (
                    <div className="absolute bottom-3 right-3 rounded-md bg-black/50 px-2 py-0.5 text-[11px] font-medium text-white/80 backdrop-blur-sm">
                      {room.images.length} photos
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="p-5">
                  <h3 className="text-base font-semibold text-gray-900">
                    {room.nameEn}
                  </h3>
                  <div className="mt-2.5 flex flex-wrap gap-1.5">
                    <span className="inline-flex items-center gap-1 rounded-lg bg-gray-50 px-2.5 py-1 text-xs font-medium text-gray-600">
                      {room.capacity} guests
                    </span>
                    {room.sizeSqm > 0 && (
                      <span className="inline-flex items-center gap-1 rounded-lg bg-gray-50 px-2.5 py-1 text-xs font-medium text-gray-600">
                        {room.sizeSqm} m&sup2;
                      </span>
                    )}
                    <span className="inline-flex items-center gap-1 rounded-lg bg-gray-50 px-2.5 py-1 text-xs font-medium text-gray-600">
                      {room.totalUnits} unit{room.totalUnits > 1 ? "s" : ""}
                    </span>
                    {room.bedType && (
                      <span className="inline-flex items-center gap-1 rounded-lg bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-600">
                        {room.bedType}
                      </span>
                    )}
                  </div>
                  {room.amenities.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-1">
                      {room.amenities.slice(0, 4).map((a) => (
                        <span
                          key={a}
                          className="rounded-md bg-sandy-light/70 px-2 py-0.5 text-[11px] text-gray-500"
                        >
                          {a}
                        </span>
                      ))}
                      {room.amenities.length > 4 && (
                        <span className="rounded-md bg-sandy-light/70 px-2 py-0.5 text-[11px] text-gray-400">
                          +{room.amenities.length - 4}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
