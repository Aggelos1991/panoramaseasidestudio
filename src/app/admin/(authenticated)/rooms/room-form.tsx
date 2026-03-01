"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import { Upload, X, Star, GripVertical, Loader2, Languages } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AMENITY_LABELS } from "@/lib/constants";

type RoomImage = {
  id?: string;
  url: string;
  alt: string | null;
  isPrimary: boolean;
  sortOrder: number;
};

type Room = {
  id: string;
  nameEn: string;
  nameEl: string;
  nameDe: string;
  descEn: string;
  descEl: string;
  descDe: string;
  capacity: number;
  bedType: string;
  sizeSqm: number;
  basePrice: number | string;
  totalUnits: number;
  amenities: string[];
  images: RoomImage[];
};

const ALL_AMENITIES = Object.keys(AMENITY_LABELS);

export function RoomForm({
  room,
  onSaved,
  onCancel,
}: {
  room: Room | null;
  onSaved: () => void;
  onCancel: () => void;
}) {
  const isEditing = !!room;
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form state
  const [nameEn, setNameEn] = useState(room?.nameEn || "");
  const [nameEl, setNameEl] = useState(room?.nameEl || "");
  const [nameDe, setNameDe] = useState(room?.nameDe || "");
  const [descEn, setDescEn] = useState(room?.descEn || "");
  const [descEl, setDescEl] = useState(room?.descEl || "");
  const [descDe, setDescDe] = useState(room?.descDe || "");
  const [capacity, setCapacity] = useState(room?.capacity || 2);
  const [bedType, setBedType] = useState(room?.bedType || "");
  const [sizeSqm, setSizeSqm] = useState(room?.sizeSqm || 0);
  const [basePrice, setBasePrice] = useState(room ? String(Number(room.basePrice)) : "");
  const [totalUnits, setTotalUnits] = useState(room?.totalUnits || 1);
  const [amenities, setAmenities] = useState<string[]>(room?.amenities || []);
  const [images, setImages] = useState<RoomImage[]>(room?.images || []);

  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [translating, setTranslating] = useState(false);
  const [error, setError] = useState("");

  // Language tabs
  const [langTab, setLangTab] = useState<"en" | "el" | "de">("en");

  function toggleAmenity(key: string) {
    setAmenities((prev) =>
      prev.includes(key) ? prev.filter((a) => a !== key) : [...prev, key],
    );
  }

  async function handleUpload(files: FileList | null) {
    if (!files || files.length === 0) return;
    setUploading(true);
    setError("");

    try {
      const newImages: RoomImage[] = [];
      for (const file of Array.from(files)) {
        const formData = new FormData();
        formData.append("file", file);
        const res = await fetch("/api/upload", { method: "POST", body: formData });
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || "Upload failed");
        }
        const { url } = await res.json();
        newImages.push({
          url,
          alt: nameEn || file.name,
          isPrimary: images.length === 0 && newImages.length === 0,
          sortOrder: images.length + newImages.length,
        });
      }
      setImages((prev) => [...prev, ...newImages]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  async function handleTranslate() {
    if (!nameEn && !descEn) {
      setError("Enter English name or description first");
      return;
    }
    setTranslating(true);
    setError("");

    try {
      const textsToTranslate = [nameEn || "", descEn || ""];

      const [elRes, deRes] = await Promise.all([
        fetch("/api/translate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ texts: textsToTranslate, targetLang: "el" }),
        }),
        fetch("/api/translate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ texts: textsToTranslate, targetLang: "de" }),
        }),
      ]);

      if (!elRes.ok || !deRes.ok) {
        throw new Error("Translation service unavailable");
      }

      const elData = await elRes.json();
      const deData = await deRes.json();

      if (nameEn) {
        setNameEl(elData.translations[0]);
        setNameDe(deData.translations[0]);
      }
      if (descEn) {
        setDescEl(elData.translations[1]);
        setDescDe(deData.translations[1]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Translation failed");
    } finally {
      setTranslating(false);
    }
  }

  function removeImage(index: number) {
    setImages((prev) => {
      const updated = prev.filter((_, i) => i !== index);
      // If removed was primary, make first one primary
      if (updated.length > 0 && !updated.some((img) => img.isPrimary)) {
        updated[0].isPrimary = true;
      }
      return updated;
    });
  }

  function setPrimary(index: number) {
    setImages((prev) =>
      prev.map((img, i) => ({ ...img, isPrimary: i === index })),
    );
  }

  async function handleSubmit() {
    if (!nameEn || !basePrice || !capacity) {
      setError("Name, price, and capacity are required");
      return;
    }
    setSaving(true);
    setError("");

    const payload = {
      nameEn,
      nameEl: nameEl || nameEn,
      nameDe: nameDe || nameEn,
      descEn,
      descEl: descEl || descEn,
      descDe: descDe || descEn,
      capacity,
      bedType,
      sizeSqm,
      basePrice: Number(basePrice),
      totalUnits,
      amenities,
      images: images.map((img, i) => ({
        url: img.url,
        alt: img.alt || nameEn,
        isPrimary: img.isPrimary,
        sortOrder: i,
      })),
    };

    try {
      const url = isEditing ? `/api/rooms/${room.id}` : "/api/rooms";
      const method = isEditing ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to save");
      }
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save room");
    } finally {
      setSaving(false);
    }
  }

  const langTabs = [
    { key: "en" as const, label: "English" },
    { key: "el" as const, label: "Greek" },
    { key: "de" as const, label: "German" },
  ];

  return (
    <div className="rounded-b-2xl border border-blue-200 bg-white p-6">
      {error && (
        <div className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Language tabs for name/description */}
      <div className="mb-4 flex items-center gap-3">
        <div className="flex flex-1 gap-1 rounded-lg bg-gray-100 p-0.5">
          {langTabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setLangTab(tab.key)}
              className={`flex-1 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                langTab === tab.key
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={handleTranslate}
          disabled={translating || (!nameEn && !descEn)}
          className="flex items-center gap-1.5 rounded-lg border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-medium text-blue-700 transition-colors hover:bg-blue-100 disabled:opacity-50"
        >
          {translating ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Languages className="h-3.5 w-3.5" />
          )}
          Auto-translate
        </button>
      </div>

      {/* Name + Description per language */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="block text-xs font-medium text-gray-600">
            Room Name {langTab === "en" && <span className="text-red-400">*</span>}
          </label>
          {langTab === "en" && (
            <input
              type="text"
              value={nameEn}
              onChange={(e) => setNameEn(e.target.value)}
              placeholder="e.g. Deluxe Double Room"
              className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-deep-blue focus:outline-none"
            />
          )}
          {langTab === "el" && (
            <input
              type="text"
              value={nameEl}
              onChange={(e) => setNameEl(e.target.value)}
              placeholder="Greek name (optional)"
              className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-deep-blue focus:outline-none"
            />
          )}
          {langTab === "de" && (
            <input
              type="text"
              value={nameDe}
              onChange={(e) => setNameDe(e.target.value)}
              placeholder="German name (optional)"
              className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-deep-blue focus:outline-none"
            />
          )}
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600">Description</label>
          {langTab === "en" && (
            <textarea
              value={descEn}
              onChange={(e) => setDescEn(e.target.value)}
              rows={2}
              placeholder="Describe the room..."
              className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-deep-blue focus:outline-none"
            />
          )}
          {langTab === "el" && (
            <textarea
              value={descEl}
              onChange={(e) => setDescEl(e.target.value)}
              rows={2}
              placeholder="Greek description (optional)"
              className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-deep-blue focus:outline-none"
            />
          )}
          {langTab === "de" && (
            <textarea
              value={descDe}
              onChange={(e) => setDescDe(e.target.value)}
              rows={2}
              placeholder="German description (optional)"
              className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-deep-blue focus:outline-none"
            />
          )}
        </div>
      </div>

      {/* Room details */}
      <div className="mt-4 grid gap-4 sm:grid-cols-3 lg:grid-cols-5">
        <div>
          <label className="block text-xs font-medium text-gray-600">
            Capacity <span className="text-red-400">*</span>
          </label>
          <input
            type="number"
            min={1}
            value={capacity}
            onChange={(e) => setCapacity(Number(e.target.value))}
            className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-deep-blue focus:outline-none"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600">Bed Type</label>
          <input
            type="text"
            value={bedType}
            onChange={(e) => setBedType(e.target.value)}
            placeholder="e.g. 1 Double Bed"
            className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-deep-blue focus:outline-none"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600">Size (m&sup2;)</label>
          <input
            type="number"
            min={0}
            value={sizeSqm}
            onChange={(e) => setSizeSqm(Number(e.target.value))}
            className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-deep-blue focus:outline-none"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600">
            Price/Night (&euro;) <span className="text-red-400">*</span>
          </label>
          <input
            type="number"
            min={1}
            step={1}
            value={basePrice}
            onChange={(e) => setBasePrice(e.target.value)}
            placeholder="65"
            className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-deep-blue focus:outline-none"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600">Units</label>
          <input
            type="number"
            min={1}
            value={totalUnits}
            onChange={(e) => setTotalUnits(Number(e.target.value))}
            className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-deep-blue focus:outline-none"
          />
        </div>
      </div>

      {/* Photos */}
      <div className="mt-6">
        <label className="block text-xs font-medium text-gray-600">Photos</label>
        <div className="mt-2 flex flex-wrap gap-3">
          {images.map((img, index) => (
            <div
              key={img.url}
              className="group relative h-24 w-32 overflow-hidden rounded-lg border border-gray-200"
            >
              <Image
                src={img.url}
                alt={img.alt || "Room photo"}
                fill
                className="object-cover"
                sizes="128px"
              />
              <div className="absolute inset-0 bg-black/0 transition-colors group-hover:bg-black/30" />
              <div className="absolute right-1 top-1 flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                <button
                  onClick={() => setPrimary(index)}
                  className={`rounded p-1 ${img.isPrimary ? "bg-yellow-400 text-white" : "bg-white/90 text-gray-600"}`}
                  title="Set as primary"
                >
                  <Star className="h-3 w-3" />
                </button>
                <button
                  onClick={() => removeImage(index)}
                  className="rounded bg-white/90 p-1 text-red-500"
                  title="Remove"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
              {img.isPrimary && (
                <div className="absolute bottom-1 left-1 rounded bg-yellow-400 px-1.5 py-0.5 text-[9px] font-bold text-white">
                  PRIMARY
                </div>
              )}
            </div>
          ))}

          {/* Upload button */}
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="flex h-24 w-32 flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-200 text-gray-400 transition-colors hover:border-deep-blue hover:text-deep-blue disabled:opacity-50"
          >
            {uploading ? (
              <Loader2 className="h-6 w-6 animate-spin" />
            ) : (
              <>
                <Upload className="h-5 w-5" />
                <span className="mt-1 text-[10px] font-medium">Upload</span>
              </>
            )}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(e) => handleUpload(e.target.files)}
          />
        </div>
      </div>

      {/* Amenities */}
      <div className="mt-6">
        <label className="block text-xs font-medium text-gray-600">Amenities</label>
        <div className="mt-2 flex flex-wrap gap-2">
          {ALL_AMENITIES.map((key) => {
            const isSelected = amenities.includes(key);
            return (
              <button
                key={key}
                onClick={() => toggleAmenity(key)}
                className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
                  isSelected
                    ? "border-deep-blue bg-deep-blue/5 text-deep-blue"
                    : "border-gray-200 text-gray-500 hover:border-gray-300 hover:bg-gray-50"
                }`}
              >
                {AMENITY_LABELS[key]?.en || key}
              </button>
            );
          })}
        </div>
      </div>

      {/* Actions */}
      <div className="mt-6 flex gap-2 border-t border-gray-100 pt-4">
        <Button onClick={handleSubmit} isLoading={saving}>
          {isEditing ? "Save Changes" : "Create Room"}
        </Button>
        <Button variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </div>
  );
}
