import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { HeroSection } from "@/components/home/hero-section";
import { AboutPreview } from "@/components/home/about-preview";
import { RoomsPreview } from "@/components/home/rooms-preview";
import { AmenitiesSection } from "@/components/home/amenities-section";
import { GalleryPreview } from "@/components/home/gallery-preview";
import { Testimonials } from "@/components/home/testimonials";
import { CTASection } from "@/components/home/cta-section";
import { FAQSection } from "@/components/home/faq-section";
import { BreadcrumbJsonLd, FAQPageJsonLd, ReviewsJsonLd } from "@/components/seo/json-ld";
import { prisma } from "@/lib/prisma";

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

// FAQ data for JSON-LD (must match translations)
const FAQ_DATA_EN = [
  { question: "How far is Panorama Seaside Studios from the beach?", answer: "We are literally steps from the beach! Panorama Seaside Studios sits right on the seafront in Mastichari, Kos. You can walk to the golden sandy beach in under a minute." },
  { question: "What are the check-in and check-out times?", answer: "Check-in is from 14:00 and check-out is by 12:00. Early check-in or late check-out may be available upon request, depending on availability." },
  { question: "Is there free parking at the hotel?", answer: "Yes, we offer free private parking for all guests. There is ample space right next to our studios in Mastichari." },
  { question: "How do I get from Kos Airport to Mastichari?", answer: "Kos Airport (KGS) is approximately 20 km from Mastichari. You can reach us by taxi (about 25 minutes), rental car, or public bus. We can help arrange airport transfers upon request." },
  { question: "Do the rooms have a kitchen or kitchenette?", answer: "Our studio apartments come equipped with a fully functional kitchenette including a fridge, electric hobs, kettle, and basic cooking utensils. Double rooms have a mini fridge." },
  { question: "Is there a restaurant on site?", answer: "Yes! Our beachfront restaurant and bar serves fresh Greek dishes, snacks, and drinks throughout the day. Enjoy your meal with stunning sea views right on Mastichari Beach." },
  { question: "What is there to do in Mastichari, Kos?", answer: "Mastichari is a charming fishing village with golden sandy beaches, waterfront tavernas, and a harbour with daily ferries to Kalymnos. Kos Island offers ancient ruins, cycling paths, Kos Town nightlife, and beautiful beaches like Paradise and Tigaki." },
  { question: "Is Panorama Seaside Studios family-friendly?", answer: "Absolutely! We are a family-run hotel and welcome families with children. We have a playground on site, spacious rooms, and the shallow sandy beach in Mastichari is perfect for kids." },
  { question: "Do you have rooms with sea view?", answer: "Yes, our Seafront Luxury Studios and Superior Double Rooms with Sea View offer stunning views of the Aegean Sea directly from your private balcony." },
  { question: "What is the cancellation policy?", answer: "Free cancellation is available up to 7 days before arrival. Cancellations within 7 days may be subject to a charge. Please contact us for specific details regarding your booking." },
];

// Review data for JSON-LD (matches testimonials component)
const REVIEW_DATA = [
  { author: "Arthur", country: "United Kingdom", rating: 5, text: "Exceptional service, the bed was extremely comfy and the location is stunning — right on the beachfront. Chrissy the owner is wonderful and makes you feel so welcome. Highly recommend!", datePublished: "2024-08-15" },
  { author: "Albert", country: "Netherlands", rating: 5, text: "Very convenient base for exploring Kos. The sea view from our terrace was spectacular, and the cleaning lady was really nice. Great value for the beachfront location!", datePublished: "2024-07-22" },
  { author: "Maria K.", country: "Greece", rating: 5, text: "Wonderful location in Mastichari, literally on the beach! The studios are clean and well-equipped. The family running it is very welcoming. We will definitely return!", datePublished: "2024-09-05" },
];

export default async function HomePage({ params }: PageProps) {
  const { locale } = await params;
  let rooms: RoomPreviewData[] = [];
  try {
    rooms = await getRooms();
  } catch {
    rooms = [];
  }

  return (
    <>
      <BreadcrumbJsonLd
        items={[{ name: "Home", url: localeUrl("/", locale) }]}
      />
      <FAQPageJsonLd faqs={FAQ_DATA_EN} />
      <ReviewsJsonLd reviews={REVIEW_DATA} />
      <HeroSection />
      <AboutPreview />
      <RoomsPreview rooms={rooms} />
      <AmenitiesSection />
      <GalleryPreview />
      <Testimonials />
      <FAQSection />
      <CTASection />
    </>
  );
}
