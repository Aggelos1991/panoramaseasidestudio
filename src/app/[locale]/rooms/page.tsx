import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { prisma } from "@/lib/prisma";
import { getLocalizedField } from "@/lib/utils";
import { PLACEHOLDER_IMAGES, FALLBACK_ROOMS } from "@/lib/constants";
import { RoomCard } from "@/components/rooms/room-card";
import { BreadcrumbJsonLd } from "@/components/seo/json-ld";

const BASE_URL = "https://panoramaseasidekos.com";

function localeUrl(path: string, locale: string) {
  return locale === "en" ? `${BASE_URL}${path}` : `${BASE_URL}/${locale}${path}`;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations("rooms");

  const title = t("title");
  const description =
    "Browse our beachfront studios and apartments in Mastichari, Kos. From sea view studios to double rooms with balconies, find your perfect Greek island retreat.";

  return {
    title,
    description,
    alternates: {
      canonical: localeUrl("/rooms", locale),
      languages: {
        en: `${BASE_URL}/rooms`,
        el: `${BASE_URL}/el/rooms`,
        de: `${BASE_URL}/de/rooms`,
      },
    },
    openGraph: {
      title,
      description,
      url: localeUrl("/rooms", locale),
    },
  };
}

type RoomListItem = {
  slug: string;
  nameEn: string;
  nameEl: string;
  nameDe: string;
  capacity: number;
  sizeSqm: number;
  basePrice: number;
  primaryImage: string;
};

const PLACEHOLDER_ROOM_LIST: RoomListItem[] = FALLBACK_ROOMS.map((r) => ({
  slug: r.slug,
  nameEn: r.nameEn,
  nameEl: r.nameEl,
  nameDe: r.nameDe,
  capacity: r.capacity,
  sizeSqm: r.sizeSqm,
  basePrice: r.basePrice,
  primaryImage: r.primaryImage,
}));

async function getRooms(): Promise<RoomListItem[]> {
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
      PLACEHOLDER_IMAGES.rooms[
        room.slug as keyof typeof PLACEHOLDER_IMAGES.rooms
      ] ||
      PLACEHOLDER_IMAGES.gallery[0],
  }));
}

type Props = {
  params: Promise<{ locale: string }>;
};

export default async function RoomsPage({ params }: Props) {
  const { locale } = await params;
  const t = await getTranslations("rooms");

  let rooms: RoomListItem[];
  try {
    rooms = await getRooms();
  } catch {
    rooms = PLACEHOLDER_ROOM_LIST;
  }

  return (
    <>
    <BreadcrumbJsonLd
      items={[
        { name: "Home", url: localeUrl("/", locale) },
        { name: t("title"), url: localeUrl("/rooms", locale) },
      ]}
    />
    <section className="bg-cream py-20 sm:py-28">
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

        {/* Room Cards Grid */}
        <div className="mt-14 flex flex-wrap justify-center gap-4">
          {rooms.map((room) => (
            <div key={room.slug} className="w-full sm:w-[calc(50%-0.5rem)] lg:w-[calc(33.333%-0.75rem)]">
              <RoomCard
                slug={room.slug}
                name={getLocalizedField(room, "name", locale)}
                capacity={room.capacity}
                sizeSqm={room.sizeSqm}
                basePrice={room.basePrice}
                imageUrl={room.primaryImage}
              />
            </div>
          ))}
        </div>
      </div>
    </section>
    </>
  );
}
