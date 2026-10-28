import type { Metadata } from "next";
import { EB_Garamond, Inter, Playfair_Display } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin", "greek"],
  display: "swap",
});

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  display: "swap",
});

const ebGaramond = EB_Garamond({
  variable: "--font-eb",
  subsets: ["latin", "greek"],
  weight: ["400", "500"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://panoramaseasidekos.com"),
  title: {
    default:
      "Panorama Seaside Studios — Beachfront Accommodation in Mastichari, Kos",
    template: "%s | Panorama Seaside Studios",
  },
  description:
    "Beachfront studios & apartments in Mastichari, Kos Island. Family-run accommodation steps from the beach with sea views, restaurant, and authentic Greek hospitality.",
  keywords: [
    "Kos",
    "Mastichari",
    "beachfront",
    "studios",
    "apartments",
    "Greece",
    "accommodation",
    "holiday",
    "Panorama Seaside",
    "hotel",
    "Kos Island",
    "Greek islands",
    "sea view",
    "family hotel",
    "Dodecanese",
    "beachfront hotel",
    "vacation rental Kos",
    "Mastichari beach",
    "Kos accommodation",
    "Greek island holiday",
    "Aegean",
    "family accommodation Kos",
    "rooms Mastichari",
    "hotel Mastichari Kos",
    "booking Kos",
    "Mastichari hotel",
  ],
  openGraph: {
    type: "website",
    siteName: "Panorama Seaside Studios",
    locale: "en_US",
    alternateLocale: ["el_GR", "de_DE"],
  },
  twitter: {
    card: "summary_large_image",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html suppressHydrationWarning>
      <body
        className={`${inter.variable} ${playfair.variable} ${ebGaramond.variable} font-sans antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
