"use client";

import { useEffect, useState, useMemo } from "react";
import { useTranslations } from "next-intl";
import {
  CalendarDays,
  Users,
  Moon,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ArrowRight,
} from "lucide-react";
import {
  format,
  addDays,
  addMonths,
  subMonths,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  isBefore,
  isAfter,
  isToday,
  differenceInDays,
} from "date-fns";
import { cn } from "@/lib/utils";
import { useMediaQuery } from "@/hooks/use-media-query";

type Props = {
  checkIn: Date | null;
  checkOut: Date | null;
  guests: number;
  onCheckInChange: (date: Date | null) => void;
  onCheckOutChange: (date: Date | null) => void;
  onGuestsChange: (guests: number) => void;
};

const DAY_NAMES = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

type NightStatus = "open" | "busy" | "full" | "closed";

function getMonthDays(month: Date): Date[] {
  const start = startOfWeek(startOfMonth(month), { weekStartsOn: 0 });
  const end = endOfWeek(endOfMonth(month), { weekStartsOn: 0 });
  return eachDayOfInterval({ start, end });
}

export function DateSelector({
  checkIn,
  checkOut,
  guests,
  onCheckInChange,
  onCheckOutChange,
  onGuestsChange,
}: Props) {
  const t = useTranslations("booking");
  const isMobile = useMediaQuery("(max-width: 639px)");
  const [currentMonth, setCurrentMonth] = useState(() =>
    checkIn ? startOfMonth(checkIn) : new Date(),
  );
  const [selecting, setSelecting] = useState<"checkIn" | "checkOut">(
    "checkIn",
  );
  const [hoveredDate, setHoveredDate] = useState<Date | null>(null);
  const [occupancy, setOccupancy] = useState<Record<string, NightStatus>>({});

  const nights =
    checkIn && checkOut ? differenceInDays(checkOut, checkIn) : 0;

  const tomorrow = addDays(new Date(), 1);
  tomorrow.setHours(0, 0, 0, 0);

  useEffect(() => {
    const from = format(startOfMonth(currentMonth), "yyyy-MM-dd");
    const to = format(endOfMonth(addMonths(currentMonth, 1)), "yyyy-MM-dd");
    let cancelled = false;
    fetch(`/api/calendar/public?from=${from}&to=${to}`)
      .then((response) => (response.ok ? response.json() : null))
      .then((data) => {
        if (!cancelled && data?.dates) setOccupancy(data.dates);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [currentMonth]);

  function nightStatus(day: Date): NightStatus {
    return occupancy[format(day, "yyyy-MM-dd")] || "open";
  }

  function stayIncludesBlocked(start: Date, end: Date): boolean {
    let cursor = start;
    while (isBefore(cursor, end)) {
      const status = nightStatus(cursor);
      if (status === "full" || status === "closed") return true;
      cursor = addDays(cursor, 1);
    }
    return false;
  }

  const month1Days = useMemo(() => getMonthDays(currentMonth), [currentMonth]);
  const month2 = addMonths(currentMonth, 1);
  const month2Days = useMemo(() => getMonthDays(month2), [month2]);

  function handleDayClick(day: Date) {
    if (isBefore(day, tomorrow)) return;

    const blocked =
      nightStatus(day) === "full" || nightStatus(day) === "closed";

    if (selecting === "checkIn") {
      if (blocked) return;
      onCheckInChange(day);
      onCheckOutChange(null);
      setSelecting("checkOut");
    } else {
      // checkOut selection
      if (checkIn && (isBefore(day, checkIn) || isSameDay(day, checkIn))) {
        if (blocked) return;
        // If clicked before check-in, reset and start over
        onCheckInChange(day);
        onCheckOutChange(null);
        setSelecting("checkOut");
      } else if (checkIn && stayIncludesBlocked(checkIn, day)) {
        return;
      } else {
        onCheckOutChange(day);
        setSelecting("checkIn");
      }
    }
  }

  function isInRange(day: Date): boolean {
    if (!checkIn) return false;
    const end = checkOut || hoveredDate;
    if (!end) return false;
    return isAfter(day, checkIn) && isBefore(day, end);
  }

  function isRangeStart(day: Date): boolean {
    return checkIn ? isSameDay(day, checkIn) : false;
  }

  function isRangeEnd(day: Date): boolean {
    if (checkOut) return isSameDay(day, checkOut);
    if (hoveredDate && checkIn && isAfter(hoveredDate, checkIn))
      return isSameDay(day, hoveredDate);
    return false;
  }

  function isDisabled(day: Date): boolean {
    if (isBefore(day, tomorrow)) return true;
    if (selecting !== "checkIn") return false;
    const status = nightStatus(day);
    return status === "full" || status === "closed";
  }

  function renderMonth(monthDate: Date, days: Date[]) {
    const weeks: Date[][] = [];
    for (let i = 0; i < days.length; i += 7) {
      weeks.push(days.slice(i, i + 7));
    }

    return (
      <div className="flex-1">
        {/* Month header */}
        <div className="mb-4 text-center">
          <h3 className="text-sm font-bold tracking-wide text-deep-blue">
            {format(monthDate, "MMMM yyyy")}
          </h3>
        </div>

        {/* Day names */}
        <div className="mb-1 grid grid-cols-7">
          {DAY_NAMES.map((name) => (
            <div
              key={name}
              className="py-1.5 text-center text-[11px] font-semibold uppercase tracking-wider text-gray-400"
            >
              {name}
            </div>
          ))}
        </div>

        {/* Day grid */}
        <div className="grid grid-cols-7">
          {weeks.map((week, wi) =>
            week.map((day, di) => {
              const inMonth = isSameMonth(day, monthDate);
              const disabled = isDisabled(day);
              const rangeStart = isRangeStart(day);
              const rangeEnd = isRangeEnd(day);
              const inRange = isInRange(day);
              const today = isToday(day);
              const selected = rangeStart || rangeEnd;
              const status = nightStatus(day);

              if (!inMonth) {
                return (
                  <div key={`${wi}-${di}`} className="h-10 sm:h-11" />
                );
              }

              return (
                <div
                  key={`${wi}-${di}`}
                  className={cn(
                    "relative flex h-10 items-center justify-center sm:h-11",
                    // Range background
                    inRange && "bg-terracotta/8",
                    rangeStart && checkOut && "rounded-l-full bg-terracotta/8",
                    rangeEnd && checkIn && "rounded-r-full bg-terracotta/8",
                    // When both start and end
                    rangeStart &&
                      rangeEnd &&
                      "rounded-full bg-transparent",
                  )}
                >
                  <button
                    type="button"
                    disabled={disabled}
                    onClick={() => handleDayClick(day)}
                    onMouseEnter={() =>
                      !disabled && setHoveredDate(day)
                    }
                    onMouseLeave={() => setHoveredDate(null)}
                    title={
                      status === "full"
                        ? t("nightFull")
                        : status === "closed"
                          ? t("nightClosed")
                          : status === "busy"
                            ? t("nightBusy")
                            : undefined
                    }
                    className={cn(
                      "relative z-10 flex h-9 w-9 items-center justify-center rounded-full text-sm font-medium transition-all duration-150 sm:h-10 sm:w-10",
                      // Default
                      !selected &&
                        !disabled &&
                        "text-deep-blue hover:bg-terracotta/12 hover:text-terracotta",
                      // Today
                      today &&
                        !selected &&
                        "font-bold text-terracotta",
                      // Selected (start or end)
                      selected &&
                        "bg-terracotta text-white shadow-md shadow-terracotta/30 font-bold",
                      // Disabled
                      disabled &&
                        "cursor-not-allowed text-gray-200",
                    )}
                  >
                    {format(day, "d")}
                    {status === "busy" && !selected && (
                      <span className="absolute bottom-0.5 h-1 w-1 rounded-full bg-[#003580]" />
                    )}
                  </button>
                </div>
              );
            }),
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl bg-white shadow-elegant">
      {/* Top bar — check-in, check-out, guests, nights */}
      <div className="border-b border-gray-100 bg-gradient-to-r from-cream to-white px-5 py-4 sm:px-6">
        <div className="flex flex-wrap items-center gap-3 sm:gap-0">
          {/* Check-in display */}
          <button
            type="button"
            onClick={() => setSelecting("checkIn")}
            className={cn(
              "flex-1 min-w-[120px] rounded-xl px-3 py-2.5 text-left transition-all sm:px-4",
              selecting === "checkIn"
                ? "bg-terracotta/8 ring-2 ring-terracotta/30"
                : "hover:bg-gray-50",
            )}
          >
            <span className="text-[10px] font-semibold uppercase tracking-widest text-terracotta/70">
              {t("checkIn")}
            </span>
            <div className="mt-0.5 flex items-center gap-2">
              <CalendarDays className="h-4 w-4 text-terracotta" />
              <span
                className={cn(
                  "text-base font-bold",
                  checkIn ? "text-deep-blue" : "text-gray-300",
                )}
              >
                {checkIn ? format(checkIn, "MMM dd, yyyy") : "Select date"}
              </span>
            </div>
          </button>

          {/* Arrow */}
          <div className="hidden sm:flex items-center px-2">
            <ArrowRight className="h-4 w-4 text-gray-300" />
          </div>

          {/* Check-out display */}
          <button
            type="button"
            onClick={() => setSelecting("checkOut")}
            className={cn(
              "flex-1 min-w-[120px] rounded-xl px-3 py-2.5 text-left transition-all sm:px-4",
              selecting === "checkOut"
                ? "bg-terracotta/8 ring-2 ring-terracotta/30"
                : "hover:bg-gray-50",
            )}
          >
            <span className="text-[10px] font-semibold uppercase tracking-widest text-terracotta/70">
              {t("checkOut")}
            </span>
            <div className="mt-0.5 flex items-center gap-2">
              <CalendarDays className="h-4 w-4 text-terracotta" />
              <span
                className={cn(
                  "text-base font-bold",
                  checkOut ? "text-deep-blue" : "text-gray-300",
                )}
              >
                {checkOut ? format(checkOut, "MMM dd, yyyy") : "Select date"}
              </span>
            </div>
          </button>

          {/* Divider */}
          <div className="hidden sm:flex items-center px-1">
            <div className="h-10 w-px bg-gray-200" />
          </div>

          {/* Guests */}
          <div className="relative min-w-[100px] rounded-xl px-3 py-2.5 hover:bg-gray-50 sm:px-4">
            <span className="text-[10px] font-semibold uppercase tracking-widest text-terracotta/70">
              {t("guests")}
            </span>
            <div className="mt-0.5 flex items-center gap-2">
              <Users className="h-4 w-4 text-terracotta" />
              <select
                value={guests}
                onChange={(e) => onGuestsChange(Number(e.target.value))}
                className="appearance-none bg-transparent text-base font-bold text-deep-blue outline-none cursor-pointer pr-5"
              >
                {[1, 2, 3, 4, 5, 6].map((n) => (
                  <option key={n} value={n}>
                    {n} {n === 1 ? "guest" : "guests"}
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 bottom-3 h-3.5 w-3.5 text-gray-400" />
            </div>
          </div>

          {/* Nights badge */}
          {nights > 0 && (
            <div className="flex items-center gap-1.5 rounded-full bg-terracotta/10 px-3.5 py-2 text-xs font-bold text-terracotta">
              <Moon className="h-3.5 w-3.5" />
              {nights} {nights === 1 ? "night" : "nights"}
            </div>
          )}
        </div>
      </div>

      {/* Calendar grid — always visible */}
      <div className="px-4 py-5 sm:px-8 sm:py-6">
        {/* Month navigation */}
        <div className="mb-4 flex items-center justify-between">
          <button
            type="button"
            onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
            className="flex h-8 w-8 items-center justify-center rounded-full text-gray-400 transition-colors hover:bg-gray-100 hover:text-deep-blue"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>

          <p className="text-xs text-gray-400">
            {selecting === "checkIn"
              ? t("selectCheckIn")
              : t("selectCheckOut")}
          </p>

          <button
            type="button"
            onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
            className="flex h-8 w-8 items-center justify-center rounded-full text-gray-400 transition-colors hover:bg-gray-100 hover:text-deep-blue"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>

        {/* Two-month calendar */}
        <div
          className={cn(
            "flex gap-6 sm:gap-10",
            isMobile ? "flex-col" : "flex-row",
          )}
        >
          {renderMonth(currentMonth, month1Days)}
          {renderMonth(month2, month2Days)}
        </div>
        <p className="mt-4 flex items-center gap-2 text-xs text-gray-500">
          <span className="h-1.5 w-1.5 rounded-full bg-[#003580]" aria-hidden="true" />
          {t("syncNote")}
        </p>
      </div>
    </div>
  );
}
