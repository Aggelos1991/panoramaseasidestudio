"use client";

import { useLocale } from "next-intl";
import { usePathname, useRouter } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { useState, useRef, useEffect } from "react";
import { Globe } from "lucide-react";
import { cn } from "@/lib/utils";

const localeLabels: Record<string, string> = {
  en: "EN",
  el: "GR",
  de: "DE",
};

const localeNames: Record<string, string> = {
  en: "English",
  el: "Ελληνικά",
  de: "Deutsch",
};

export function LanguageSwitcher() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function handleSwitch(newLocale: string) {
    router.replace(pathname, { locale: newLocale as (typeof routing.locales)[number] });
    setOpen(false);
  }

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-deep-blue transition-colors hover:bg-sandy-light"
        aria-label="Change language"
      >
        <Globe className="h-4 w-4" />
        <span>{localeLabels[locale]}</span>
      </button>
      {open && (
        <div className="absolute right-0 top-full z-50 mt-1 min-w-[140px] overflow-hidden rounded-lg border border-sandy-dark bg-white shadow-elegant animate-slide-down">
          {routing.locales.map((loc) => (
            <button
              key={loc}
              onClick={() => handleSwitch(loc)}
              className={cn(
                "flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm transition-colors hover:bg-sandy-light",
                loc === locale && "bg-sandy font-medium text-terracotta",
              )}
            >
              <span className="font-semibold">{localeLabels[loc]}</span>
              <span className="text-gray-500">{localeNames[loc]}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
