import { getTranslations } from "next-intl/server";
import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import {
  CheckCircle,
  Calendar,
  Home as HomeIcon,
  CreditCard,
  MapPin,
  Moon,
  Users,
  Sparkles,
} from "lucide-react";
import { format, differenceInCalendarDays } from "date-fns";
import Image from "next/image";

type Props = {
  searchParams: Promise<{ ref?: string; session_id?: string }>;
};

export default async function BookingSuccessPage({ searchParams }: Props) {
  const t = await getTranslations("booking");
  const { ref, session_id } = await searchParams;

  let booking = null;
  let paymentConfirmed = false;
  let roomImage: string | null = null;

  // Look up booking by reference number
  if (ref) {
    try {
      booking = await prisma.booking.findUnique({
        where: { referenceNumber: ref },
        include: {
          room: {
            include: {
              images: { take: 1, orderBy: { sortOrder: "asc" } },
            },
          },
        },
      });
      if (booking?.room?.images?.[0]) {
        roomImage = booking.room.images[0].url;
      }
    } catch {
      // DB not available
    }
  }

  // If we have a Stripe session, confirm payment and update booking
  if (session_id && booking) {
    try {
      const session = await stripe.checkout.sessions.retrieve(session_id);
      if (session.payment_status === "paid") {
        paymentConfirmed = true;
        // Update booking if still pending
        if (booking.status !== "CONFIRMED") {
          await prisma.booking.update({
            where: { id: booking.id },
            data: {
              status: "CONFIRMED",
              paymentStatus: "PAID",
              paymentMethod: "stripe",
              stripePaymentId: session.payment_intent as string,
            },
          });
          booking = await prisma.booking.findUnique({
            where: { id: booking.id },
            include: {
              room: {
                include: {
                  images: { take: 1, orderBy: { sortOrder: "asc" } },
                },
              },
            },
          });
        } else if (booking.paymentStatus === "PAID") {
          paymentConfirmed = true;
        }
      }
    } catch {
      // Stripe session retrieval failed — still show booking info
    }
  } else if (booking?.paymentStatus === "PAID") {
    paymentConfirmed = true;
  }

  const nights = booking
    ? differenceInCalendarDays(
        new Date(booking.checkOut),
        new Date(booking.checkIn),
      )
    : 0;

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50 via-cream to-cream pt-20 pb-16">
      {/* Decorative top accent */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-72 overflow-hidden">
        <div className="absolute -top-40 left-1/2 h-80 w-[600px] -translate-x-1/2 rounded-full bg-gradient-to-br from-emerald-200/40 to-teal-100/30 blur-3xl" />
        <div className="absolute -top-20 left-1/4 h-60 w-60 rounded-full bg-gradient-to-br from-sky-200/30 to-blue-100/20 blur-3xl" />
        <div className="absolute -top-20 right-1/4 h-60 w-60 rounded-full bg-gradient-to-br from-amber-200/30 to-orange-100/20 blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-2xl px-4 sm:px-6">
        {/* Success Card */}
        <div className="overflow-hidden rounded-3xl bg-white shadow-xl">
          {/* Room Image Banner */}
          {roomImage && (
            <div className="relative h-48 sm:h-56">
              <Image
                src={roomImage}
                alt={booking?.room?.nameEn || "Room"}
                fill
                className="object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
              <div className="absolute bottom-4 left-6 right-6">
                <p className="text-sm font-medium text-white/80">Your room</p>
                <h2 className="text-xl font-bold text-white">
                  {booking?.room?.nameEn}
                </h2>
              </div>
            </div>
          )}

          <div className="p-8 text-center sm:p-10">
            {/* Success Icon */}
            <div className="relative mx-auto w-fit">
              <div className="absolute -inset-3 animate-pulse rounded-full bg-emerald-100/80" />
              <div className="relative mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 shadow-lg shadow-emerald-200">
                <CheckCircle className="h-10 w-10 text-white" />
              </div>
            </div>

            <h1 className="mt-6 font-serif text-3xl font-bold text-deep-blue">
              {t("confirmationTitle")}
            </h1>
            <p className="mt-2 text-gray-500">{t("confirmationSubtitle")}</p>

            {/* Payment Badge */}
            {paymentConfirmed && (
              <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-emerald-200/50">
                <CreditCard className="h-4 w-4" />
                {t("paymentSuccessful")}
                <Sparkles className="h-4 w-4" />
              </div>
            )}

            {booking && (
              <>
                {/* Reference Number */}
                <div className="mt-8 rounded-2xl bg-gradient-to-r from-deep-blue to-deep-blue-light p-5 text-center">
                  <p className="text-xs font-medium uppercase tracking-wider text-white/60">
                    {t("referenceNumber")}
                  </p>
                  <p className="mt-1 font-mono text-2xl font-bold tracking-widest text-white">
                    {booking.referenceNumber}
                  </p>
                </div>

                {/* Booking Details Grid */}
                <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
                  <div className="rounded-2xl bg-sky-50 p-4">
                    <Calendar className="mx-auto h-5 w-5 text-sky-500" />
                    <p className="mt-2 text-[10px] font-medium uppercase text-sky-400">
                      {t("checkIn")}
                    </p>
                    <p className="mt-0.5 text-sm font-bold text-sky-700">
                      {format(new Date(booking.checkIn), "MMM dd")}
                    </p>
                    <p className="text-[11px] text-sky-400">
                      {format(new Date(booking.checkIn), "yyyy")}
                    </p>
                  </div>
                  <div className="rounded-2xl bg-violet-50 p-4">
                    <Calendar className="mx-auto h-5 w-5 text-violet-500" />
                    <p className="mt-2 text-[10px] font-medium uppercase text-violet-400">
                      {t("checkOut")}
                    </p>
                    <p className="mt-0.5 text-sm font-bold text-violet-700">
                      {format(new Date(booking.checkOut), "MMM dd")}
                    </p>
                    <p className="text-[11px] text-violet-400">
                      {format(new Date(booking.checkOut), "yyyy")}
                    </p>
                  </div>
                  <div className="rounded-2xl bg-amber-50 p-4">
                    <Moon className="mx-auto h-5 w-5 text-amber-500" />
                    <p className="mt-2 text-[10px] font-medium uppercase text-amber-400">
                      Nights
                    </p>
                    <p className="mt-0.5 text-sm font-bold text-amber-700">
                      {nights}
                    </p>
                    <p className="text-[11px] text-amber-400">
                      night{nights !== 1 ? "s" : ""}
                    </p>
                  </div>
                  <div className="rounded-2xl bg-emerald-50 p-4">
                    <CreditCard className="mx-auto h-5 w-5 text-emerald-500" />
                    <p className="mt-2 text-[10px] font-medium uppercase text-emerald-400">
                      {t("totalPrice")}
                    </p>
                    <p className="mt-0.5 text-sm font-bold text-emerald-700">
                      &euro;{Number(booking.totalPrice)}
                    </p>
                    <p className="text-[11px] text-emerald-400">
                      {paymentConfirmed ? "Paid" : "Pending"}
                    </p>
                  </div>
                </div>

                {/* Location Info */}
                {!roomImage && (
                  <div className="mt-4 rounded-2xl border border-gray-100 p-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-500">Room</span>
                      <span className="font-medium text-deep-blue">
                        {booking.room.nameEn}
                      </span>
                    </div>
                  </div>
                )}

                <div className="mt-4 flex items-center justify-center gap-2 text-sm text-gray-400">
                  <MapPin className="h-4 w-4" />
                  <span>Panorama Seaside Studios · Kos, Greece</span>
                </div>
              </>
            )}

            {!booking && ref && (
              <div className="mt-8">
                <div className="rounded-2xl bg-gradient-to-r from-deep-blue to-deep-blue-light p-5 text-center">
                  <p className="text-xs font-medium uppercase tracking-wider text-white/60">
                    {t("referenceNumber")}
                  </p>
                  <p className="mt-1 font-mono text-2xl font-bold tracking-widest text-white">
                    {ref}
                  </p>
                </div>
                <p className="mt-4 text-sm text-gray-500">
                  {t("confirmationNote")}
                </p>
              </div>
            )}

            {/* CTA */}
            <div className="mt-8">
              <Link href="/">
                <Button variant="outline" size="lg">
                  <HomeIcon className="h-4 w-4" />
                  {t("backToHome")}
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
