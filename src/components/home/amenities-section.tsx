"use client";

import { useLocale, useTranslations } from "next-intl";
import ScrollVelocity from "@/components/react-bits/ScrollVelocity";

const amenityLabels: Record<string, Record<string, string>> = {
  beach: { en: "Beachfront", el: "Μπροστά στην παραλία", de: "Direkt am Strand" },
  wifi: { en: "Free Wi-Fi", el: "Δωρεάν Wi-Fi", de: "Kostenloses WLAN" },
  parking: { en: "Free parking", el: "Δωρεάν πάρκινγκ", de: "Kostenlose Parkplätze" },
  restaurant: { en: "Restaurant", el: "Εστιατόριο", de: "Restaurant" },
  bar: { en: "Bar and snack bar", el: "Μπαρ και σνακ μπαρ", de: "Bar und Snackbar" },
  ac: { en: "Air conditioning", el: "Κλιματισμός", de: "Klimaanlage" },
  kitchen: { en: "Kitchenette in the studios", el: "Κουζινάκι στα στούντιο", de: "Küchenzeile in den Studios" },
  terrace: { en: "Sun terrace", el: "Βεράντα", de: "Sonnenterrasse" },
  playground: { en: "Playground", el: "Παιδική χαρά", de: "Spielplatz" },
};

export function AmenitiesSection() {
  const t = useTranslations("amenities");
  const locale = useLocale();
  const line = Object.values(amenityLabels)
    .map((labels) => labels[locale] || labels.en)
    .join("   ·   ");

  return (
    <section className="overflow-hidden bg-[#1f4f48] py-16 text-[#e8e2d6]">
      <h2 className="sr-only">{t("title")}</h2>
      <ScrollVelocity
        texts={[line, line]}
        velocity={28}
        numCopies={8}
        damping={40}
        stiffness={300}
        className="font-film text-[#9ec9c2]"
        fontSize="clamp(1.6rem, 4vw, 3rem)"
        color="#9ec9c2"
      />
    </section>
  );
}
