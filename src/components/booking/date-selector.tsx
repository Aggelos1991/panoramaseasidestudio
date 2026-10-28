"use client";

import { useEffect, useState, useMemo } from "react";
import { useLocale, useTranslations } from "next-intl";
import { de, el, enUS } from "date-fns/locale";
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
  const locale = useLocale();
  const dateLocale = locale === "el" ? el : locale === "de" ? de : enUS;
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

  const dayNames = useMemo(() => {
    const start = startOfWeek(new Date(2026, 0, 4), { weekStartsOn: 0 });
    return Array.from({ length: 7 }, (_, index) =>
      format(addDays(start, index), "EEEEEE", { locale: dateLocale }),
    );
  }, [dateLocale]);

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
          <h3 className="font-film text-2xl font-medium tracking-tight text-[#1c1916]">
            {format(monthDate, "MMMM yyyy", { locale: dateLocale })}
          </h3>
        </div>

        {/* Day names */}
        <div className="mb-1 grid grid-cols-7">
          {dayNames.map((name, index) => (
            <div
              key={`${name}-${index}`}
              className="py-1.5 text-center text-[11px] font-semibold uppercase tracking-wider text-[#1c1916]/45"
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
                    inRange && "bg-[#1c1916]/8",
                    rangeStart && checkOut && "rounded-l-full bg-[#1c1916]/8",
                    rangeEnd && checkIn && "rounded-r-full bg-[#1c1916]/8",
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
                        "text-[#1c1916] hover:bg-black/6",
                      today && !selected && "font-semibold ring-1 ring-[#1c1916]/35",
                      selected && "bg-[#1c1916] font-semibold text-[#f3efe8]",
                      disabled && "cursor-not-allowed text-[#1c1916]/20",
                    )}
                  >
                    {format(day, "d")}
                    {status === "busy" && !selected && (
                      <span className="absolute bottom-0.5 h-1 w-1 rounded-full bg-[#8a6232]" />
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
    <div className="glass-card overflow-hidden rounded-[28px]">
      <div className="border-b border-black/10 bg-white/35 px-5 py-4 sm:px-6">
        <div className="flex flex-wrap items-center gap-3 sm:gap-0">
          {/* Check-in display */}
          <button
            type="button"
            onClick={() => setSelecting("checkIn")}
            className={cn(
              "flex-1 min-w-[120px] rounded-xl px-3 py-2.5 text-left transition-all sm:px-4",
              selecting === "checkIn"
                ? "bg-white/70 ring-2 ring-[#1c1916]/20"
                : "hover:bg-white/50",
            )}
          >
            <span className="font-sans text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-[#1c1916]/55">
              {t("checkIn")}
            </span>
            <div className="mt-0.5 flex items-center gap-2">
              <CalendarDays className="h-4 w-4 text-[#1c1916]" aria-hidden="true" />
              <span
                className={cn(
                  "text-base font-medium",
                  checkIn ? "text-[#1c1916]" : "text-[#1c1916]/28",
                )}
              >
                {checkIn
                  ? format(checkIn, "d MMM yyyy", { locale: dateLocale })
                  : t("selectDate")}
              </span>
            </div>
          </button>

          <div className="hidden items-center px-2 sm:flex">
            <ArrowRight className="h-4 w-4 text-[#1c1916]/28" aria-hidden="true" />
          </div>

          {/* Check-out display */}
          <button
            type="button"
            onClick={() => setSelecting("checkOut")}
            className={cn(
              "flex-1 min-w-[120px] rounded-xl px-3 py-2.5 text-left transition-all sm:px-4",
              selecting === "checkOut"
                ? "bg-white/70 ring-2 ring-[#1c1916]/20"
                : "hover:bg-white/50",
            )}
          >
            <span className="font-sans text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-[#1c1916]/55">
              {t("checkOut")}
            </span>
            <div className="mt-0.5 flex items-center gap-2">
              <CalendarDays className="h-4 w-4 text-[#1c1916]" aria-hidden="true" />
              <span
                className={cn(
                  "text-base font-medium",
                  checkOut ? "text-[#1c1916]" : "text-[#1c1916]/28",
                )}
              >
                {checkOut
                  ? format(checkOut, "d MMM yyyy", { locale: dateLocale })
                  : t("selectDate")}
              </span>
            </div>
          </button>

          <div className="hidden items-center px-1 sm:flex">
            <div className="h-10 w-px bg-black/10" />
          </div>

          <div className="relative min-w-[100px] rounded-xl px-3 py-2.5 hover:bg-white/50 sm:px-4">
            <span className="font-sans text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-[#1c1916]/55">
              {t("guests")}
            </span>
            <div className="mt-0.5 flex items-center gap-2">
              <Users className="h-4 w-4 text-[#1c1916]" aria-hidden="true" />
              <select
                value={guests}
                onChange={(e) => onGuestsChange(Number(e.target.value))}
                aria-label={t("guests")}
                className="cursor-pointer appearance-none bg-transparent pr-5 text-base font-medium text-[#1c1916] outline-none"
              >
                {[1, 2].map((n) => (
                  <option key={n} value={n}>
                    {t("guestCount", { count: n })}
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute bottom-3 right-3 h-3.5 w-3.5 text-[#1c1916]/45" aria-hidden="true" />
            </div>
          </div>

          {nights > 0 && (
            <div className="flex items-center gap-1.5 rounded-full bg-[#1c1916] px-3.5 py-2 text-xs font-medium text-[#f3efe8]">
              <Moon className="h-3.5 w-3.5" aria-hidden="true" />
              {t("nights", { count: nights })}
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
            className="flex h-8 w-8 items-center justify-center rounded-full text-[#1c1916]/45 transition-colors hover:bg-black/5 hover:text-[#1c1916]"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>

          <p className="text-xs text-[#1c1916]/55">
            {selecting === "checkIn"
              ? t("selectCheckIn")
              : t("selectCheckOut")}
          </p>

          <button
            type="button"
            onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
            className="flex h-8 w-8 items-center justify-center rounded-full text-[#1c1916]/45 transition-colors hover:bg-black/5 hover:text-[#1c1916]"
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
        <p className="mt-4 flex items-center gap-2 text-xs text-[#1c1916]/60">
          <span className="h-1.5 w-1.5 rounded-full bg-[#8a6232]" aria-hidden="true" />
          {t("syncNote")}
        </p>
      </div>
    </div>
  );
}
