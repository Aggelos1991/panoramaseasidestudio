import type { MetadataRoute } from "next";
import { LISTING_ROOMS } from "@/lib/listing";
import { listRooms } from "@/lib/store";

const BASE_URL = "https://panoramaseasidekos.com";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Get room slugs from DB with fallback
  let roomSlugs: string[];
  try {
    const rooms = await listRooms({ activeOnly: true });
    roomSlugs = rooms.map((r) => r.slug);
  } catch {
    roomSlugs = LISTING_ROOMS.map((room) => room.slug);
  }
  if (roomSlugs.length === 0) {
    roomSlugs = LISTING_ROOMS.map((room) => room.slug);
  }

  const locales = ["en", "el", "de"] as const;
  const now = new Date();

  function localeUrl(path: string, locale: string) {
    return locale === "en" ? `${BASE_URL}${path}` : `${BASE_URL}/${locale}${path}`;
  }

  function alternates(path: string) {
    return {
      languages: Object.fromEntries(
        locales.map((l) => [l, localeUrl(path, l)]),
      ),
    };
  }

  const staticPages = [
    { path: "/", priority: 1.0, changeFrequency: "daily" as const },
    { path: "/rooms", priority: 0.9, changeFrequency: "weekly" as const },
    { path: "/about", priority: 0.6, changeFrequency: "monthly" as const },
    { path: "/contact", priority: 0.6, changeFrequency: "monthly" as const },
  ];

  const entries: MetadataRoute.Sitemap = [];

  // Static pages — one entry per locale
  for (const page of staticPages) {
    for (const locale of locales) {
      entries.push({
        url: localeUrl(page.path, locale),
        lastModified: now,
        changeFrequency: page.changeFrequency,
        priority: page.priority,
        alternates: alternates(page.path),
      });
    }
  }

  // Room detail pages
  for (const slug of roomSlugs) {
    for (const locale of locales) {
      entries.push({
        url: localeUrl(`/rooms/${slug}`, locale),
        lastModified: now,
        changeFrequency: "weekly" as const,
        priority: 0.8,
        alternates: alternates(`/rooms/${slug}`),
      });
    }
  }

  return entries;
}
