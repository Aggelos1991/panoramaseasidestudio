"use client";

import { useTranslations } from "next-intl";
import { Star, Quote } from "lucide-react";
import { useAnimateOnScroll } from "@/hooks/use-animate-on-scroll";

const reviews = [
  {
    name: "Arthur",
    country: "United Kingdom",
    text: "Exceptional service, the bed was extremely comfy and the location is stunning — right on the beachfront. Chrissy the owner is wonderful and makes you feel so welcome. Highly recommend!",
    rating: 5,
  },
  {
    name: "Albert",
    country: "Netherlands",
    text: "Very convenient base for exploring Kos. The sea view from our terrace was spectacular, and the cleaning lady was really nice. Great value for the beachfront location!",
    rating: 5,
  },
  {
    name: "Μαρία Κ.",
    country: "Greece",
    text: "Υπέροχη τοποθεσία στο Μαστιχάρι, κυριολεκτικά πάνω στην παραλία! Τα στούντιο είναι καθαρά και καλά εξοπλισμένα. Η οικογένεια που το διαχειρίζεται είναι πολύ φιλόξενη. Θα ξαναέρθουμε σίγουρα!",
    rating: 5,
  },
];

export function Testimonials() {
  const t = useTranslations("testimonials");
  const { ref, isVisible } = useAnimateOnScroll();

  return (
    <section className="bg-sandy-light py-20 sm:py-28">
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

        <div className="mt-14 grid gap-8 md:grid-cols-3">
          {reviews.map((review, i) => (
            <div
              key={i}
              className={`relative overflow-hidden rounded-2xl glass-gold p-8 card-hover transition-all duration-700 ${
                isVisible
                  ? "opacity-100 translate-y-0"
                  : "opacity-0 translate-y-8"
              }`}
              style={{ transitionDelay: isVisible ? `${300 + i * 150}ms` : "0ms" }}
            >
              <Quote className="absolute right-6 top-6 h-10 w-10 text-gold/30" />
              <div className="flex gap-1">
                {Array.from({ length: review.rating }).map((_, j) => (
                  <Star
                    key={j}
                    className="h-4 w-4 fill-gold text-gold"
                  />
                ))}
              </div>
              <p className="mt-4 text-sm leading-relaxed text-gray-600 italic">
                &ldquo;{review.text}&rdquo;
              </p>
              <div className="mt-6 border-t border-gold/20 pt-4">
                <p className="font-semibold text-deep-blue">{review.name}</p>
                <p className="text-xs text-gray-400">{review.country}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
