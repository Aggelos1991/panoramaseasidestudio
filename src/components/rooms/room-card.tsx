"use client";

import Image from "next/image";
import { useTranslations, useLocale } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Users, Maximize, ArrowRight } from "lucide-react";

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
  basePrice,
  imageUrl,
}: RoomCardProps) {
  const t = useTranslations("rooms");

  return (
    <Link
      href={`/rooms/${slug}`}
      className="group overflow-hidden rounded-2xl bg-white shadow-soft transition-all duration-300 hover:shadow-elegant hover:-translate-y-1"
    >
      <div className="relative aspect-[4/3] overflow-hidden">
        <Image
          src={imageUrl}
          alt={name}
          fill
          className="object-cover transition-transform duration-500 group-hover:scale-110"
          sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, 25vw"
        />
        <div className="absolute bottom-3 right-3 rounded-lg bg-terracotta px-3 py-1.5 text-sm font-semibold text-white shadow-md">
          {t("from")} &euro;{basePrice}
        </div>
      </div>
      <div className="p-5">
        <h3 className="font-serif text-lg font-semibold text-deep-blue">
          {name}
        </h3>
        <div className="mt-3 flex items-center gap-4 text-sm text-gray-500">
          <span className="flex items-center gap-1.5">
            <Users className="h-4 w-4" />
            {t("capacity", { count: capacity })}
          </span>
          <span className="flex items-center gap-1.5">
            <Maximize className="h-4 w-4" />
            {t("size", { size: sizeSqm })}
          </span>
        </div>
        <div className="mt-4 flex items-center gap-1 text-sm font-medium text-terracotta opacity-0 transition-opacity duration-300 group-hover:opacity-100">
          {t("viewDetails")} <ArrowRight className="h-4 w-4" />
        </div>
      </div>
    </Link>
  );
}
