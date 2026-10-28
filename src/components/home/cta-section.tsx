"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import Image from "next/image";
import BlurText from "@/components/react-bits/BlurText";

export function CTASection() {
  const t = useTranslations("cta");

  return (
    <section className="relative min-h-[70vh] bg-[#1f4f48]">
      <Image
        src="https://panoramastudiosmastichari.hotelskosisland.com/data/Photos/OriginalPhoto/16795/1679569/1679569240.JPEG"
        alt="The beach at Panorama Seaside, Mastichari"
        fill
        className="object-cover"
        sizes="100vw"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-[#1f4f48] via-[#1f4f48]/45 to-[#1f4f48]/20" />
      <div className="relative flex min-h-[70vh] flex-col justify-end px-5 py-16 sm:px-10 lg:px-16">
        <BlurText
          text={t("title")}
          animateBy="words"
          trigger="load"
          className="font-film max-w-3xl text-5xl font-medium leading-[0.95] text-[#e8e2d6] sm:text-7xl"
        />
        <p className="mt-6 max-w-md text-lg text-[#e8e2d6]/85">{t("subtitle")}</p>
        <Link
          href="/booking"
          className="mt-8 inline-flex w-fit bg-[#e8e2d6] px-5 py-3 text-sm text-[#1f4f48]"
        >
          {t("button")}
        </Link>
      </div>
    </section>
  );
}
