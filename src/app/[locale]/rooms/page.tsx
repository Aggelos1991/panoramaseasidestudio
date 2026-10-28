import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { listRooms } from "@/lib/store";
import { getLocalizedField } from "@/lib/utils";
import { PLACEHOLDER_IMAGES } from "@/lib/constants";
import { LISTING_ROOMS } from "@/lib/listing";
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
    "Explore beachfront studios and apartments at Panorama Seaside in Mastichari, Kos. Sea view rooms and doubles with a balcony.";

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

async function getRooms(): Promise<RoomListItem[]> {
  const rooms = await listRooms({ activeOnly: true });

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
    rooms = [];
  }
  if (rooms.length === 0) {
    rooms = LISTING_ROOMS.map((room) => ({
      slug: room.slug,
      nameEn: room.nameEn,
      nameEl: room.nameEl,
      nameDe: room.nameDe,
      capacity: room.capacity,
      sizeSqm: room.sizeSqm,
      basePrice: room.basePrice,
      primaryImage: room.image,
    }));
  }

  return (
    <>
    <BreadcrumbJsonLd
      items={[
        { name: "Home", url: localeUrl("/", locale) },
        { name: t("title"), url: localeUrl("/rooms", locale) },
      ]}
    />
    <section className="bg-[#f3efe8] px-5 py-28 text-[#1c1916] sm:px-10 lg:px-16">
      <div>
        <h1 className="font-film text-5xl font-medium leading-none sm:text-6xl">
          {t("title")}
        </h1>

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
