import { getTranslations } from "next-intl/server";
import { prisma } from "@/lib/prisma";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { CheckCircle, Calendar, Home as HomeIcon } from "lucide-react";
import { format } from "date-fns";

type Props = {
  searchParams: Promise<{ ref?: string }>;
};

export default async function BookingSuccessPage({ searchParams }: Props) {
  const t = await getTranslations("booking");
  const { ref } = await searchParams;

  let booking = null;
  if (ref) {
    try {
      booking = await prisma.booking.findUnique({
        where: { referenceNumber: ref },
        include: { room: true },
      });
    } catch {
      // DB not available
    }
  }

  return (
    <div className="min-h-screen bg-cream pt-24 pb-16">
      <div className="mx-auto max-w-2xl px-4 text-center sm:px-6">
        <div className="rounded-2xl bg-white p-8 shadow-soft sm:p-12">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-green-100">
            <CheckCircle className="h-10 w-10 text-green-600" />
          </div>

          <h1 className="mt-6 font-serif text-3xl font-bold text-deep-blue">
            {t("confirmationTitle")}
          </h1>
          <p className="mt-2 text-gray-500">{t("confirmationSubtitle")}</p>

          {booking && (
            <div className="mt-8 space-y-4 rounded-xl bg-sandy-light p-6 text-left">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">
                  {t("referenceNumber")}
                </span>
                <span className="font-mono text-lg font-bold text-terracotta">
                  {booking.referenceNumber}
                </span>
              </div>
              <hr className="border-sandy-dark" />
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">Room</span>
                <span className="font-medium text-deep-blue">
                  {booking.room.nameEn}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">{t("checkIn")}</span>
                <span className="flex items-center gap-2 font-medium text-deep-blue">
                  <Calendar className="h-4 w-4" />
                  {format(new Date(booking.checkIn), "MMM dd, yyyy")}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">{t("checkOut")}</span>
                <span className="flex items-center gap-2 font-medium text-deep-blue">
                  <Calendar className="h-4 w-4" />
                  {format(new Date(booking.checkOut), "MMM dd, yyyy")}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">
                  {t("totalPrice")}
                </span>
                <span className="text-xl font-bold text-terracotta">
                  &euro;{Number(booking.totalPrice)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">Status</span>
                <span className="rounded-full bg-yellow-100 px-3 py-1 text-xs font-semibold text-yellow-700">
                  {booking.status}
                </span>
              </div>
            </div>
          )}

          {!booking && ref && (
            <div className="mt-8 rounded-xl bg-sandy-light p-6 text-left">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">
                  {t("referenceNumber")}
                </span>
                <span className="font-mono text-lg font-bold text-terracotta">
                  {ref}
                </span>
              </div>
              <p className="mt-4 text-sm text-gray-500">
                {t("confirmationNote")}
              </p>
            </div>
          )}

          {booking && (
            <p className="mt-6 text-sm text-gray-500">
              {t("confirmationEmail", { email: booking.guestEmail })}
            </p>
          )}

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
  );
}
