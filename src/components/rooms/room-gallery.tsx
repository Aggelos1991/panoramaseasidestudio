"use client";

import Image from "next/image";
import { useState } from "react";
import { Images, Rotate3d } from "lucide-react";
import { cn } from "@/lib/utils";

type GalleryImage = {
  url: string;
  alt?: string;
};

type RoomGalleryProps = {
  images: GalleryImage[];
  tour?: { src: string; credit?: string };
  labels: { photos: string; tour3d: string; tourHint: string };
};

export function RoomGallery({ images, tour, labels }: RoomGalleryProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [view, setView] = useState<"photos" | "tour">(images.length > 0 ? "photos" : "tour");
  // The scene is several MB — only load the viewer once the guest opens the tour.
  const [tourOpened, setTourOpened] = useState(images.length === 0);

  if (images.length === 0 && !tour) return null;

  const showTour = view === "tour" && !!tour;

  function openTour() {
    setView("tour");
    setTourOpened(true);
  }

  return (
    <div className="space-y-3">
      {/* Photos / 3D tour switch */}
      {tour && images.length > 0 && (
        <div className="flex w-fit gap-1 rounded-full bg-white p-1 shadow-soft">
          <ViewTab active={!showTour} onClick={() => setView("photos")}>
            <Images className="h-4 w-4" />
            {labels.photos}
          </ViewTab>
          <ViewTab active={showTour} onClick={openTour}>
            <Rotate3d className="h-4 w-4" />
            {labels.tour3d}
          </ViewTab>
        </div>
      )}

      {/* Main Image / 3D viewer */}
      <div
        className={cn(
          "relative overflow-hidden rounded-2xl shadow-elegant",
          showTour ? "aspect-[4/3] max-h-[560px] bg-deep-blue sm:aspect-[16/9]" : "aspect-[16/9] max-h-[500px]"
        )}
      >
        {tour && tourOpened && (
          <div className={cn("absolute inset-0", !showTour && "hidden")}>
            <iframe
              src={tour.src}
              title={labels.tour3d}
              allow="fullscreen; xr-spatial-tracking"
              className="h-full w-full border-0"
            />
            <span className="pointer-events-none absolute left-3 top-3 rounded-full bg-black/55 px-3 py-1 text-xs font-medium text-white backdrop-blur-sm">
              {labels.tourHint}
            </span>
          </div>
        )}
        {!showTour && images.length > 0 && (
          <Image
            src={images[activeIndex].url}
            alt={images[activeIndex].alt || "Room photo"}
            fill
            className="object-cover transition-opacity duration-500"
            sizes="(max-width: 768px) 100vw, 60vw"
            priority
          />
        )}
      </div>

      {showTour && tour.credit && <p className="text-xs text-gray-500">{tour.credit}</p>}

      {/* Thumbnail Strip */}
      {!showTour && images.length > 1 && (
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

function ViewTab({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium transition-colors",
        active ? "bg-deep-blue text-white" : "text-gray-600 hover:text-deep-blue"
      )}
    >
      {children}
    </button>
  );
}
