"use client";

import { useLocale, useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { Link } from "@/i18n/navigation";
import { useState, useEffect, useRef } from "react";
import { differenceInDays, format, parseISO } from "date-fns";
import { LISTING_ROOMS } from "@/lib/listing";
import { isInClosedSeason } from "@/lib/closed-season";
import { getLocalizedField } from "@/lib/utils";
import { BookingSteps } from "@/components/booking/booking-steps";
import { DateSelector } from "@/components/booking/date-selector";
import { RoomSelector } from "@/components/booking/room-selector";
import { GuestForm } from "@/components/booking/guest-form";
import { BookingSummary } from "@/components/booking/booking-summary";
import { ArrowLeft } from "lucide-react";

export type BookingState = {
  checkIn: Date | null;
  checkOut: Date | null;
  guests: number;
  selectedRoom: AvailableRoom | null;
  guestDetails: GuestDetails | null;
};

export type AvailableRoom = {
  id: string;
  slug: string;
  name: string;
  capacity: number;
  sizeSqm: number;
  bedType: string;
  pricePerNight: number;
  totalPrice: number;
  nights: number;
  imageUrl: string;
  amenities: string[];
};

function parseQueryDate(value: string | null): Date | null {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const date = parseISO(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

export type GuestDetails = {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  country?: string;
  specialRequests?: string;
  dateOfBirth?: string;
  pets?: boolean;
};

function roomsFromListing(locale: string, nights: number, guests: number): AvailableRoom[] {
  const party = Number(guests) || 1;
  if (party > 2) return [];
  return LISTING_ROOMS.filter((room) => room.capacity >= party).map((room) => ({
    id: room.slug,
    slug: room.slug,
    name: getLocalizedField(room, "name", locale),
    capacity: room.capacity,
    sizeSqm: room.sizeSqm,
    bedType: room.bedType,
    pricePerNight: room.basePrice,
    totalPrice: room.basePrice * nights,
    nights,
    imageUrl: room.image,
    amenities: room.amenities,
  }));
}

function roomsForStay(
  locale: string,
  checkIn: Date | null,
  checkOut: Date | null,
  guests: number,
): AvailableRoom[] {
  if (!checkIn || !checkOut || checkOut <= checkIn) return [];
  if (isInClosedSeason(checkIn, checkOut)) return [];
  return roomsFromListing(locale, differenceInDays(checkOut, checkIn), guests);
}

const inkButton =
  "inline-flex h-12 items-center justify-center bg-[#1c1916] px-6 font-sans text-sm font-semibold tracking-wide text-[#f3efe8] disabled:cursor-not-allowed disabled:opacity-50";

const backLink =
  "mb-6 flex items-center gap-2 text-sm text-[#1c1916]/60 transition-colors hover:text-[#1c1916]";

export default function BookingPage() {
  const t = useTranslations("booking");
  const locale = useLocale();
  const searchParams = useSearchParams();
  const preselectedRoom = searchParams.get("room");
  const initialCheckIn = parseQueryDate(searchParams.get("checkIn"));
  const initialCheckOut = parseQueryDate(searchParams.get("checkOut"));
  const initialGuests = Number(searchParams.get("guests"));

  const validCheckOut =
    initialCheckIn && initialCheckOut && initialCheckOut > initialCheckIn
      ? initialCheckOut
      : null;
  const validGuests = initialGuests >= 1 && initialGuests <= 2 ? initialGuests : 2;

  const [step, setStep] = useState(1);
  const [booking, setBooking] = useState<BookingState>({
    checkIn: initialCheckIn,
    checkOut: validCheckOut,
    guests: validGuests,
    selectedRoom: null,
    guestDetails: null,
  });
  const [availableRooms, setAvailableRooms] = useState<AvailableRoom[]>(() =>
    roomsForStay(locale, initialCheckIn, validCheckOut, validGuests),
  );
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [payOptions, setPayOptions] = useState<{
    card: boolean;
    wallets: boolean;
    paypal: boolean;
    btcpay: boolean;
  } | null>(null);
  const [payMethod, setPayMethod] = useState<"stripe" | "btcpay">("stripe");
  const [payError, setPayError] = useState("");
  const skipScroll = useRef(true);

  useEffect(() => {
    if (skipScroll.current) {
      skipScroll.current = false;
      return;
    }
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    window.scrollTo({ top: 0, behavior: reduce ? "auto" : "smooth" });
  }, [step]);

  useEffect(() => {
    if (step === 3 && !payOptions) {
      fetch("/api/payment-methods")
        .then((r) => r.json())
        .then(setPayOptions)
        .catch(() =>
          setPayOptions({ card: false, wallets: false, paypal: false, btcpay: false }),
        );
    }
  }, [step, payOptions]);

  useEffect(() => {
    if (!payOptions) return;
    if (!payOptions.card && payOptions.btcpay) setPayMethod("btcpay");
  }, [payOptions]);

  useEffect(() => {
    if (booking.checkIn && booking.checkOut) {
      checkAvailability();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [booking.checkIn, booking.checkOut, booking.guests]);

  async function checkAvailability() {
    if (!booking.checkIn || !booking.checkOut) return;
    setLoading(true);
    const fallback = roomsForStay(locale, booking.checkIn, booking.checkOut, booking.guests);
    try {
      const res = await fetch("/api/availability", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          checkIn: format(booking.checkIn, "yyyy-MM-dd"),
          checkOut: format(booking.checkOut, "yyyy-MM-dd"),
          guests: booking.guests,
          locale,
        }),
      });
      const data = await res.json().catch(() => null);
      const rooms: AvailableRoom[] = res.ok ? data?.rooms || [] : fallback;
      setAvailableRooms(rooms);

      if (preselectedRoom) {
        const matched = rooms.find((room) => room.slug === preselectedRoom);
        if (matched) {
          setBooking((prev) => (prev.selectedRoom ? prev : { ...prev, selectedRoom: matched }));
        }
      }
    } catch {
      setAvailableRooms(fallback);
    } finally {
      setLoading(false);
    }
  }

  async function handleConfirmBooking() {
    if (!booking.selectedRoom || !booking.guestDetails || !booking.checkIn || !booking.checkOut) return;
    if (payMethod !== "btcpay" && payOptions && !payOptions.card) {
      setStep(4);
      return;
    }
    if (payMethod === "btcpay" && !payOptions?.btcpay) {
      setPayError(t("cardUnavailable"));
      return;
    }
    setPayError("");
    setSubmitting(true);

    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          roomId: booking.selectedRoom.id,
          checkIn: format(booking.checkIn, "yyyy-MM-dd"),
          checkOut: format(booking.checkOut, "yyyy-MM-dd"),
          guests: booking.guests,
          paymentMethod: payMethod === "btcpay" ? "btcpay" : "card",
          locale,
          ...booking.guestDetails,
          pets: false,
        }),
      });

      const data = await res.json().catch(() => null);
      if (res.ok && typeof data?.url === "string" && data.url) {
        window.location.href = data.url;
        return;
      }
      setStep(4);
    } catch {
      setStep(4);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#f3efe8] px-4 pb-24 pt-28 text-[#1c1916] sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        {step < 4 && (
          <>
            <header className="text-center">
              <p className="font-sans text-[0.72rem] font-medium uppercase tracking-[0.22em] text-[#1c1916]/70">
                {t("subtitle")}
              </p>
              <h1 className="font-film mt-3 text-4xl font-medium leading-none tracking-tight sm:text-6xl">
                {t("title")}
              </h1>
            </header>
            <div className="mt-10">
              <BookingSteps currentStep={step} />
            </div>
          </>
        )}

        <div className="mt-10">
          {step === 1 && (
            <div className="space-y-10">
              <DateSelector
                checkIn={booking.checkIn}
                checkOut={booking.checkOut}
                guests={booking.guests}
                onCheckInChange={(date) =>
                  setBooking((prev) => ({
                    ...prev,
                    checkIn: date,
                    selectedRoom: null,
                  }))
                }
                onCheckOutChange={(date) =>
                  setBooking((prev) => ({
                    ...prev,
                    checkOut: date,
                    selectedRoom: null,
                  }))
                }
                onGuestsChange={(guests) =>
                  setBooking((prev) => ({
                    ...prev,
                    guests,
                    selectedRoom: null,
                  }))
                }
              />

              {booking.checkIn && booking.checkOut && (
                <RoomSelector
                  rooms={availableRooms}
                  loading={loading && availableRooms.length === 0}
                  selectedRoom={booking.selectedRoom}
                  onSelect={(room) =>
                    setBooking((prev) => ({ ...prev, selectedRoom: room }))
                  }
                />
              )}

              {booking.selectedRoom && (
                <div className="glass-card sticky bottom-6 z-30 flex items-center justify-between gap-4 rounded-[28px] px-5 py-4">
                  <p className="min-w-0 truncate font-film text-2xl leading-none sm:text-3xl">
                    {booking.selectedRoom.name}
                  </p>
                  <button type="button" onClick={() => setStep(2)} className={`${inkButton} shrink-0`}>
                    {t("proceedToDetails")}
                  </button>
                </div>
              )}
            </div>
          )}

          {step === 2 && (
            <div className="grid gap-8 lg:grid-cols-3">
              <div className="lg:col-span-2">
                <button type="button" onClick={() => setStep(1)} className={backLink}>
                  <ArrowLeft className="h-4 w-4" aria-hidden="true" /> {t("backToStay")}
                </button>
                <GuestForm
                  onSubmit={(details) => {
                    setBooking((prev) => ({ ...prev, guestDetails: details }));
                    setStep(3);
                  }}
                />
              </div>
              <div>
                <BookingSummary booking={booking} />
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="mx-auto max-w-2xl">
              <button type="button" onClick={() => setStep(2)} className={backLink}>
                <ArrowLeft className="h-4 w-4" aria-hidden="true" /> {t("backToDetails")}
              </button>
              <BookingSummary booking={booking} showGuestDetails />

              <div className="mt-8">
                <h2 className="font-film text-3xl font-medium leading-none text-[#1c1916]">
                  {t("paymentMethod")}
                </h2>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  {payOptions?.card && (
                  <button
                    type="button"
                    onClick={() => setPayMethod("stripe")}
                    className={`rounded-2xl border p-4 text-left transition-colors ${
                      payMethod === "stripe"
                        ? "border-[#1c1916] bg-white/70"
                        : "border-black/10 bg-white/40 hover:border-black/25"
                    }`}
                  >
                    <span className="block font-medium text-[#1c1916]">{t("payCardTitle")}</span>
                    <span className="mt-1 block text-xs text-[#1c1916]/60">
                      Visa · Mastercard · Apple Pay · Google Pay
                      {payOptions?.paypal ? " · PayPal" : ""}
                    </span>
                  </button>
                  )}
                  {payOptions?.btcpay && (
                    <button
                      type="button"
                      onClick={() => setPayMethod("btcpay")}
                      className={`rounded-2xl border p-4 text-left transition-colors ${
                        payMethod === "btcpay"
                          ? "border-[#1c1916] bg-white/70"
                          : "border-black/10 bg-white/40 hover:border-black/25"
                      }`}
                    >
                      <span className="block font-medium text-[#1c1916]">{t("payBtcTitle")}</span>
                      <span className="mt-1 block text-xs text-[#1c1916]/60">{t("payBtcDesc")}</span>
                    </button>
                  )}
                </div>
                {payOptions && !payOptions.card && (
                  <p className="mt-3 text-sm text-[#1c1916]/70">{t("cardUnavailable")}</p>
                )}
                {payError && <p className="mt-3 text-sm text-red-700">{payError}</p>}
              </div>

              <div className="mt-8">
                <button
                  type="button"
                  onClick={handleConfirmBooking}
                  disabled={submitting}
                  className={`${inkButton} w-full sm:w-auto`}
                >
                  {submitting ? t("confirming") : t("confirmStay")}
                </button>
                <p className="mt-3 max-w-md text-xs leading-relaxed text-[#1c1916]/55">
                  {t("confirmStayNote")}
                </p>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="mx-auto max-w-2xl">
              <p className="font-sans text-[0.72rem] font-medium uppercase tracking-[0.22em] text-[#1c1916]/70">
                {t("flowRequest")}
              </p>
              <h1 className="font-film mt-3 text-4xl font-medium leading-[0.96] tracking-tight sm:text-6xl">
                {t("requestReceivedTitle")}
              </h1>
              <p className="mt-5 max-w-md text-base leading-relaxed text-[#1c1916]">
                {t("requestReceivedLead")}
              </p>
              <p className="mt-3 max-w-md text-sm leading-relaxed text-[#1c1916]/70">
                {t("requestReceivedNote")}
              </p>
              <div className="mt-8">
                <BookingSummary booking={booking} showGuestDetails />
              </div>
              <div className="mt-8 flex flex-wrap items-center gap-5">
                <Link href="/" className={inkButton}>
                  {t("backToHome")}
                </Link>
                <button type="button" onClick={() => setStep(3)} className="text-sm font-medium text-[#1c1916]/70">
                  {t("backToReview")}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
