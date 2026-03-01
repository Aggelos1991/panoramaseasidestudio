import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Panorama Seaside Studios — Mastichari, Kos",
    short_name: "Panorama Studios",
    description:
      "Beachfront studios & apartments in Mastichari, Kos Island. Family-run accommodation steps from the beach.",
    start_url: "/",
    display: "standalone",
    theme_color: "#1e3a5f",
    background_color: "#faf8f5",
    icons: [
      { src: "/icon", sizes: "32x32", type: "image/png" },
      { src: "/apple-icon", sizes: "180x180", type: "image/png" },
    ],
  };
}
