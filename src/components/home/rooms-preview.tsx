"use client";

import { useTranslations, useLocale } from "next-intl";
import Image from "next/image";
import { Link } from "@/i18n/navigation";
import { Users, Maximize, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getLocalizedField } from "@/lib/utils";
import { useAnimateOnScroll } from "@/hooks/use-animate-on-scroll";

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
  const { ref, isVisible } = useAnimateOnScroll();

  return (
    <section className="bg-cream py-20 sm:py-28">
      <div ref={ref} className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div
          className={`text-center transition-all duration-700 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}
        >
          <div className="mb-2 flex items-center justify-center gap-3">
            <div className="h-px w-8 bg-gold" />
            <span className="text-sm font-medium uppercase tracking-wider text-terracotta">
              {t("subtitle")}
            </span>
            <div className="h-px w-8 bg-gold" />
          </div>
          <h2 className="font-serif text-3xl font-bold text-deep-blue sm:text-4xl">
            {t("title")}
          </h2>
        </div>

        {/* Room Cards — Glassmorphism */}
        <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {rooms.map((room, i) => (
            <Link
              key={room.slug}
              href={`/rooms/${room.slug}`}
              className={`group overflow-hidden rounded-2xl glass-gold card-hover transition-all duration-700 ${
                isVisible
                  ? "opacity-100 translate-y-0"
                  : "opacity-0 translate-y-8"
              }`}
              style={{ transitionDelay: isVisible ? `${200 + i * 150}ms` : "0ms" }}
            >
              <div className="relative aspect-[4/3] overflow-hidden">
                <Image
                  src={room.primaryImage}
                  alt={getLocalizedField(room, "name", locale)}
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-110"
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
                <div className="absolute bottom-3 right-3 rounded-lg bg-terracotta/90 backdrop-blur-sm px-3 py-1.5 text-sm font-semibold text-white shadow-md">
                  {t("from")} &euro;{room.basePrice}
                </div>
              </div>
              <div className="p-5">
                <h3 className="font-serif text-lg font-semibold text-deep-blue">
                  {getLocalizedField(room, "name", locale)}
                </h3>
                <div className="mt-3 flex items-center gap-4 text-sm text-gray-500">
                  <span className="flex items-center gap-1.5">
                    <Users className="h-4 w-4" />
                    {room.capacity}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Maximize className="h-4 w-4" />
                    {room.sizeSqm} m&sup2;
                  </span>
                </div>
                <div className="mt-4 flex items-center gap-1 text-sm font-medium text-terracotta transition-all duration-300 group-hover:translate-x-1">
                  {t("viewDetails")} <ArrowRight className="h-4 w-4" />
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* View All Button */}
        <div
          className={`mt-12 text-center transition-all duration-700 delay-700 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}
        >
          <Link href="/rooms">
            <Button variant="outline" size="lg" className="btn-glow">
              {t("viewDetails")}
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}
