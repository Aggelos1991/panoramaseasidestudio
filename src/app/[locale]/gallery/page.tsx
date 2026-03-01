import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { GalleryGrid } from "@/components/gallery/gallery-grid";
import { BreadcrumbJsonLd } from "@/components/seo/json-ld";

const BASE_URL = "https://panoramaseasidekos.com";

function localeUrl(path: string, locale: string) {
  return locale === "en" ? `${BASE_URL}${path}` : `${BASE_URL}/${locale}${path}`;
}

type PageProps = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations("gallery");

  const title = t("title");
  const description =
    "Browse photos of Panorama Seaside Studios in Mastichari, Kos — beachfront rooms, sea views, restaurant, and the golden sandy beach of Mastichari.";
  const url = localeUrl("/gallery", locale);

  return {
    title,
    description,
    alternates: {
      canonical: url,
      languages: {
        en: `${BASE_URL}/gallery`,
        el: `${BASE_URL}/el/gallery`,
        de: `${BASE_URL}/de/gallery`,
      },
    },
    openGraph: { title: `${title} — Panorama Seaside Studios`, description, url },
  };
}

export default async function GalleryPage({ params }: PageProps) {
  const { locale } = await params;
  const t = await getTranslations("gallery");

  return (
    <>
    <BreadcrumbJsonLd
      items={[
        { name: "Home", url: localeUrl("/", locale) },
        { name: t("title"), url: localeUrl("/gallery", locale) },
      ]}
    />
    <section className="min-h-screen bg-cream pt-24 pb-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center">
          <div className="mb-2 flex items-center justify-center gap-3">
            <div className="h-px w-8 bg-gold" />
            <span className="text-sm font-medium uppercase tracking-wider text-terracotta">
              {t("subtitle")}
            </span>
            <div className="h-px w-8 bg-gold" />
          </div>
          <h1 className="font-serif text-4xl font-bold text-deep-blue sm:text-5xl">
            {t("title")}
          </h1>
        </div>

        {/* Gallery Grid */}
        <div className="mt-12">
          <GalleryGrid />
        </div>
      </div>
    </section>
    </>
  );
}
