import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { HeroSection } from "@/components/home/hero-section";
import { AboutPreview } from "@/components/home/about-preview";
import { RoomsPreview } from "@/components/home/rooms-preview";
import { AmenitiesSection } from "@/components/home/amenities-section";
import { GalleryPreview } from "@/components/home/gallery-preview";
import { Testimonials } from "@/components/home/testimonials";
import { CTASection } from "@/components/home/cta-section";
import { BreadcrumbJsonLd } from "@/components/seo/json-ld";
import { prisma } from "@/lib/prisma";
import { FALLBACK_ROOMS } from "@/lib/constants";

const BASE_URL = "https://panoramaseasidekos.com";

function localeUrl(path: string, locale: string) {
  return locale === "en" ? `${BASE_URL}${path}` : `${BASE_URL}/${locale}${path}`;
}

type PageProps = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations("hero");

  const title = t("title");
  const description =
    "Beachfront studios & apartments in Mastichari, Kos Island. Family-run accommodation steps from the beach with sea views, restaurant, and authentic Greek hospitality.";

  return {
    title: {
      absolute: "Panorama Seaside Studios — Beachfront Accommodation in Mastichari, Kos",
    },
    description,
    alternates: {
      canonical: localeUrl("/", locale),
      languages: {
        en: `${BASE_URL}/`,
        el: `${BASE_URL}/el`,
        de: `${BASE_URL}/de`,
      },
    },
    openGraph: {
      title,
      description,
      url: localeUrl("/", locale),
    },
  };
}

type RoomPreviewData = {
  slug: string;
  nameEn: string;
  nameEl: string;
  nameDe: string;
  capacity: number;
  sizeSqm: number;
  basePrice: number;
  primaryImage: string;
};

async function getRooms(): Promise<RoomPreviewData[]> {
  const rooms = await prisma.room.findMany({
    where: { isActive: true },
    include: {
      images: {
        where: { isPrimary: true },
        take: 1,
      },
    },
    orderBy: { sortOrder: "asc" },
  });

  return rooms.map((room) => ({
    slug: room.slug,
    nameEn: room.nameEn,
    nameEl: room.nameEl,
    nameDe: room.nameDe,
    capacity: room.capacity,
    sizeSqm: room.sizeSqm,
    basePrice: Number(room.basePrice),
    primaryImage:
      room.images[0]?.url ||
      "https://panoramastudiosmastichari.hotelskosisland.com/data/Photos/OriginalPhoto/16795/1679569/1679569240.JPEG",
  }));
}

export default async function HomePage({ params }: PageProps) {
  const { locale } = await params;
  let rooms: RoomPreviewData[] = [];
  try {
    rooms = await getRooms();
  } catch {
    // DB not connected — use real hotel data as fallback
    rooms = FALLBACK_ROOMS.map((r) => ({
      slug: r.slug,
      nameEn: r.nameEn,
      nameEl: r.nameEl,
      nameDe: r.nameDe,
      capacity: r.capacity,
      sizeSqm: r.sizeSqm,
      basePrice: r.basePrice,
      primaryImage: r.primaryImage,
    }));
  }

  return (
    <>
      <BreadcrumbJsonLd
        items={[{ name: "Home", url: localeUrl("/", locale) }]}
      />
      <HeroSection />
      <AboutPreview />
      <RoomsPreview rooms={rooms} />
      <AmenitiesSection />
      <GalleryPreview />
      <Testimonials />
      <CTASection />
    </>
  );
}
