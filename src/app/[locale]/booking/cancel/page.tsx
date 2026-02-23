"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { XCircle, ArrowLeft } from "lucide-react";

export default function BookingCancelPage() {
  const t = useTranslations("booking");

  return (
    <div className="min-h-screen bg-cream pt-24 pb-16">
      <div className="mx-auto max-w-2xl px-4 text-center sm:px-6">
        <div className="rounded-2xl bg-white p-8 shadow-soft sm:p-12">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-red-100">
            <XCircle className="h-10 w-10 text-red-500" />
          </div>

          <h1 className="mt-6 font-serif text-3xl font-bold text-deep-blue">
            {t("paymentCancelled")}
          </h1>
          <p className="mt-3 text-gray-500">{t("paymentCancelledDesc")}</p>

          <div className="mt-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Link href="/booking">
              <Button size="lg">
                <ArrowLeft className="h-4 w-4" />
                {t("tryAgain")}
              </Button>
            </Link>
            <Link href="/">
              <Button size="lg" variant="outline">
                {t("backToHome")}
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
