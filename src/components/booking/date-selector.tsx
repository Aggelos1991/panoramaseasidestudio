"use client";

import { useState, useRef, useEffect } from "react";
import { useTranslations } from "next-intl";
import { DayPicker, type DateRange } from "react-day-picker";
import { CalendarDays, Users, Moon } from "lucide-react";
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
    <div className="rounded-2xl bg-white p-5 shadow-soft sm:p-8">
      <h3 className="mb-6 font-serif text-xl font-semibold text-deep-blue">
        {t("selectDates")}
      </h3>

      <div className="space-y-5">
        {/* Date & guest cards */}
        <div className="grid gap-3 sm:grid-cols-3">
          {/* Check-in */}
          <button
            type="button"
            onClick={() => setActiveField("checkIn")}
            className={cn(
              "rounded-xl border-2 bg-cream p-4 text-left shadow-sm transition-all duration-200",
              activeField === "checkIn"
                ? "border-terracotta ring-2 ring-terracotta/20 shadow-md"
                : "border-gray-200 hover:border-terracotta/50 hover:shadow-md",
            )}
          >
            <span className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">
              {t("checkIn")}
            </span>
            <div className="mt-2 flex items-center gap-2.5">
              <CalendarDays className="h-5 w-5 flex-shrink-0 text-terracotta" />
              <span className="text-base font-semibold text-deep-blue">
                {checkIn ? format(checkIn, "MMM dd, yyyy") : "—"}
              </span>
            </div>
          </button>

          {/* Check-out */}
          <button
            type="button"
            onClick={() => setActiveField("checkOut")}
            className={cn(
              "rounded-xl border-2 bg-cream p-4 text-left shadow-sm transition-all duration-200",
              activeField === "checkOut"
                ? "border-terracotta ring-2 ring-terracotta/20 shadow-md"
                : "border-gray-200 hover:border-terracotta/50 hover:shadow-md",
            )}
          >
            <span className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">
              {t("checkOut")}
            </span>
            <div className="mt-2 flex items-center gap-2.5">
              <CalendarDays className="h-5 w-5 flex-shrink-0 text-terracotta" />
              <span className="text-base font-semibold text-deep-blue">
                {checkOut ? format(checkOut, "MMM dd, yyyy") : "—"}
              </span>
            </div>
          </button>

          {/* Guests */}
          <div className="rounded-xl border-2 border-gray-200 bg-cream p-4 shadow-sm">
            <label className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">
              {t("guests")}
            </label>
            <div className="mt-2 flex items-center gap-2.5">
              <Users className="h-5 w-5 flex-shrink-0 text-terracotta" />
              <select
                value={guests}
                onChange={(e) => onGuestsChange(Number(e.target.value))}
                className="appearance-none bg-transparent text-base font-semibold text-deep-blue outline-none cursor-pointer"
              >
                {[1, 2, 3, 4, 5, 6].map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Nights badge */}
        {nights > 0 && (
          <div className="flex items-center justify-center gap-2 text-sm text-terracotta font-medium">
            <Moon className="h-4 w-4" />
            {t("nights", { count: nights })}
          </div>
        )}

        {/* Helper text */}
        {activeField && (
          <p className="text-center text-sm text-terracotta/80 animate-fade-in">
            {activeField === "checkIn"
              ? t("selectCheckIn")
              : t("selectCheckOut")}
          </p>
        )}

        {/* Calendar */}
        <div
          ref={calendarRef}
          className={cn(
            "flex justify-center overflow-x-auto [&_.rdp-root]:font-sans",
            "[&_.rdp-day_button.rdp-day_button]:rounded-lg",
            "[&_.rdp-selected_.rdp-day_button]:bg-terracotta",
            "[&_.rdp-range_middle_.rdp-day_button]:bg-terracotta/10",
            "[&_.rdp-range_middle_.rdp-day_button]:text-terracotta",
            "[&_.rdp-today:not(.rdp-selected)_.rdp-day_button]:border-terracotta",
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
    </div>
  );
}
