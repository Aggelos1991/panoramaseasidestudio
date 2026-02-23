import { HeroSection } from "@/components/home/hero-section";
import { AboutPreview } from "@/components/home/about-preview";
import { RoomsPreview } from "@/components/home/rooms-preview";
import { AmenitiesSection } from "@/components/home/amenities-section";
import { GalleryPreview } from "@/components/home/gallery-preview";
import { Testimonials } from "@/components/home/testimonials";
import { CTASection } from "@/components/home/cta-section";
import { prisma } from "@/lib/prisma";
import { FALLBACK_ROOMS } from "@/lib/constants";

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

export default async function HomePage() {
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
