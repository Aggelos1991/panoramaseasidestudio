"use client";

import { useTranslations } from "next-intl";
import { Star } from "lucide-react";
import { HOTEL_INFO } from "@/lib/constants";
import { Reel, ReelGroup, ReelItem } from "@/components/motion/reel";

const reviews = [
  {
    name: "Arthur",
    country: "United Kingdom",
    score: 5,
    text: "Exceptional service, the bed was extremely comfy and the location is stunning — right on the beachfront. Chrissy the owner is wonderful and makes you feel so welcome.",
  },
  {
    name: "Albert",
    country: "Netherlands",
    score: 5,
    text: "Very convenient base for exploring Kos. The sea view from our terrace was spectacular, and the cleaning lady was really nice.",
  },
  {
    name: "Μαρία Κ.",
    country: "Greece",
    score: 5,
    text: "Υπέροχη τοποθεσία στο Μαστιχάρι, κυριολεκτικά πάνω στην παραλία. Τα στούντιο είναι καθαρά και η οικογένεια είναι πολύ φιλόξενη.",
  },
];

function Stars({ score }: { score: number }) {
  const filled = score;
  return (
    <span className="flex gap-0.5" aria-label={`${score} / 5`}>
      {Array.from({ length: 5 }, (_, index) => (
        <Star
          key={index}
          className={`h-3.5 w-3.5 ${index < filled ? "fill-[#8a6232] text-[#8a6232]" : "text-[#1c1916]/20"}`}
        />
      ))}
    </span>
  );
}

export function Testimonials() {
  const t = useTranslations("testimonials");

  return (
    <section className="bg-[#f3efe8] px-5 py-20 text-[#1c1916] sm:px-10 sm:py-28 lg:px-16">
      <Reel className="flex flex-wrap items-end justify-between gap-6">
        <h2 className="font-film text-4xl font-medium leading-none tracking-tight sm:text-5xl">
          {t("title")}
        </h2>
        <p className="text-sm leading-relaxed text-[#1c1916]/70">
          <span className="font-film text-3xl text-[#1c1916]">{HOTEL_INFO.rating.toFixed(1)}</span>
          <span className="ml-2">Booking.com · {HOTEL_INFO.reviewCount}</span>
        </p>
      </Reel>
      <ReelGroup className="mt-10 grid gap-4 lg:grid-cols-3">
        {reviews.map((review) => (
          <ReelItem key={review.name}>
          <figure className="glass-card h-full rounded-2xl p-6">
            <div className="flex items-center justify-between gap-3">
              <Stars score={review.score} />
              <span className="text-sm text-[#8a6232]">Booking.com</span>
            </div>
            <blockquote className="mt-4 text-base leading-relaxed">{review.text}</blockquote>
            <figcaption className="mt-6 text-sm text-[#1c1916]">
              {review.name}
              <span className="text-[#1c1916]/50"> · {review.country}</span>
            </figcaption>
          </figure>
          </ReelItem>
        ))}
      </ReelGroup>
    </section>
  );
}
