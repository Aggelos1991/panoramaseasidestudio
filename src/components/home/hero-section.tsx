"use client";

import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import Image from "next/image";
import { PLACEHOLDER_IMAGES } from "@/lib/constants";
import { FormEvent, useEffect, useRef, useState } from "react";
import { addDays, format } from "date-fns";
import { motion, useReducedMotion, useScroll, useTransform } from "motion/react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { cinematic } from "@/components/motion/reel";

export function HeroSection() {
  const t = useTranslations("hero");
  const bookingT = useTranslations("booking");
  const locale = useLocale();
  const router = useRouter();
  const [videoFailed, setVideoFailed] = useState(false);
  const [reduceMotion, setReduceMotion] = useState(false);
  const [tomorrow, setTomorrow] = useState("");
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [guests, setGuests] = useState(2);
  const reduce = useReducedMotion();
  const frame = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: frame,
    offset: ["start start", "end start"],
  });
  const pictureY = useTransform(scrollYProgress, [0, 1], ["0%", "18%"]);
  const pictureScale = useTransform(scrollYProgress, [0, 1], [1, 1.12]);

  useEffect(() => {
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduceMotion(motion.matches);
    setTomorrow(format(addDays(new Date(), 1), "yyyy-MM-dd"));
  }, []);

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const arrive = String(data.get("checkIn") || checkIn);
    const leave = String(data.get("checkOut") || checkOut);
    const guestCount = String(data.get("guests") || guests);
    if (!arrive || !leave || leave <= arrive) return;
    router.push(`/booking?checkIn=${arrive}&checkOut=${leave}&guests=${guestCount}`);
  }

  const showStill = videoFailed || reduceMotion;

  return (
    <section ref={frame} className="relative flex min-h-[100svh] flex-col overflow-hidden bg-[#1c1916] text-[#f3efe8]">
      <motion.div
        className="absolute inset-0"
        style={reduce ? undefined : { y: pictureY, scale: pictureScale }}
      >
        {showStill ? (
          <Image
            src={PLACEHOLDER_IMAGES.hero[0]}
            alt="The Aegean from a balcony at Panorama Seaside Studios, Mastichari"
            fill
            priority
            className="object-cover"
            sizes="100vw"
          />
        ) : (
          <video
            src="/videos/hero-landing.mp4"
            poster="/images/hero/hero-poster.jpg"
            autoPlay
            muted
            loop
            playsInline
            preload="metadata"
            aria-hidden="true"
            onError={() => setVideoFailed(true)}
            className="h-full w-full object-cover"
          />
        )}
      </motion.div>
      <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-black/10 to-black/30" />

      <div className="relative z-10 flex flex-1 flex-col justify-end px-5 pb-32 pt-28 sm:px-10 sm:pb-36 lg:px-16">
        <p className="font-sans text-[0.72rem] font-medium uppercase tracking-[0.22em] text-[#f3efe8]">
          {t("title")}
        </p>
        <motion.div
          initial={reduce ? false : { y: 28 }}
          animate={{ y: 0 }}
          transition={{ duration: 1.05, delay: 0.08, ease: cinematic }}
        >
        <h1 className="font-film mt-4 max-w-3xl text-[clamp(2.6rem,6vw,5.6rem)] font-medium leading-[0.96] tracking-[-0.03em]">
          {t("filmTitle")}
        </h1>
        <p className="mt-4 max-w-sm font-sans text-base font-medium leading-snug text-[#f3efe8]">
          {t("filmPlace")}
        </p>
        </motion.div>

        <form
          action={locale === "en" ? "/booking" : `/${locale}/booking`}
          method="get"
          onSubmit={onSubmit}
          className="mt-8"
        >
          <motion.div
            initial={reduce ? false : { y: 28 }}
            animate={{ y: 0 }}
            transition={{ duration: 0.9, delay: 0.45, ease: cinematic }}
          >
          <Card className="glass-card mx-auto w-full max-w-md border-white/50 bg-transparent text-[#1c1916] shadow-none">
            <CardContent className="grid grid-cols-2 items-end gap-x-3 gap-y-4 p-5">
              <label className="block text-left font-sans text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-[#1c1916]">
                {t("arrive")}
                <Input
                  type="date"
                  name="checkIn"
                  required
                  min={tomorrow || undefined}
                  value={checkIn}
                  onChange={(event) => {
                    setCheckIn(event.target.value);
                    if (checkOut && event.target.value >= checkOut) setCheckOut("");
                  }}
                  className="mt-2 h-10 border-black/15 bg-white/80 px-3 text-left font-sans text-[0.95rem] font-medium text-[#1c1916]"
                />
              </label>
              <label className="block text-left font-sans text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-[#1c1916]">
                {t("leave")}
                <Input
                  type="date"
                  name="checkOut"
                  required
                  min={checkIn || tomorrow || undefined}
                  value={checkOut}
                  onChange={(event) => setCheckOut(event.target.value)}
                  className="mt-2 h-10 border-black/15 bg-white/80 px-3 text-left font-sans text-[0.95rem] font-medium text-[#1c1916]"
                />
              </label>
              <label className="col-span-2 block text-left font-sans text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-[#1c1916]">
                {bookingT("guests")}
                <select
                  name="guests"
                  value={guests}
                  onChange={(event) => setGuests(Number(event.target.value))}
                  className="mt-2 h-10 w-full rounded-md border border-black/15 bg-white/80 px-3 font-sans text-[0.95rem] font-medium text-[#1c1916] outline-none"
                >
                  {[1, 2, 3, 4, 5, 6].map((count) => (
                    <option key={count} value={count} className="text-black">
                      {count}
                    </option>
                  ))}
                </select>
              </label>
              <button
                type="submit"
                className="col-span-2 h-11 bg-[#1c1916] font-sans text-sm font-semibold tracking-wide text-[#f3efe8]"
              >
                {t("checkDates")}
              </button>
            </CardContent>
          </Card>
          </motion.div>
        </form>
      </div>
    </section>
  );
}
