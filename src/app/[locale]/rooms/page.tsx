import { getTranslations } from "next-intl/server";
import { prisma } from "@/lib/prisma";
import { getLocalizedField } from "@/lib/utils";
import { PLACEHOLDER_IMAGES, FALLBACK_ROOMS } from "@/lib/constants";
import { RoomCard } from "@/components/rooms/room-card";

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
        <div className="mt-14 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {rooms.map((room) => (
            <RoomCard
              key={room.slug}
              slug={room.slug}
              name={getLocalizedField(room, "name", locale)}
              capacity={room.capacity}
              sizeSqm={room.sizeSqm}
              basePrice={room.basePrice}
              imageUrl={room.primaryImage}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
