"use client";

import { useTranslations } from "next-intl";
import Image from "next/image";
import { MapPin, Heart, Sparkles } from "lucide-react";
import { PLACEHOLDER_IMAGES } from "@/lib/constants";
import { useAnimateOnScroll } from "@/hooks/use-animate-on-scroll";

const features = [
  { key: "feature1", icon: MapPin },
  { key: "feature2", icon: Heart },
  { key: "feature3", icon: Sparkles },
] as const;

export function AboutPreview() {
  const t = useTranslations("about");
  const { ref, isVisible } = useAnimateOnScroll();

  return (
    <section className="bg-white py-20 sm:py-28">
      <div ref={ref} className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-20">
          {/* Image with 3D Globe accent */}
          <div
            className={`relative transition-all duration-1000 ${isVisible ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-10"}`}
          >
            <div className="relative aspect-[4/3] overflow-hidden rounded-2xl shadow-elegant">
              <Image
                src={PLACEHOLDER_IMAGES.about}
                alt="Panorama Seaside Studios Mastichari"
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 50vw"
              />
            </div>
            {/* Decorative element */}
            <div className="absolute -bottom-4 -right-4 -z-10 h-full w-full rounded-2xl border-2 border-gold/30" />
          </div>

          {/* Content */}
          <div
            className={`transition-all duration-1000 delay-300 ${isVisible ? "opacity-100 translate-x-0" : "opacity-0 translate-x-10"}`}
          >
            <div className="mb-2 flex items-center gap-3">
              <div className="h-px w-8 bg-gold" />
              <span className="text-sm font-medium uppercase tracking-wider text-terracotta">
                {t("subtitle")}
              </span>
            </div>
            <h2 className="font-serif text-3xl font-bold text-deep-blue sm:text-4xl">
              {t("title")}
            </h2>
            <p className="mt-6 text-lg leading-relaxed text-gray-600">
              {t("description")}
            </p>

            <div className="mt-10 space-y-6">
              {features.map(({ key, icon: Icon }, i) => (
                <div
                  key={key}
                  className={`flex gap-4 transition-all duration-700 ${
                    isVisible
                      ? "opacity-100 translate-y-0"
                      : "opacity-0 translate-y-4"
                  }`}
                  style={{ transitionDelay: isVisible ? `${600 + i * 150}ms` : "0ms" }}
                >
                  <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl glass-gold text-terracotta">
                    <Icon className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-deep-blue">
                      {t(`${key}Title`)}
                    </h3>
                    <p className="mt-1 text-sm text-gray-500">
                      {t(`${key}Desc`)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
