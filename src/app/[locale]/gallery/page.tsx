import { getTranslations } from "next-intl/server";
import { GalleryGrid } from "@/components/gallery/gallery-grid";

export async function generateMetadata() {
  const t = await getTranslations("gallery");
  return {
    title: t("title"),
    description: t("subtitle"),
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
