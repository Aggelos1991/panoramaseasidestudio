"use client";

import { useTranslations } from "next-intl";
import Image from "next/image";
import { format } from "date-fns";
import { CalendarDays, Users, Moon, Receipt } from "lucide-react";
import type { BookingState } from "@/app/[locale]/booking/page";

type Props = {
  booking: BookingState;
  showGuestDetails?: boolean;
};

export function BookingSummary({ booking, showGuestDetails = false }: Props) {
  const t = useTranslations("booking");

  if (!booking.selectedRoom) return null;

  const room = booking.selectedRoom;

  return (
    <div className="rounded-2xl bg-white p-6 shadow-soft">
      <h3 className="mb-5 font-serif text-lg font-semibold text-deep-blue">
        {t("summary")}
      </h3>

      {/* Room Image */}
      <div className="relative aspect-video overflow-hidden rounded-xl">
        <Image
          src={room.imageUrl}
          alt={room.name}
          fill
          className="object-cover"
          sizes="400px"
        />
      </div>

      {/* Room Name */}
      <h4 className="mt-4 font-serif text-lg font-semibold text-deep-blue">
        {room.name}
      </h4>

      {/* Details */}
      <div className="mt-4 space-y-3 border-t border-sandy pt-4">
        <div className="flex items-center justify-between text-sm">
          <span className="flex items-center gap-2 text-gray-500">
            <CalendarDays className="h-4 w-4" />
            {t("checkIn")}
          </span>
          <span className="font-medium text-deep-blue">
            {booking.checkIn ? format(booking.checkIn, "MMM dd, yyyy") : "—"}
          </span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="flex items-center gap-2 text-gray-500">
            <CalendarDays className="h-4 w-4" />
            {t("checkOut")}
          </span>
          <span className="font-medium text-deep-blue">
            {booking.checkOut ? format(booking.checkOut, "MMM dd, yyyy") : "—"}
          </span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="flex items-center gap-2 text-gray-500">
            <Moon className="h-4 w-4" />
            {t("nights", { count: room.nights })}
          </span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="flex items-center gap-2 text-gray-500">
            <Users className="h-4 w-4" />
            {t("guests")}
          </span>
          <span className="font-medium text-deep-blue">{booking.guests}</span>
        </div>
      </div>

      {/* Guest Details */}
      {showGuestDetails && booking.guestDetails && (
        <div className="mt-4 space-y-2 border-t border-sandy pt-4">
          <h5 className="text-sm font-medium text-gray-500">
            {t("step3")}
          </h5>
          <p className="text-sm text-deep-blue">
            {booking.guestDetails.firstName} {booking.guestDetails.lastName}
          </p>
          <p className="text-sm text-gray-500">{booking.guestDetails.email}</p>
          {booking.guestDetails.phone && (
            <p className="text-sm text-gray-500">{booking.guestDetails.phone}</p>
          )}
        </div>
      )}

      {/* Price */}
      <div className="mt-4 border-t border-sandy pt-4">
        <div className="flex items-center justify-between text-sm text-gray-500">
          <span>
            &euro;{room.pricePerNight} &times; {room.nights}{" "}
            {t("nights", { count: room.nights }).toLowerCase()}
          </span>
        </div>
        <div className="mt-3 flex items-center justify-between">
          <span className="flex items-center gap-2 font-semibold text-deep-blue">
            <Receipt className="h-4 w-4" />
            {t("totalPrice")}
          </span>
          <span className="text-2xl font-bold text-terracotta">
            &euro;{room.totalPrice}
          </span>
        </div>
      </div>
    </div>
  );
}
