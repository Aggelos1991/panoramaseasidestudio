"use client";

import { useTranslations, useLocale } from "next-intl";
import { Link } from "@/i18n/navigation";
import { getLocalizedField } from "@/lib/utils";
import TiltedCard from "@/components/react-bits/TiltedCard";
import { Reel, ReelGroup, ReelItem } from "@/components/motion/reel";

type RoomPreview = {
  slug: string;
  nameEn: string;
  nameEl: string;
  nameDe: string;
  capacity: number;
  sizeSqm: number;
  basePrice: number;
  primaryImage: string;
};

export function RoomsPreview({ rooms }: { rooms: RoomPreview[] }) {
  const t = useTranslations("rooms");
  const locale = useLocale();

  return (
    <section id="accommodations" className="bg-[#f3efe8] px-5 py-20 text-[#1c1916] sm:px-10 sm:py-28 lg:px-16">
      <Reel>
      <h2 className="font-film text-4xl font-medium leading-none tracking-tight sm:text-5xl">
        {t("title")}
      </h2>
      </Reel>

      <ReelGroup className="mt-12 grid gap-10 sm:grid-cols-2 xl:grid-cols-3">
        {rooms.map((room, index) => {
          const name = getLocalizedField(room, "name", locale);
          return (
            <ReelItem key={room.slug}>
            <Link href={`/rooms/${room.slug}`} className="block">
              <TiltedCard
                imageSrc={room.primaryImage}
                altText={name}
                captionText={name}
                showTooltip={false}
                floating
                intro
                introDelay={index * 90}
                containerHeight="440px"
                containerWidth="100%"
                imageHeight="440px"
                imageWidth="100%"
                rotateAmplitude={10}
                scaleOnHover={1.04}
                displayOverlayContent
                overlayContent={
                  <div className="flex h-full flex-col justify-end p-4 text-[#f3efe8]">
                    <div className="glass-on-photo rounded-2xl p-4">
                    <p className="text-sm text-[#e4d2a8]">
                      {t("from")} €{room.basePrice}
                    </p>
                    <p className="font-film mt-1 text-3xl leading-none">{name}</p>
                    <p className="mt-3 text-sm leading-relaxed text-[#f3efe8]/80">
                      {t("capacity", { count: room.capacity })}
                      <br />
                      {t("size", { size: room.sizeSqm })}
                    </p>
                    </div>
                  </div>
                }
              />
            </Link>
            </ReelItem>
          );
        })}
      </ReelGroup>
    </section>
  );
}
