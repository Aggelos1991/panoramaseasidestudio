"use client";

import { useTranslations } from "next-intl";
import { PanoramaLogo } from "@/components/ui/panorama-logo";

export function Footer() {
  const t = useTranslations("footer");

  return (
    <footer className="bg-deep-blue text-white">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center gap-4">
          <PanoramaLogo variant="gold" showIcon={true} glow={true} className="h-10" />
          <p className="text-center text-xs text-white/40">
            &copy; {new Date().getFullYear()} Panorama Seaside Studios. {t("rights")}
          </p>
        </div>
      </div>
    </footer>
  );
}
