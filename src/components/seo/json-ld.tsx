import { HOTEL_INFO } from "@/lib/constants";

const BASE_URL = "https://panoramaseasidekos.com";

type JsonLdProps = {
  data: Record<string, unknown>;
};

function JsonLd({ data }: JsonLdProps) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

export function HotelJsonLd() {
  return (
    <JsonLd
      data={{
        "@context": "https://schema.org",
        "@type": "Hotel",
        name: HOTEL_INFO.nameFull,
        description:
          "Beachfront studios & apartments in Mastichari, Kos Island. Family-run accommodation steps from the beach with sea views, restaurant, and authentic Greek hospitality.",
        url: BASE_URL,
        telephone: HOTEL_INFO.phone,
        email: HOTEL_INFO.email,
        address: {
          "@type": "PostalAddress",
          streetAddress: "Main Street",
          addressLocality: "Mastichari",
          addressRegion: "Kos",
          postalCode: "85-302",
          addressCountry: "GR",
        },
        geo: {
          "@type": "GeoCoordinates",
          latitude: HOTEL_INFO.coordinates.lat,
          longitude: HOTEL_INFO.coordinates.lng,
        },
        hasMap: `https://www.google.com/maps?q=${HOTEL_INFO.coordinates.lat},${HOTEL_INFO.coordinates.lng}`,
        image: `${BASE_URL}/opengraph-image`,
        priceRange: "€50 - €70",
        currenciesAccepted: "EUR",
        paymentAccepted: "Credit Card, Cash",
        checkinTime: HOTEL_INFO.checkIn,
        checkoutTime: HOTEL_INFO.checkOut,
        starRating: {
          "@type": "Rating",
          ratingValue: "3",
        },
        aggregateRating: {
          "@type": "AggregateRating",
          ratingValue: String(HOTEL_INFO.rating),
          bestRating: "10",
          reviewCount: String(HOTEL_INFO.reviewCount),
        },
        numberOfRooms: 9,
        petsAllowed: false,
        amenityFeature: [
          { "@type": "LocationFeatureSpecification", name: "Free Wi-Fi", value: true },
          { "@type": "LocationFeatureSpecification", name: "Air Conditioning", value: true },
          { "@type": "LocationFeatureSpecification", name: "Free Parking", value: true },
          { "@type": "LocationFeatureSpecification", name: "Beach Access", value: true },
          { "@type": "LocationFeatureSpecification", name: "Restaurant", value: true },
          { "@type": "LocationFeatureSpecification", name: "Bar & Snack Bar", value: true },
          { "@type": "LocationFeatureSpecification", name: "Kitchenette", value: true },
          { "@type": "LocationFeatureSpecification", name: "Sea View Rooms", value: true },
          { "@type": "LocationFeatureSpecification", name: "Private Balcony", value: true },
          { "@type": "LocationFeatureSpecification", name: "Flat Screen TV", value: true },
          { "@type": "LocationFeatureSpecification", name: "In-Room Safe", value: true },
          { "@type": "LocationFeatureSpecification", name: "Hair Dryer", value: true },
          { "@type": "LocationFeatureSpecification", name: "Fresh Towels", value: true },
          { "@type": "LocationFeatureSpecification", name: "Daily Cleaning", value: true },
          { "@type": "LocationFeatureSpecification", name: "Mini Fridge", value: true },
          { "@type": "LocationFeatureSpecification", name: "Coffee & Tea", value: true },
          { "@type": "LocationFeatureSpecification", name: "Playground", value: true },
          { "@type": "LocationFeatureSpecification", name: "Electric Kettle", value: true },
        ],
      }}
    />
  );
}

export function HotelRoomJsonLd({
  name,
  description,
  capacity,
  bedType,
  sizeSqm,
  basePrice,
  image,
  url,
}: {
  name: string;
  description: string;
  capacity: number;
  bedType: string;
  sizeSqm: number;
  basePrice: number;
  image?: string;
  url: string;
}) {
  return (
    <JsonLd
      data={{
        "@context": "https://schema.org",
        "@type": "HotelRoom",
        name,
        description,
        url,
        image: image || `${BASE_URL}/opengraph-image`,
        occupancy: {
          "@type": "QuantitativeValue",
          maxValue: capacity,
        },
        bed: {
          "@type": "BedDetails",
          typeOfBed: bedType,
        },
        floorSize: {
          "@type": "QuantitativeValue",
          value: sizeSqm,
          unitCode: "MTK",
        },
        offers: {
          "@type": "Offer",
          priceCurrency: "EUR",
          price: String(basePrice),
          availability: "https://schema.org/InStock",
        },
      }}
    />
  );
}

export function BreadcrumbJsonLd({
  items,
}: {
  items: { name: string; url: string }[];
}) {
  return (
    <JsonLd
      data={{
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        itemListElement: items.map((item, i) => ({
          "@type": "ListItem",
          position: i + 1,
          name: item.name,
          item: item.url,
        })),
      }}
    />
  );
}

export function WebSiteJsonLd() {
  return (
    <JsonLd
      data={{
        "@context": "https://schema.org",
        "@type": "WebSite",
        name: HOTEL_INFO.name,
        url: BASE_URL,
        inLanguage: ["en", "el", "de"],
      }}
    />
  );
}

// ─── FAQ Schema ──────────────────────────────────────────────

export function FAQPageJsonLd({
  faqs,
}: {
  faqs: { question: string; answer: string }[];
}) {
  return (
    <JsonLd
      data={{
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: faqs.map((faq) => ({
          "@type": "Question",
          name: faq.question,
          acceptedAnswer: {
            "@type": "Answer",
            text: faq.answer,
          },
        })),
      }}
    />
  );
}

// ─── Review Schema ───────────────────────────────────────────

type ReviewData = {
  author: string;
  country: string;
  rating: number;
  text: string;
  datePublished: string;
};

export function ReviewsJsonLd({ reviews }: { reviews: ReviewData[] }) {
  return (
    <JsonLd
      data={{
        "@context": "https://schema.org",
        "@type": "Hotel",
        name: HOTEL_INFO.nameFull,
        url: BASE_URL,
        review: reviews.map((r) => ({
          "@type": "Review",
          author: {
            "@type": "Person",
            name: r.author,
          },
          reviewRating: {
            "@type": "Rating",
            ratingValue: String(r.rating),
            bestRating: "5",
          },
          datePublished: r.datePublished,
          reviewBody: r.text,
        })),
      }}
    />
  );
}
