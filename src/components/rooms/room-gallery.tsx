"use client";

import Image from "next/image";
import { useState } from "react";
import { cn } from "@/lib/utils";

type GalleryImage = {
  url: string;
  alt?: string;
};

type RoomGalleryProps = {
  images: GalleryImage[];
};

export function RoomGallery({ images }: RoomGalleryProps) {
  const [activeIndex, setActiveIndex] = useState(0);

  if (images.length === 0) return null;

  return (
    <div className="space-y-3">
      {/* Main Image */}
      <div className="relative aspect-[16/9] max-h-[500px] overflow-hidden rounded-2xl shadow-elegant">
        <Image
          src={images[activeIndex].url}
          alt={images[activeIndex].alt || "Room photo"}
          fill
          className="object-cover transition-opacity duration-500"
          sizes="(max-width: 768px) 100vw, 60vw"
          priority
        />
      </div>

      {/* Thumbnail Strip */}
      {images.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin">
          {images.map((image, index) => (
            <button
              key={index}
              onClick={() => setActiveIndex(index)}
              className={cn(
                "relative h-16 w-24 flex-shrink-0 overflow-hidden rounded-lg transition-all duration-200 sm:h-20 sm:w-28",
                activeIndex === index
                  ? "ring-2 ring-terracotta ring-offset-2"
                  : "opacity-60 hover:opacity-100"
              )}
            >
              <Image
                src={image.url}
                alt={image.alt || `Thumbnail ${index + 1}`}
                fill
                className="object-cover"
                sizes="112px"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
