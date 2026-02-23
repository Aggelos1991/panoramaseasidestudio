"use client";

import { cn } from "@/lib/utils";

interface PanoramaLogoProps {
  className?: string;
  variant?: "light" | "dark" | "gold";
  showIcon?: boolean;
  glow?: boolean;
}

export function PanoramaLogo({
  className,
  variant = "dark",
  showIcon = true,
  glow = false,
}: PanoramaLogoProps) {
  const color =
    variant === "light"
      ? "text-white"
      : variant === "gold"
        ? "text-gold"
        : "text-deep-blue";

  return (
    <div
      className={cn(
        "inline-flex flex-col items-center gap-0",
        glow && "logo-glow",
        className,
      )}
    >
      {showIcon && (
        <svg
          viewBox="0 0 120 70"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className={cn("h-10 w-auto", color)}
        >
          {/* Palm tree trunk */}
          <path
            d="M40 65 C42 50, 44 35, 48 22"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            fill="none"
          />
          {/* Fronds */}
          <path
            d="M48 22 C44 18, 34 16, 24 20"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            fill="none"
          />
          <path
            d="M26 20 C28 22, 30 26, 30 30"
            stroke="currentColor"
            strokeWidth="1.2"
            strokeLinecap="round"
            fill="none"
          />
          <path
            d="M48 22 C46 16, 40 10, 30 8"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            fill="none"
          />
          <path
            d="M32 9 C34 12, 35 16, 34 20"
            stroke="currentColor"
            strokeWidth="1.2"
            strokeLinecap="round"
            fill="none"
          />
          <path
            d="M48 22 C50 16, 52 10, 50 4"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            fill="none"
          />
          <path
            d="M50 6 C50 10, 48 14, 46 18"
            stroke="currentColor"
            strokeWidth="1.2"
            strokeLinecap="round"
            fill="none"
          />
          <path
            d="M48 22 C54 18, 62 16, 70 18"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            fill="none"
          />
          <path
            d="M68 18 C66 22, 62 26, 58 28"
            stroke="currentColor"
            strokeWidth="1.2"
            strokeLinecap="round"
            fill="none"
          />
          <path
            d="M48 22 C56 20, 64 22, 72 28"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            fill="none"
          />
          <path
            d="M70 27 C66 28, 62 30, 58 34"
            stroke="currentColor"
            strokeWidth="1.2"
            strokeLinecap="round"
            fill="none"
          />
          {/* Sun */}
          <circle cx="78" cy="10" r="5" stroke="currentColor" strokeWidth="1.8" fill="none" />
          {/* Beach line */}
          <path
            d="M35 65 C50 63, 70 62, 95 65"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            fill="none"
          />
        </svg>
      )}
      <span
        className={cn(
          "font-serif text-xl font-light tracking-[0.08em] lowercase leading-none",
          color,
        )}
      >
        panorama
      </span>
      <span
        className={cn(
          "text-[0.55em] font-medium uppercase tracking-[0.4em] leading-tight mt-0.5",
          color,
        )}
      >
        seaside
      </span>
    </div>
  );
}
