"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { PLACEHOLDER_IMAGES } from "@/lib/constants";
import { useAnimateOnScroll } from "@/hooks/use-animate-on-scroll";

export function GalleryPreview() {
  const t = useTranslations("gallery");
  const { ref, isVisible } = useAnimateOnScroll();

  const images = PLACEHOLDER_IMAGES.gallery.slice(0, 6);

  return (
    <section className="bg-white py-20 sm:py-28">
      <div ref={ref} className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
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

        <div className="mt-14 grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-4">
          {images.map((src, i) => (
            <div
              key={i}
              className={`group relative overflow-hidden rounded-xl card-hover aspect-[4/3] transition-all duration-700 ${
                isVisible
                  ? "opacity-100 scale-100"
                  : "opacity-0 scale-95"
              }`}
              style={{ transitionDelay: isVisible ? `${200 + i * 100}ms` : "0ms" }}
            >
              <Image
                src={src}
                alt={`Panorama Seaside gallery image ${i + 1}`}
                fill
                quality={85}
                className="object-cover transition-transform duration-500 group-hover:scale-110"
                sizes="(max-width: 768px) 50vw, 33vw"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent opacity-0 transition-all duration-300 group-hover:opacity-100" />
            </div>
          ))}
        </div>

        <div
          className={`mt-10 text-center transition-all duration-700 delay-700 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}
        >
          <Link href="/gallery">
            <Button variant="outline" size="lg" className="btn-glow">
              {t("title")}
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}
