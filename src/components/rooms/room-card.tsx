"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import TiltedCard from "@/components/react-bits/TiltedCard";

type RoomCardProps = {
  slug: string;
  name: string;
  capacity: number;
  sizeSqm: number;
  basePrice: number;
  imageUrl: string;
};

export function RoomCard({
  slug,
  name,
  capacity,
  sizeSqm,
  basePrice: _basePrice,
  imageUrl,
}: RoomCardProps) {
  const t = useTranslations("rooms");

  return (
    <Link href={`/rooms/${slug}`} className="block">
      <TiltedCard
        imageSrc={imageUrl}
        altText={name}
        captionText={name}
        showTooltip={false}
        floating
        intro
        glare={0.35}
        shadow={0.45}
        containerHeight="440px"
        containerWidth="100%"
        imageHeight="440px"
        imageWidth="100%"
        rotateAmplitude={16}
        scaleOnHover={1.06}
        displayOverlayContent
        overlayContent={
          <div className="flex h-full flex-col justify-end p-4 text-[#e8e2d6]">
            <div className="glass-on-photo rounded-2xl p-4">
            <p className="font-film text-3xl leading-none">{name}</p>
            <p className="mt-3 text-sm leading-relaxed text-[#e8e2d6]/75">
              {t("capacity", { count: capacity })}
              <br />
              {t("size", { size: sizeSqm })}
            </p>
            </div>
          </div>
        }
      />
    </Link>
  );
}
