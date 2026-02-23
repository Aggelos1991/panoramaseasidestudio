"use client";

import { useTranslations } from "next-intl";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { Users, Maximize, Check } from "lucide-react";
import type { AvailableRoom } from "@/app/[locale]/booking/page";

type Props = {
  rooms: AvailableRoom[];
  loading: boolean;
  selectedRoom: AvailableRoom | null;
  onSelect: (room: AvailableRoom) => void;
};

export function RoomSelector({ rooms, loading, selectedRoom, onSelect }: Props) {
  const t = useTranslations("booking");

  if (loading) {
    return (
      <div className="rounded-2xl bg-white p-8 shadow-soft">
        <h3 className="mb-6 font-serif text-xl font-semibold text-deep-blue">
          {t("selectRoom")}
        </h3>
        <div className="grid gap-4 sm:grid-cols-2">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="animate-pulse rounded-xl border border-sandy p-4"
            >
              <div className="aspect-video rounded-lg bg-sandy" />
              <div className="mt-4 h-5 w-3/4 rounded bg-sandy" />
              <div className="mt-2 h-4 w-1/2 rounded bg-sandy" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl bg-white p-6 shadow-soft sm:p-8">
      <h3 className="mb-6 font-serif text-xl font-semibold text-deep-blue">
        {t("selectRoom")}
      </h3>

      {rooms.length === 0 ? (
        <p className="text-center text-gray-500 py-8">{t("noRoomsAvailable")}</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {rooms.map((room) => {
            const isSelected = selectedRoom?.id === room.id;
            return (
              <button
                key={room.id}
                onClick={() => onSelect(room)}
                className={cn(
                  "group relative overflow-hidden rounded-xl border-2 p-4 text-left transition-all",
                  isSelected
                    ? "border-terracotta bg-terracotta/5 shadow-md"
                    : "border-sandy hover:border-terracotta/50 hover:shadow-soft",
                )}
              >
                {isSelected && (
                  <div className="absolute right-3 top-3 z-10 flex h-7 w-7 items-center justify-center rounded-full bg-terracotta text-white">
                    <Check className="h-4 w-4" />
                  </div>
                )}

                <div className="relative aspect-video overflow-hidden rounded-lg">
                  <Image
                    src={room.imageUrl}
                    alt={room.name}
                    fill
                    className="object-cover transition-transform group-hover:scale-105"
                    sizes="(max-width: 640px) 100vw, 50vw"
                  />
                </div>

                <div className="mt-4">
                  <h4 className="font-serif text-lg font-semibold text-deep-blue">
                    {room.name}
                  </h4>
                  <div className="mt-2 flex items-center gap-3 text-sm text-gray-500">
                    <span className="flex items-center gap-1">
                      <Users className="h-3.5 w-3.5" />
                      {room.capacity}
                    </span>
                    <span className="flex items-center gap-1">
                      <Maximize className="h-3.5 w-3.5" />
                      {room.sizeSqm} m&sup2;
                    </span>
                  </div>
                  <div className="mt-3 flex items-baseline gap-1">
                    <span className="text-2xl font-bold text-terracotta">
                      &euro;{room.pricePerNight}
                    </span>
                    <span className="text-sm text-gray-400">
                      / {t("pricePerNight").toLowerCase()}
                    </span>
                  </div>
                  <div className="mt-1 text-sm text-gray-500">
                    {t("nights", { count: room.nights })} &middot;{" "}
                    <span className="font-semibold text-deep-blue">
                      {t("totalPrice")}: &euro;{room.totalPrice}
                    </span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
