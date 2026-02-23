"use client";

import { useState, useRef, useEffect } from "react";
import { useTranslations } from "next-intl";
import { DayPicker, type DateRange } from "react-day-picker";
import { CalendarDays, Users, Moon, ChevronDown } from "lucide-react";
import { format, addDays, differenceInDays } from "date-fns";
import { cn } from "@/lib/utils";
import { useMediaQuery } from "@/hooks/use-media-query";
import "react-day-picker/style.css";

type Props = {
  checkIn: Date | null;
  checkOut: Date | null;
  guests: number;
  onCheckInChange: (date: Date | null) => void;
  onCheckOutChange: (date: Date | null) => void;
  onGuestsChange: (guests: number) => void;
};

export function DateSelector({
  checkIn,
  checkOut,
  guests,
  onCheckInChange,
  onCheckOutChange,
  onGuestsChange,
}: Props) {
  const t = useTranslations("booking");
  const [activeField, setActiveField] = useState<
    "checkIn" | "checkOut" | null
  >(null);
  const isMobile = useMediaQuery("(max-width: 639px)");
  const calendarRef = useRef<HTMLDivElement>(null);

  const nights =
    checkIn && checkOut ? differenceInDays(checkOut, checkIn) : 0;

  useEffect(() => {
    if (activeField && isMobile && calendarRef.current) {
      calendarRef.current.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
      });
    }
  }, [activeField, isMobile]);

  function handleRangeSelect(range: DateRange | undefined) {
    onCheckInChange(range?.from || null);
    onCheckOutChange(range?.to || null);

    if (range?.from && !range?.to) {
      setActiveField("checkOut");
    } else if (range?.from && range?.to) {
      setActiveField(null);
    }
  }

  return (
    <div className="rounded-2xl bg-white/80 backdrop-blur-md p-4 shadow-soft sm:p-6 border border-white/40">
      {/* Compact selector row */}
      <div className="grid grid-cols-3 items-stretch gap-0 sm:flex sm:gap-3">
        {/* Check-in */}
        <button
          type="button"
          onClick={() =>
            setActiveField(activeField === "checkIn" ? null : "checkIn")
          }
          className={cn(
            "flex-1 rounded-xl px-3 py-3 text-left transition-all duration-200 sm:px-4",
            activeField === "checkIn"
              ? "bg-terracotta/8 ring-1 ring-terracotta/30"
              : "bg-white/60 hover:bg-white/80",
          )}
        >
          <span className="text-[10px] font-medium uppercase tracking-widest text-gray-400">
            {t("checkIn")}
          </span>
          <div className="mt-1 flex items-center gap-2">
            <CalendarDays className="h-3.5 w-3.5 text-terracotta/70" />
            <span className="text-sm font-semibold text-deep-blue">
              {checkIn ? format(checkIn, "MMM dd") : "Select date"}
            </span>
          </div>
        </button>

        {/* Divider */}
        <div className="hidden sm:flex items-center">
          <div className="h-8 w-px bg-gray-200" />
        </div>

        {/* Check-out */}
        <button
          type="button"
          onClick={() =>
            setActiveField(activeField === "checkOut" ? null : "checkOut")
          }
          className={cn(
            "flex-1 rounded-xl px-3 py-3 text-left transition-all duration-200 sm:px-4",
            activeField === "checkOut"
              ? "bg-terracotta/8 ring-1 ring-terracotta/30"
              : "bg-white/60 hover:bg-white/80",
          )}
        >
          <span className="text-[10px] font-medium uppercase tracking-widest text-gray-400">
            {t("checkOut")}
          </span>
          <div className="mt-1 flex items-center gap-2">
            <CalendarDays className="h-3.5 w-3.5 text-terracotta/70" />
            <span className="text-sm font-semibold text-deep-blue">
              {checkOut ? format(checkOut, "MMM dd") : "Select date"}
            </span>
          </div>
        </button>

        {/* Divider */}
        <div className="hidden sm:flex items-center">
          <div className="h-8 w-px bg-gray-200" />
        </div>

        {/* Guests */}
        <div className="relative flex-1 rounded-xl bg-white/60 px-3 py-3 sm:px-4">
          <span className="text-[10px] font-medium uppercase tracking-widest text-gray-400">
            {t("guests")}
          </span>
          <div className="mt-1 flex items-center gap-2">
            <Users className="h-3.5 w-3.5 text-terracotta/70" />
            <select
              value={guests}
              onChange={(e) => onGuestsChange(Number(e.target.value))}
              className="appearance-none bg-transparent text-sm font-semibold text-deep-blue outline-none cursor-pointer pr-4"
            >
              {[1, 2, 3, 4, 5, 6].map((n) => (
                <option key={n} value={n}>
                  {n} {n === 1 ? "guest" : "guests"}
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-3 w-3 -translate-y-1/2 text-gray-400" />
          </div>
        </div>
      </div>

      {/* Nights badge */}
      {nights > 0 && (
        <div className="mt-3 flex items-center justify-center gap-1.5 text-xs text-terracotta/80 font-medium">
          <Moon className="h-3 w-3" />
          {t("nights", { count: nights })}
        </div>
      )}

      {/* Calendar — slides open when a date field is active */}
      {activeField && (
        <div
          ref={calendarRef}
          className="mt-4 border-t border-gray-100 pt-4"
        >
          <p className="mb-3 text-center text-xs text-gray-400">
            {activeField === "checkIn"
              ? t("selectCheckIn")
              : t("selectCheckOut")}
          </p>
          <div
            className={cn(
              "flex justify-center overflow-x-auto [&_.rdp-root]:font-sans [&_.rdp-root]:text-sm",
              "[&_.rdp-day_button.rdp-day_button]:rounded-lg [&_.rdp-day_button.rdp-day_button]:text-xs",
              "[&_.rdp-selected_.rdp-day_button]:bg-terracotta",
              "[&_.rdp-range_middle_.rdp-day_button]:bg-terracotta/10",
              "[&_.rdp-range_middle_.rdp-day_button]:text-terracotta",
              "[&_.rdp-today:not(.rdp-selected)_.rdp-day_button]:border-terracotta/40",
              "[&_.rdp-today:not(.rdp-selected)_.rdp-day_button]:border",
            )}
          >
            <DayPicker
              mode="range"
              selected={
                checkIn
                  ? { from: checkIn, to: checkOut || undefined }
                  : undefined
              }
              onSelect={handleRangeSelect}
              numberOfMonths={isMobile ? 1 : 2}
              disabled={{ before: addDays(new Date(), 1) }}
              fromMonth={new Date()}
            />
          </div>
        </div>
      )}
    </div>
  );
}
