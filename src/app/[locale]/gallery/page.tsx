import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { GalleryGrid } from "@/components/gallery/gallery-grid";

const BASE_URL = "https://panoramaseasidekos.com";

type PageProps = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations("gallery");

  const title = t("title");
  const description = t("subtitle").slice(0, 160);
  const url = locale === "en" ? `${BASE_URL}/gallery` : `${BASE_URL}/${locale}/gallery`;

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
    openGraph: { title, description, url },
  };
}

export default async function GalleryPage() {
  const t = await getTranslations("gallery");

  return (
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
  );
}
