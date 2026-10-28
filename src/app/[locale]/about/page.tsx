import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Testimonials } from "@/components/home/testimonials";

const BASE_URL = "https://panoramaseasidekos.com";

function localeUrl(path: string, locale: string) {
  return locale === "en" ? `${BASE_URL}${path}` : `${BASE_URL}/${locale}${path}`;
}

type PageProps = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations("testimonials");

  return {
    title: t("title"),
    description: "Guest reviews of Panorama Seaside Studios in Mastichari, Kos. Rated 9.0 on Booking.com from 232 reviews.",
    alternates: {
      canonical: localeUrl("/about", locale),
      languages: {
        en: `${BASE_URL}/about`,
        el: `${BASE_URL}/el/about`,
        de: `${BASE_URL}/de/about`,
      },
    },
  };
}

export default function AboutPage() {
  return (
    <div className="pt-20">
      <Testimonials />
    </div>
  );
}
