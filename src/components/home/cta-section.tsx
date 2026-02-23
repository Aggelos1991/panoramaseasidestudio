"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { useAnimateOnScroll } from "@/hooks/use-animate-on-scroll";

export function CTASection() {
  const t = useTranslations("cta");
  const { ref, isVisible } = useAnimateOnScroll();

  return (
    <section className="relative py-28">
      <div className="absolute inset-0">
        <Image
          src="https://panoramastudiosmastichari.hotelskosisland.com/data/Photos/OriginalPhoto/16795/1679569/1679569240.JPEG"
          alt="Kos Island beach sunset"
          fill
          className="object-cover"
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-deep-blue/90 to-deep-blue/70" />
      </div>

      <div ref={ref} className="relative mx-auto max-w-3xl px-4 text-center sm:px-6">
        <h2
          className={`font-serif text-3xl font-bold text-white sm:text-4xl md:text-5xl transition-all duration-700 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}
        >
          {t("title")}
        </h2>
        <p
          className={`mx-auto mt-6 max-w-xl text-lg text-white/90 transition-all duration-700 delay-200 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}
        >
          {t("subtitle")}
        </p>
        <div
          className={`mt-10 transition-all duration-700 delay-400 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}
        >
          <Link href="/booking">
            <Button size="lg" className="bg-gold text-deep-blue hover:bg-gold-light btn-glow-gold">
              {t("button")}
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}
