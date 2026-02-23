import { getTranslations } from "next-intl/server";
import Image from "next/image";
import { PLACEHOLDER_IMAGES } from "@/lib/constants";

export async function generateMetadata() {
  const t = await getTranslations("about");
  return {
    title: t("pageTitle"),
    description: t("story"),
  };
}

export default async function AboutPage() {
  const t = await getTranslations("about");

  return (
    <div className="min-h-screen">
      {/* Hero Banner */}
      <section className="relative h-[50vh] min-h-[400px]">
        <Image
          src={PLACEHOLDER_IMAGES.about}
          alt="Panorama Seaside Studios Mastichari"
          fill
          className="object-cover"
          sizes="100vw"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-b from-deep-blue/60 via-deep-blue/40 to-deep-blue/70" />
        <div className="absolute inset-0 flex flex-col items-center justify-center px-4 text-center">
          <div className="mb-4 flex items-center gap-3">
            <div className="h-px w-12 bg-gold" />
            <span className="text-sm font-medium uppercase tracking-widest text-gold">
              {t("subtitle")}
            </span>
            <div className="h-px w-12 bg-gold" />
          </div>
          <h1 className="font-serif text-4xl font-bold text-white sm:text-5xl lg:text-6xl">
            {t("pageTitle")}
          </h1>
          <p className="mt-4 max-w-2xl text-lg text-white/80">
            {t("pageSubtitle")}
          </p>
        </div>
      </section>

      {/* Our Story Section */}
      <section className="bg-white py-20 sm:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-20">
            {/* Image */}
            <div className="relative">
              <div className="relative aspect-[4/3] overflow-hidden rounded-2xl shadow-elegant">
                <Image
                  src="https://panoramastudiosmastichari.hotelskosisland.com/data/Photos/OriginalPhoto/16795/1679569/1679569159.JPEG"
                  alt="Panorama Seaside Studios exterior"
                  fill
                  className="object-cover"
                  sizes="(max-width: 1024px) 100vw, 50vw"
                />
              </div>
              <div className="absolute -bottom-4 -right-4 -z-10 h-full w-full rounded-2xl border-2 border-gold/30" />
            </div>

            {/* Content */}
            <div>
              <div className="mb-2 flex items-center gap-3">
                <div className="h-px w-8 bg-gold" />
                <span className="text-sm font-medium uppercase tracking-wider text-terracotta">
                  {t("subtitle")}
                </span>
              </div>
              <h2 className="font-serif text-3xl font-bold text-deep-blue sm:text-4xl">
                {t("feature1Title")}
              </h2>
              <p className="mt-6 text-lg leading-relaxed text-gray-600">
                {t("story")}
              </p>
              <div className="mt-8 flex items-center gap-4">
                <div className="h-16 w-1 rounded-full bg-gradient-to-b from-terracotta to-gold" />
                <p className="text-sm italic text-gray-500">
                  {t("description")}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Our Philosophy Section */}
      <section className="bg-sandy-light py-20 sm:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-20">
            {/* Content - on left for alternating layout */}
            <div className="order-2 lg:order-1">
              <div className="mb-2 flex items-center gap-3">
                <div className="h-px w-8 bg-gold" />
                <span className="text-sm font-medium uppercase tracking-wider text-terracotta">
                  {t("feature2Title")}
                </span>
              </div>
              <h2 className="font-serif text-3xl font-bold text-deep-blue sm:text-4xl">
                {t("feature2Title")}
              </h2>
              <p className="mt-6 text-lg leading-relaxed text-gray-600">
                {t("philosophy")}
              </p>

              {/* Feature highlights */}
              <div className="mt-10 grid grid-cols-2 gap-6">
                <div className="rounded-xl bg-white p-5 shadow-soft">
                  <div className="text-3xl font-bold text-terracotta">20+</div>
                  <div className="mt-1 text-sm text-gray-500">
                    Years of Hospitality
                  </div>
                </div>
                <div className="rounded-xl bg-white p-5 shadow-soft">
                  <div className="text-3xl font-bold text-terracotta">
                    1000+
                  </div>
                  <div className="mt-1 text-sm text-gray-500">
                    Happy Guests
                  </div>
                </div>
              </div>
            </div>

            {/* Image */}
            <div className="relative order-1 lg:order-2">
              <div className="relative aspect-[4/3] overflow-hidden rounded-2xl shadow-elegant">
                <Image
                  src="https://panoramastudiosmastichari.hotelskosisland.com/data/Photos/OriginalPhoto/17227/1722776/1722776632.JPEG"
                  alt="Authentic Greek hospitality"
                  fill
                  className="object-cover"
                  sizes="(max-width: 1024px) 100vw, 50vw"
                />
              </div>
              <div className="absolute -bottom-4 -left-4 -z-10 h-full w-full rounded-2xl border-2 border-gold/30" />
            </div>
          </div>
        </div>
      </section>

      {/* Discover Kos Section */}
      <section className="bg-white py-20 sm:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="mb-2 flex items-center justify-center gap-3">
              <div className="h-px w-8 bg-gold" />
              <span className="text-sm font-medium uppercase tracking-wider text-terracotta">
                {t("feature3Title")}
              </span>
              <div className="h-px w-8 bg-gold" />
            </div>
            <h2 className="font-serif text-3xl font-bold text-deep-blue sm:text-4xl">
              {t("kosTitle")}
            </h2>
            <p className="mx-auto mt-6 max-w-3xl text-lg leading-relaxed text-gray-600">
              {t("kosDesc")}
            </p>
          </div>

          {/* Image grid showcasing Kos */}
          <div className="mt-14 grid grid-cols-2 gap-4 md:grid-cols-4">
            <div className="relative col-span-2 row-span-2 aspect-square overflow-hidden rounded-2xl shadow-elegant md:aspect-auto">
              <Image
                src={PLACEHOLDER_IMAGES.gallery[3]}
                alt="Beautiful beaches of Kos"
                fill
                className="object-cover transition-transform duration-500 hover:scale-105"
                sizes="(max-width: 768px) 100vw, 50vw"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-deep-blue/40 to-transparent" />
            </div>
            <div className="relative aspect-square overflow-hidden rounded-2xl shadow-soft">
              <Image
                src={PLACEHOLDER_IMAGES.gallery[0]}
                alt="Kos Island views"
                fill
                className="object-cover transition-transform duration-500 hover:scale-105"
                sizes="(max-width: 768px) 50vw, 25vw"
              />
            </div>
            <div className="relative aspect-square overflow-hidden rounded-2xl shadow-soft">
              <Image
                src={PLACEHOLDER_IMAGES.gallery[7]}
                alt="Kos sunset"
                fill
                className="object-cover transition-transform duration-500 hover:scale-105"
                sizes="(max-width: 768px) 50vw, 25vw"
              />
            </div>
            <div className="relative aspect-square overflow-hidden rounded-2xl shadow-soft">
              <Image
                src={PLACEHOLDER_IMAGES.gallery[4]}
                alt="Local dining in Kos"
                fill
                className="object-cover transition-transform duration-500 hover:scale-105"
                sizes="(max-width: 768px) 50vw, 25vw"
              />
            </div>
            <div className="relative aspect-square overflow-hidden rounded-2xl shadow-soft">
              <Image
                src={PLACEHOLDER_IMAGES.gallery[2]}
                alt="Kos Island pool and relaxation"
                fill
                className="object-cover transition-transform duration-500 hover:scale-105"
                sizes="(max-width: 768px) 50vw, 25vw"
              />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
