"use client";

import Image from "next/image";
import { useTranslations } from "next-intl";
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
      className="group flex h-full flex-col overflow-hidden rounded-2xl bg-white shadow-soft transition-all duration-300 hover:shadow-elegant hover:-translate-y-1"
    >
      <div className="relative aspect-[4/3] overflow-hidden">
        <Image
          src={imageUrl}
          alt={name}
          fill
          className="object-cover transition-transform duration-500 group-hover:scale-110"
          sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, 33vw"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
        <div className="absolute bottom-3 right-3 rounded-lg bg-terracotta/90 backdrop-blur-sm px-3 py-1.5 text-sm font-semibold text-white shadow-md">
          {t("from")} &euro;{basePrice}
        </div>
      </div>
      <div className="flex flex-1 flex-col p-4">
        <h3 className="font-serif text-base font-semibold text-deep-blue">
          {name}
        </h3>
        <div className="mt-2 flex items-center gap-3 text-xs text-gray-500">
          <span className="flex items-center gap-1">
            <Users className="h-3.5 w-3.5" />
            {t("capacity", { count: capacity })}
          </span>
          <span className="flex items-center gap-1">
            <Maximize className="h-3.5 w-3.5" />
            {t("size", { size: sizeSqm })}
          </span>
        </div>
        <div className="mt-auto pt-3 flex items-center gap-1 text-xs font-medium text-terracotta transition-all duration-300 group-hover:translate-x-1">
          {t("viewDetails")} <ArrowRight className="h-3.5 w-3.5" />
        </div>
      </div>
    </Link>
  );
}
