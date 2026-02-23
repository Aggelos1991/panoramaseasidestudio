"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { PanoramaLogo } from "@/components/ui/panorama-logo";
import Image from "next/image";
import { PLACEHOLDER_IMAGES } from "@/lib/constants";
import { useEffect, useState } from "react";

export function HeroSection() {
  const t = useTranslations("hero");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <section className="relative h-screen min-h-[600px]">
      {/* Background Image */}
      <div className="absolute inset-0">
        <Image
          src={PLACEHOLDER_IMAGES.hero[0]}
          alt="Panorama Seaside Studios - Beachfront accommodation in Mastichari, Kos"
          fill
          className="object-cover"
          priority
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/65 via-black/40 to-black/75" />
      </div>

      {/* Content */}
      <div className="relative flex h-full items-center justify-center px-4 text-center">
        <div className="max-w-3xl">
          {/* Glowing Logo */}
          <div
            className={`mb-8 transition-all duration-1000 ${mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}
          >
            <PanoramaLogo
              variant="light"
              showIcon={true}
              glow={true}
              className="mx-auto"
            />
          </div>

          {/* Decorative line */}
          <div
            className={`mb-6 flex items-center justify-center gap-4 transition-all duration-1000 delay-200 ${mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}
          >
            <div className="h-px w-12 bg-gold" />
            <span className="text-shimmer text-sm font-medium uppercase tracking-[0.3em]">
              Kos Island, Greece
            </span>
            <div className="h-px w-12 bg-gold" />
          </div>

          <h1
            className={`font-serif text-4xl font-bold leading-tight text-white sm:text-5xl md:text-6xl lg:text-7xl transition-all duration-1000 delay-400 ${mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}
          >
            {t("title")}
          </h1>

          <p
            className={`mx-auto mt-6 max-w-xl text-lg text-white/90 sm:text-xl transition-all duration-1000 delay-500 ${mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}
          >
            {t("subtitle")}
          </p>

          <div
            className={`mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center transition-all duration-1000 delay-700 ${mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}
          >
            <Link href="/rooms">
              <Button size="lg" variant="primary" className="btn-glow">
                {t("cta")}
              </Button>
            </Link>
            <Link href="/booking">
              <Button
                size="lg"
                variant="outline"
                className="border-white text-white hover:bg-white hover:text-deep-blue btn-glow-gold"
              >
                {t("ctaBook")}
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
        <div className="flex h-10 w-6 items-start justify-center rounded-full border-2 border-white/50 p-1.5">
          <div className="h-2 w-1 rounded-full bg-white/70" />
        </div>
      </div>
    </section>
  );
}
