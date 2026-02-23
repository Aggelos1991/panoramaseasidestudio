"use client";

import { useTranslations } from "next-intl";
import { useSearchParams, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { BookingSteps } from "@/components/booking/booking-steps";
import { DateSelector } from "@/components/booking/date-selector";
import { RoomSelector } from "@/components/booking/room-selector";
import { GuestForm } from "@/components/booking/guest-form";
import { BookingSummary } from "@/components/booking/booking-summary";
import { Button } from "@/components/ui/button";
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

export type GuestDetails = {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  country?: string;
  specialRequests?: string;
};

export default function BookingPage() {
  const t = useTranslations("booking");
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselectedRoom = searchParams.get("room");

  const [step, setStep] = useState(1);
  const [booking, setBooking] = useState<BookingState>({
    checkIn: null,
    checkOut: null,
    guests: 2,
    selectedRoom: null,
    guestDetails: null,
  });
  const [availableRooms, setAvailableRooms] = useState<AvailableRoom[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Check availability when dates change
  useEffect(() => {
    if (booking.checkIn && booking.checkOut) {
      checkAvailability();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [booking.checkIn, booking.checkOut, booking.guests]);

  async function checkAvailability() {
    if (!booking.checkIn || !booking.checkOut) return;
    setLoading(true);
    try {
      const res = await fetch("/api/availability", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          checkIn: booking.checkIn.toISOString(),
          checkOut: booking.checkOut.toISOString(),
          guests: booking.guests,
        }),
      });
      const data = await res.json();
      setAvailableRooms(data.rooms || []);

      // Auto-select preselected room if available
      if (preselectedRoom && !booking.selectedRoom) {
        const matched = (data.rooms || []).find(
          (r: AvailableRoom) => r.slug === preselectedRoom,
        );
        if (matched) {
          setBooking((prev) => ({ ...prev, selectedRoom: matched }));
        }
      }
    } catch {
      setAvailableRooms([]);
    } finally {
      setLoading(false);
    }
  }

  async function handleConfirmBooking() {
    if (!booking.selectedRoom || !booking.guestDetails) return;
    setSubmitting(true);

    try {
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          roomId: booking.selectedRoom.id,
          checkIn: booking.checkIn!.toISOString(),
          checkOut: booking.checkOut!.toISOString(),
          guests: booking.guests,
          nights: booking.selectedRoom.nights,
          totalPrice: booking.selectedRoom.totalPrice,
          ...booking.guestDetails,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to create booking");
      }

      const { referenceNumber } = await res.json();

      // Redirect to success page with reference
      router.push(`/booking/success?ref=${referenceNumber}`);
    } catch {
      setSubmitting(false);
      alert("Something went wrong. Please try again.");
    }
  }

  return (
    <div className="min-h-screen bg-cream pt-24 pb-16">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center">
          <div className="mb-2 flex items-center justify-center gap-3">
            <div className="h-px w-8 bg-gold" />
            <span className="text-sm font-medium uppercase tracking-wider text-terracotta">
              {t("subtitle")}
            </span>
            <div className="h-px w-8 bg-gold" />
          </div>
          <h1 className="font-serif text-3xl font-bold text-deep-blue sm:text-4xl">
            {t("title")}
          </h1>
        </div>

        {/* Steps Indicator */}
        <div className="mt-10">
          <BookingSteps currentStep={step} />
        </div>

        <div className="mt-10">
          {/* Step 1: Dates & Room Selection */}
          {step === 1 && (
            <div className="space-y-8">
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
                  loading={loading}
                  selectedRoom={booking.selectedRoom}
                  onSelect={(room) =>
                    setBooking((prev) => ({ ...prev, selectedRoom: room }))
                  }
                />
              )}

              {booking.selectedRoom && (
                <div className="flex justify-end">
                  <Button size="lg" onClick={() => setStep(2)}>
                    {t("proceedToDetails")}
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* Step 2: Guest Details */}
          {step === 2 && (
            <div className="grid gap-8 lg:grid-cols-3">
              <div className="lg:col-span-2">
                <button
                  onClick={() => setStep(1)}
                  className="mb-6 flex items-center gap-2 text-sm text-gray-500 hover:text-terracotta"
                >
                  <ArrowLeft className="h-4 w-4" /> {t("backToDates")}
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

          {/* Step 3: Review & Confirm */}
          {step === 3 && (
            <div className="mx-auto max-w-2xl">
              <button
                onClick={() => setStep(2)}
                className="mb-6 flex items-center gap-2 text-sm text-gray-500 hover:text-terracotta"
              >
                <ArrowLeft className="h-4 w-4" /> {t("backToRooms")}
              </button>
              <BookingSummary booking={booking} showGuestDetails />
              <div className="mt-8 text-center">
                <Button
                  size="lg"
                  onClick={handleConfirmBooking}
                  isLoading={submitting}
                  className="w-full sm:w-auto"
                >
                  {t("confirmBooking")}
                </Button>
                <p className="mt-3 text-xs text-gray-400">
                  {t("confirmBookingNote")}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
