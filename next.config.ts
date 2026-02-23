import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "panoramastudiosmastichari.hotelskosisland.com",
      },
      {
        protocol: "https",
        hostname: "www.mastihari-panorama.com",
      },
    ],
  },
};

export default withNextIntl(nextConfig);
