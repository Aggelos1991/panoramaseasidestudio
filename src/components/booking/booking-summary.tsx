"use client";

import { useLocale, useTranslations } from "next-intl";
import Image from "next/image";
import { format } from "date-fns";
import { de, el, enUS } from "date-fns/locale";
import { CalendarDays, Users, Moon } from "lucide-react";
import type { BookingState } from "@/app/[locale]/booking/page";

type Props = {
  booking: BookingState;
  showGuestDetails?: boolean;
};

export function BookingSummary({ booking, showGuestDetails = false }: Props) {
  const t = useTranslations("booking");
  const locale = useLocale();
  const dateLocale = locale === "el" ? el : locale === "de" ? de : enUS;

  if (!booking.selectedRoom) return null;

  const room = booking.selectedRoom;
  const guest = booking.guestDetails;

  return (
    <div className="glass-card rounded-[28px] p-6">
      <h2 className="font-film text-3xl font-medium leading-none tracking-tight text-[#1c1916]">
        {t("summary")}
      </h2>

      <div className="relative mt-5 aspect-video overflow-hidden rounded-2xl">
        <Image
          src={room.imageUrl}
          alt={room.name}
          fill
          className="object-cover"
          sizes="(min-width: 1024px) 320px, 100vw"
        />
      </div>

      <h3 className="mt-5 font-film text-3xl font-medium leading-none text-[#1c1916]">
        {room.name}
      </h3>

      <dl className="mt-5 space-y-3 border-t border-black/10 pt-4 text-sm">
        <div className="flex items-center justify-between gap-4">
          <dt className="flex items-center gap-2 text-[#1c1916]/60">
            <CalendarDays className="h-4 w-4" aria-hidden="true" />
            {t("checkIn")}
          </dt>
          <dd className="font-medium text-[#1c1916]">
            {booking.checkIn ? format(booking.checkIn, "d MMM yyyy", { locale: dateLocale }) : "—"}
          </dd>
        </div>
        <div className="flex items-center justify-between gap-4">
          <dt className="flex items-center gap-2 text-[#1c1916]/60">
            <CalendarDays className="h-4 w-4" aria-hidden="true" />
            {t("checkOut")}
          </dt>
          <dd className="font-medium text-[#1c1916]">
            {booking.checkOut ? format(booking.checkOut, "d MMM yyyy", { locale: dateLocale }) : "—"}
          </dd>
        </div>
        <div className="flex items-center justify-between gap-4">
          <dt className="flex items-center gap-2 text-[#1c1916]/60">
            <Moon className="h-4 w-4" aria-hidden="true" />
            {t("nights", { count: room.nights })}
          </dt>
        </div>
        <div className="flex items-center justify-between gap-4">
          <dt className="flex items-center gap-2 text-[#1c1916]/60">
            <Users className="h-4 w-4" aria-hidden="true" />
            {t("guests")}
          </dt>
          <dd className="font-medium text-[#1c1916]">{booking.guests}</dd>
        </div>
      </dl>

      {showGuestDetails && guest && (
        <div className="mt-4 space-y-1 border-t border-black/10 pt-4">
          <h3 className="font-sans text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-[#1c1916]/55">
            {t("yourDetails")}
          </h3>
          <p className="pt-2 font-film text-2xl leading-none text-[#1c1916]">
            {guest.firstName} {guest.lastName}
          </p>
          <p className="text-sm text-[#1c1916]/70">{guest.email}</p>
          {guest.phone && <p className="text-sm text-[#1c1916]/70">{guest.phone}</p>}
          {guest.specialRequests && (
            <p className="pt-2 text-sm leading-relaxed text-[#1c1916]/70">{guest.specialRequests}</p>
          )}
        </div>
      )}
    </div>
  );
}
