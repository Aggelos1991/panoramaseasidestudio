"use client";

import { useState, useEffect, useCallback } from "react";
import { useTranslations } from "next-intl";
import Image from "next/image";
import { X, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { PLACEHOLDER_IMAGES } from "@/lib/constants";

type Category = "all" | "rooms" | "exterior" | "views";

const GALLERY_IMAGES: { src: string; category: Category; alt: string }[] = [
  {
    src: PLACEHOLDER_IMAGES.gallery[0],
    category: "rooms",
    alt: "Bedroom with sea view at Panorama Seaside Studios",
  },
  {
    src: PLACEHOLDER_IMAGES.gallery[1],
    category: "views",
    alt: "Aerial view of Mastichari beachfront",
  },
  {
    src: PLACEHOLDER_IMAGES.gallery[2],
    category: "views",
    alt: "Beach with sun loungers and turquoise sea",
  },
  {
    src: PLACEHOLDER_IMAGES.gallery[3],
    category: "rooms",
    alt: "Modern studio interior with elegant decor",
  },
  {
    src: PLACEHOLDER_IMAGES.gallery[4],
    category: "views",
    alt: "Aerial panorama of Mastichari village and coast",
  },
  {
    src: PLACEHOLDER_IMAGES.gallery[5],
    category: "exterior",
    alt: "Panorama Seaside Studios building exterior",
  },
  {
    src: PLACEHOLDER_IMAGES.gallery[6],
    category: "exterior",
    alt: "Beachfront terrace with sea views",
  },
  {
    src: PLACEHOLDER_IMAGES.about,
    category: "exterior",
    alt: "Outdoor dining area at Panorama Seaside",
  },
];

const categories: Category[] = ["all", "rooms", "exterior", "views"];

const categoryLabels: Record<Category, Record<string, string>> = {
  all: { en: "All", el: "Όλα", de: "Alle" },
  rooms: { en: "Rooms", el: "Δωμάτια", de: "Zimmer" },
  exterior: { en: "Exterior", el: "Εξωτερικοί", de: "Außen" },
  views: { en: "Views", el: "Θέα", de: "Aussicht" },
};

const aspectClasses = [
  "aspect-[4/3]",
  "aspect-[4/3]",
  "aspect-[4/3]",
  "aspect-[4/3]",
  "aspect-[4/3]",
  "aspect-[4/3]",
  "aspect-[4/3]",
  "aspect-[4/3]",
];

export function GalleryGrid() {
  const t = useTranslations("gallery");
  const [selectedCategory, setSelectedCategory] = useState<Category>("all");
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [touchStartX, setTouchStartX] = useState<number | null>(null);

  const filteredImages =
    selectedCategory === "all"
      ? GALLERY_IMAGES
      : GALLERY_IMAGES.filter((img) => img.category === selectedCategory);

  const openLightbox = (index: number) => setLightboxIndex(index);
  const closeLightbox = () => setLightboxIndex(null);

  const goNext = useCallback(() => {
    if (lightboxIndex === null) return;
    setLightboxIndex((lightboxIndex + 1) % filteredImages.length);
  }, [lightboxIndex, filteredImages.length]);

  const goPrev = useCallback(() => {
    if (lightboxIndex === null) return;
    setLightboxIndex(
      (lightboxIndex - 1 + filteredImages.length) % filteredImages.length,
    );
  }, [lightboxIndex, filteredImages.length]);

  function handleTouchStart(e: React.TouchEvent) {
    setTouchStartX(e.touches[0].clientX);
  }

  function handleTouchEnd(e: React.TouchEvent) {
    if (touchStartX === null) return;
    const diff = touchStartX - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 50) {
      if (diff > 0) goNext();
      else goPrev();
    }
    setTouchStartX(null);
  }

  useEffect(() => {
    if (lightboxIndex === null) return;

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") closeLightbox();
      if (e.key === "ArrowRight") goNext();
      if (e.key === "ArrowLeft") goPrev();
    }

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [lightboxIndex, goNext, goPrev]);

  return (
    <>
      {/* Filter Tabs */}
      <div className="flex flex-wrap justify-center gap-2">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={cn(
              "rounded-full px-5 py-2 text-sm font-medium transition-all duration-200",
              selectedCategory === cat
                ? "bg-terracotta text-white shadow-sm"
                : "bg-sandy text-deep-blue hover:bg-sandy-dark",
            )}
          >
            {categoryLabels[cat]?.en ?? cat}
          </button>
        ))}
      </div>

      {/* Grid */}
      <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filteredImages.map((image, i) => (
          <div
            key={`${image.src}-${i}`}
            className="group cursor-pointer overflow-hidden rounded-xl shadow-soft transition-shadow duration-300 hover:shadow-elegant"
            onClick={() => openLightbox(i)}
          >
            <div className={cn("relative", aspectClasses[i % aspectClasses.length])}>
              <Image
                src={image.src}
                alt={image.alt}
                fill
                quality={85}
                className="object-cover transition-transform duration-500 group-hover:scale-110"
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
            </div>
          </div>
        ))}
      </div>

      {/* Lightbox */}
      {lightboxIndex !== null && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm animate-fade-in"
          onClick={closeLightbox}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          <button
            onClick={closeLightbox}
            className="absolute right-4 top-4 z-50 rounded-full bg-white/10 p-2 text-white transition-colors hover:bg-white/20"
            aria-label="Close lightbox"
          >
            <X className="h-6 w-6" />
          </button>

          <button
            onClick={(e) => {
              e.stopPropagation();
              goPrev();
            }}
            className="absolute left-4 z-50 rounded-full bg-white/10 p-3 text-white transition-colors hover:bg-white/20"
            aria-label="Previous image"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>

          <div
            className="relative mx-4 h-[80vh] w-full max-w-5xl sm:mx-8 lg:mx-16"
            onClick={(e) => e.stopPropagation()}
          >
            <Image
              src={filteredImages[lightboxIndex].src}
              alt={filteredImages[lightboxIndex].alt}
              fill
              quality={90}
              className="rounded-lg object-contain"
              sizes="90vw"
              priority
            />
          </div>

          <button
            onClick={(e) => {
              e.stopPropagation();
              goNext();
            }}
            className="absolute right-4 z-50 rounded-full bg-white/10 p-3 text-white transition-colors hover:bg-white/20"
            aria-label="Next image"
          >
            <ChevronRight className="h-6 w-6" />
          </button>

          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 rounded-full bg-white/10 px-4 py-1.5 text-sm text-white/80">
            {lightboxIndex + 1} / {filteredImages.length}
          </div>
        </div>
      )}
    </>
  );
}
