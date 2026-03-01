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
        image: `${BASE_URL}/opengraph-image`,
        priceRange: "€50 - €70",
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
        amenityFeature: [
          { "@type": "LocationFeatureSpecification", name: "Free Wi-Fi", value: true },
          { "@type": "LocationFeatureSpecification", name: "Air Conditioning", value: true },
          { "@type": "LocationFeatureSpecification", name: "Free Parking", value: true },
          { "@type": "LocationFeatureSpecification", name: "Beach Access", value: true },
          { "@type": "LocationFeatureSpecification", name: "Restaurant", value: true },
          { "@type": "LocationFeatureSpecification", name: "Bar", value: true },
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
