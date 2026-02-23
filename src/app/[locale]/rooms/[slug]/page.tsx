import { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { prisma } from "@/lib/prisma";
import { getLocalizedField } from "@/lib/utils";
import { FALLBACK_ROOMS, AMENITY_LABELS, AMENITY_ICONS, HOTEL_IMAGES } from "@/lib/constants";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { RoomGallery } from "@/components/rooms/room-gallery";
import { Users, Maximize, BedDouble, ArrowRight } from "lucide-react";
import * as LucideIcons from "lucide-react";

// ─── Build fallback detail data from FALLBACK_ROOMS ─────────

type RoomDetail = {
  slug: string;
  nameEn: string;
  nameEl: string;
  nameDe: string;
  descEn: string;
  descEl: string;
  descDe: string;
  capacity: number;
  bedType: string;
  sizeSqm: number;
  basePrice: number;
  amenities: string[];
  images: { url: string; alt?: string }[];
};

function getFallbackRoom(slug: string): RoomDetail | null {
  const room = FALLBACK_ROOMS.find((r) => r.slug === slug);
  if (!room) return null;

  return {
    slug: room.slug,
    nameEn: room.nameEn,
    nameEl: room.nameEl,
    nameDe: room.nameDe,
    descEn: getDefaultDesc(room.nameEn),
    descEl: getDefaultDesc(room.nameEl),
    descDe: getDefaultDesc(room.nameDe),
    capacity: room.capacity,
    bedType: room.bedType,
    sizeSqm: room.sizeSqm,
    basePrice: room.basePrice,
    amenities: room.amenities,
    images: [
      { url: room.primaryImage, alt: room.nameEn },
      ...Object.values(HOTEL_IMAGES.gallery)
        .filter((url) => url !== room.primaryImage)
        .slice(0, 2)
        .map((url) => ({ url, alt: `${room.nameEn} - view` })),
    ],
  };
}

function getDefaultDesc(name: string): string {
  return `Welcome to the ${name} at Panorama Seaside Studios. Enjoy your stay in our comfortable accommodation, just steps from Mastichari Beach on Kos Island. Each room features modern amenities and a private balcony for a relaxing Greek island holiday.`;
}

// ─── Data fetching ──────────────────────────────────────────

async function getRoom(slug: string) {
  const room = await prisma.room.findUnique({
    where: { slug, isActive: true },
    include: {
      images: {
        orderBy: [{ isPrimary: "desc" }, { sortOrder: "asc" }],
      },
    },
  });

  if (!room) return null;

  return {
    slug: room.slug,
    nameEn: room.nameEn,
    nameEl: room.nameEl,
    nameDe: room.nameDe,
    descEn: room.descEn,
    descEl: room.descEl,
    descDe: room.descDe,
    capacity: room.capacity,
    bedType: room.bedType,
    sizeSqm: room.sizeSqm,
    basePrice: Number(room.basePrice),
    amenities: room.amenities,
    images: room.images.map((img) => ({ url: img.url, alt: img.alt ?? undefined })),
  };
}

// ─── Dynamic amenity icon resolver ──────────────────────────

function AmenityIcon({ iconName, className }: { iconName: string; className?: string }) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const IconComponent = (LucideIcons as any)[iconName];
  if (!IconComponent) return null;
  return <IconComponent className={className} />;
}

// ─── Metadata ───────────────────────────────────────────────

type PageProps = {
  params: Promise<{ locale: string; slug: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale, slug } = await params;

  let room: RoomDetail | null = null;
  try {
    room = await getRoom(slug);
  } catch {
    room = getFallbackRoom(slug);
  }

  if (!room) {
    return { title: "Room Not Found" };
  }

  const name = getLocalizedField(room, "name", locale);
  const description = getLocalizedField(room, "desc", locale);

  return {
    title: `${name} — Panorama Seaside Studios`,
    description: description.slice(0, 160),
  };
}

// ─── Page component ─────────────────────────────────────────

export default async function RoomDetailPage({ params }: PageProps) {
  const { locale, slug } = await params;
  const t = await getTranslations("rooms");

  let room: RoomDetail | null = null;
  try {
    room = await getRoom(slug);
  } catch {
    room = getFallbackRoom(slug);
  }

  // If DB returned nothing, also try fallback
  if (!room) {
    room = getFallbackRoom(slug);
  }

  if (!room) {
    notFound();
  }

  const name = getLocalizedField(room, "name", locale);
  const description = getLocalizedField(room, "desc", locale);

  return (
    <section className="bg-cream py-16 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Image Gallery */}
        <RoomGallery images={room.images} />

        {/* Room Content */}
        <div className="mt-10 grid gap-10 lg:grid-cols-3">
          {/* Left column: Info */}
          <div className="lg:col-span-2 space-y-8">
            {/* Title & Key Facts */}
            <div>
              <h1 className="font-serif text-3xl font-bold text-deep-blue sm:text-4xl">
                {name}
              </h1>
              <div className="mt-4 flex flex-wrap items-center gap-5 text-sm text-gray-600">
                <span className="flex items-center gap-1.5">
                  <Users className="h-4 w-4 text-terracotta" />
                  {t("maxGuests")}: {room.capacity}
                </span>
                <span className="flex items-center gap-1.5">
                  <Maximize className="h-4 w-4 text-terracotta" />
                  {t("roomSize")}: {t("size", { size: room.sizeSqm })}
                </span>
                <span className="flex items-center gap-1.5">
                  <BedDouble className="h-4 w-4 text-terracotta" />
                  {t("bedType")}: {room.bedType}
                </span>
              </div>
            </div>

            {/* Description */}
            <div>
              <h2 className="font-serif text-xl font-semibold text-deep-blue">
                {t("description")}
              </h2>
              <p className="mt-3 leading-relaxed text-gray-700">{description}</p>
            </div>

            {/* Amenities */}
            <div>
              <h2 className="font-serif text-xl font-semibold text-deep-blue">
                {t("amenities")}
              </h2>
              <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
                {room.amenities.map((amenity) => {
                  const iconName = AMENITY_ICONS[amenity];
                  const label =
                    AMENITY_LABELS[amenity]?.[locale] ||
                    AMENITY_LABELS[amenity]?.en ||
                    amenity;

                  return (
                    <div
                      key={amenity}
                      className="flex items-center gap-3 rounded-xl bg-white px-4 py-3 shadow-soft"
                    >
                      {iconName && (
                        <AmenityIcon
                          iconName={iconName}
                          className="h-5 w-5 flex-shrink-0 text-terracotta"
                        />
                      )}
                      <span className="text-sm text-gray-700">{label}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right column: Price & Booking CTA */}
          <div>
            <div className="lg:sticky lg:top-28 rounded-2xl bg-white p-6 shadow-elegant">
              <div className="text-center">
                <span className="text-sm font-medium uppercase tracking-wider text-terracotta">
                  {t("from")}
                </span>
                <div className="mt-1 font-serif text-4xl font-bold text-deep-blue">
                  &euro;{room.basePrice}
                </div>
                <span className="text-sm text-gray-500">{t("perNight")}</span>
              </div>

              <div className="mt-6">
                <Link href={`/booking?room=${room.slug}`}>
                  <Button variant="primary" size="lg" className="w-full">
                    {t("bookThisRoom")}
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
              </div>

              {/* Quick facts in sidebar */}
              <div className="mt-6 space-y-3 border-t border-gray-100 pt-6 text-sm text-gray-600">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Users className="h-4 w-4 text-terracotta" />
                    {t("maxGuests")}
                  </span>
                  <span className="font-medium text-deep-blue">
                    {t("capacity", { count: room.capacity })}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Maximize className="h-4 w-4 text-terracotta" />
                    {t("roomSize")}
                  </span>
                  <span className="font-medium text-deep-blue">
                    {t("size", { size: room.sizeSqm })}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <BedDouble className="h-4 w-4 text-terracotta" />
                    {t("bedType")}
                  </span>
                  <span className="font-medium text-deep-blue">{room.bedType}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
