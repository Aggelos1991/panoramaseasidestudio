import type { Metadata } from "next";

const BASE_URL = "https://panoramaseasidekos.com";

export const metadata: Metadata = {
  title: "Book Your Stay",
  description:
    "Book your beachfront room at Panorama Seaside Studios in Mastichari, Kos. Secure online booking with instant confirmation for studios and apartments on the beach.",
  robots: {
    index: false,
    follow: true,
  },
  alternates: {
    canonical: `${BASE_URL}/booking`,
    languages: {
      en: `${BASE_URL}/booking`,
      el: `${BASE_URL}/el/booking`,
      de: `${BASE_URL}/de/booking`,
    },
  },
};

export default function BookingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
