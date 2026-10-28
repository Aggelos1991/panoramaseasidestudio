"use client";

import { MotionConfig } from "motion/react";
import { usePathname } from "@/i18n/navigation";

const FILM = ["/", "/rooms", "/booking", "/about", "/contact", "/account"];

export function FilmFrame({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const onFilm = FILM.some((path) => pathname === path || pathname.startsWith(`${path}/`));

  return (
    <MotionConfig reducedMotion="user">
      <div className={onFilm ? "film-page min-h-screen" : "min-h-screen"}>{children}</div>
    </MotionConfig>
  );
}
