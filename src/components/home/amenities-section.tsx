"use client";

import { useTranslations, useLocale } from "next-intl";
import {
  Wifi,
  AirVent,
  CookingPot,
  Umbrella,
  Car,
  Sun,
  Compass,
  UtensilsCrossed,
  TreePalm,
} from "lucide-react";
import { useAnimateOnScroll } from "@/hooks/use-animate-on-scroll";

const amenities = [
  { key: "wifi", icon: Wifi },
  { key: "ac", icon: AirVent },
  { key: "kitchen", icon: CookingPot },
  { key: "beach", icon: Umbrella },
  { key: "parking", icon: Car },
  { key: "balcony", icon: Sun },
  { key: "sea_view", icon: Compass },
  { key: "restaurant", icon: UtensilsCrossed },
  { key: "garden", icon: TreePalm },
];

const amenityLabels: Record<string, Record<string, string>> = {
  wifi: { en: "Free Wi-Fi", el: "Δωρεάν Wi-Fi", de: "Kostenloses WLAN" },
  ac: { en: "Air Conditioning", el: "Κλιματισμός", de: "Klimaanlage" },
  kitchen: { en: "Kitchenette", el: "Μικρή Κουζίνα", de: "Küchenzeile" },
  beach: { en: "Beach Access", el: "Πρόσβαση Παραλίας", de: "Strandzugang" },
  parking: { en: "Free Parking", el: "Δωρεάν Πάρκινγκ", de: "Kostenlose Parkplätze" },
  balcony: { en: "Private Balcony", el: "Ιδιωτικό Μπαλκόνι", de: "Privater Balkon" },
  sea_view: { en: "Sea View", el: "Θέα Θάλασσα", de: "Meerblick" },
  restaurant: { en: "Restaurant", el: "Εστιατόριο", de: "Restaurant" },
  garden: { en: "Garden", el: "Κήπος", de: "Garten" },
};

export function AmenitiesSection() {
  const t = useTranslations("amenities");
  const locale = useLocale();
  const { ref, isVisible } = useAnimateOnScroll();

  return (
    <section className="bg-deep-blue py-20 sm:py-28">
      <div ref={ref} className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div
          className={`text-center transition-all duration-700 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}
        >
          <div className="mb-2 flex items-center justify-center gap-3">
            <div className="h-px w-8 bg-gold" />
            <span className="text-sm font-medium uppercase tracking-wider text-gold">
              {t("subtitle")}
            </span>
            <div className="h-px w-8 bg-gold" />
          </div>
          <h2 className="font-serif text-3xl font-bold text-white sm:text-4xl">
            {t("title")}
          </h2>
        </div>

        <div className="mt-14 grid grid-cols-2 gap-4 sm:grid-cols-3 sm:gap-6 md:grid-cols-5 lg:grid-cols-9">
          {amenities.map(({ key, icon: Icon }, i) => (
            <div
              key={key}
              className={`group flex flex-col items-center gap-3 rounded-xl glass-dark p-4 transition-all duration-500 hover:bg-white/10 ${
                isVisible
                  ? "opacity-100 translate-y-0"
                  : "opacity-0 translate-y-6"
              }`}
              style={{ transitionDelay: isVisible ? `${200 + i * 80}ms` : "0ms" }}
            >
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white/10 text-gold transition-all duration-300 group-hover:bg-gold group-hover:text-deep-blue group-hover:shadow-glow-gold">
                <Icon className="h-6 w-6" />
              </div>
              <span className="text-center text-xs font-medium text-white/80">
                {amenityLabels[key]?.[locale] || amenityLabels[key]?.en}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
