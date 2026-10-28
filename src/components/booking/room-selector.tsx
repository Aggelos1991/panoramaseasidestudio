"use client";

import { useLocale, useTranslations } from "next-intl";
import { motion, useReducedMotion } from "motion/react";
import { cn } from "@/lib/utils";
import { Check } from "lucide-react";
import { AMENITY_LABELS } from "@/lib/constants";
import TiltedCard from "@/components/react-bits/TiltedCard";
import { cinematic } from "@/components/motion/reel";
import type { AvailableRoom } from "@/app/[locale]/booking/page";

type Props = {
  rooms: AvailableRoom[];
  loading: boolean;
  selectedRoom: AvailableRoom | null;
  onSelect: (room: AvailableRoom) => void;
};

export function RoomSelector({ rooms, loading, selectedRoom, onSelect }: Props) {
  const t = useTranslations("booking");
  const roomsT = useTranslations("rooms");
  const locale = useLocale();
  const reduce = useReducedMotion();

  if (loading) {
    return (
      <div className="grid gap-8 sm:grid-cols-2">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="h-[440px] animate-pulse rounded-3xl bg-black/5" />
        ))}
      </div>
    );
  }

  return (
    <div>
      <h3 className="font-film text-4xl font-medium leading-none tracking-tight text-[#1c1916] sm:text-5xl">
        {t("selectRoom")}
      </h3>

      {rooms.length === 0 ? (
        <p className="py-12 text-center text-[#1c1916]/70">{t("noRoomsAvailable")}</p>
      ) : (
        <div className="mt-10 grid gap-10 sm:grid-cols-2">
          {rooms.map((room, index) => {
            const isSelected = selectedRoom?.id === room.id;
            const amenities = (room.amenities ?? [])
              .slice(0, 3)
              .map((key) => AMENITY_LABELS[key]?.[locale] || AMENITY_LABELS[key]?.en || key)
              .join(" · ");
            return (
              <motion.button
                key={room.id}
                type="button"
                aria-pressed={isSelected}
                onClick={() => onSelect(room)}
                initial={reduce ? false : { y: 36 }}
                animate={{ y: 0 }}
                transition={
                  reduce
                    ? { duration: 0 }
                    : { duration: 0.85, delay: index * 0.08, ease: cinematic }
                }
                className={cn(
                  "relative block w-full rounded-[28px] text-left",
                  isSelected && "ring-2 ring-[#8a6232] ring-offset-4 ring-offset-[#f3efe8]",
                )}
              >
                <TiltedCard
                  imageSrc={room.imageUrl}
                  altText={room.name}
                  captionText={room.name}
                  showTooltip={false}
                  floating
                  intro={false}
                  introDelay={index * 120}
                  glare={0.35}
                  shadow={0.4}
                  containerHeight="440px"
                  containerWidth="100%"
                  imageHeight="440px"
                  imageWidth="100%"
                  rotateAmplitude={16}
                  scaleOnHover={1.06}
                  displayOverlayContent
                  overlayContent={
                    <div className="flex h-full flex-col justify-end p-4 text-[#f3efe8]">
                      <div className="glass-on-photo rounded-2xl p-4">
                        <p className="font-film text-3xl leading-none">{room.name}</p>
                        <p className="mt-3 text-sm leading-relaxed text-[#f3efe8]/80">
                          {roomsT("capacity", { count: room.capacity })}
                          <br />
                          {roomsT("size", { size: room.sizeSqm })}
                        </p>
                        {amenities && (
                          <p className="mt-3 text-sm text-[#e4d2a8]">{amenities}</p>
                        )}
                      </div>
                    </div>
                  }
                />
                {isSelected && (
                  <span className="pointer-events-none absolute right-4 top-4 z-30 flex h-8 w-8 items-center justify-center rounded-full bg-[#1c1916] text-[#f3efe8]">
                    <Check className="h-4 w-4" aria-hidden="true" />
                  </span>
                )}
              </motion.button>
            );
          })}
        </div>
      )}
    </div>
  );
}
