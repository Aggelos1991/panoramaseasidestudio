"use client";

import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { guestDetailsSchema, type GuestDetailsData } from "@/lib/validators";
import { Button } from "@/components/ui/button";
import type { GuestDetails } from "@/app/[locale]/booking/page";
import { useState } from "react";

type Props = {
  onSubmit: (details: GuestDetails) => void;
};

export function GuestForm({ onSubmit }: Props) {
  const t = useTranslations("booking");
  const [gdprConsent, setGdprConsent] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<GuestDetailsData>({
    resolver: zodResolver(guestDetailsSchema),
  });

  function onFormSubmit(data: GuestDetailsData) {
    if (!gdprConsent) return;
    onSubmit(data);
  }

  return (
    <div className="rounded-2xl bg-white p-6 shadow-soft sm:p-8">
      <h3 className="mb-6 font-serif text-xl font-semibold text-deep-blue">
        {t("step3")}
      </h3>

      <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-5">
        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">
              {t("firstName")} *
            </label>
            <input
              {...register("firstName")}
              className="w-full rounded-lg border border-sandy-dark bg-white px-4 py-2.5 text-sm transition-colors focus:border-terracotta focus:outline-none focus:ring-2 focus:ring-terracotta/20"
            />
            {errors.firstName && (
              <p className="mt-1 text-xs text-red-500">
                {errors.firstName.message}
              </p>
            )}
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">
              {t("lastName")} *
            </label>
            <input
              {...register("lastName")}
              className="w-full rounded-lg border border-sandy-dark bg-white px-4 py-2.5 text-sm transition-colors focus:border-terracotta focus:outline-none focus:ring-2 focus:ring-terracotta/20"
            />
            {errors.lastName && (
              <p className="mt-1 text-xs text-red-500">
                {errors.lastName.message}
              </p>
            )}
          </div>
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700">
            {t("email")} *
          </label>
          <input
            {...register("email")}
            type="email"
            className="w-full rounded-lg border border-sandy-dark bg-white px-4 py-2.5 text-sm transition-colors focus:border-terracotta focus:outline-none focus:ring-2 focus:ring-terracotta/20"
          />
          {errors.email && (
            <p className="mt-1 text-xs text-red-500">{errors.email.message}</p>
          )}
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">
              {t("phone")}
            </label>
            <input
              {...register("phone")}
              type="tel"
              className="w-full rounded-lg border border-sandy-dark bg-white px-4 py-2.5 text-sm transition-colors focus:border-terracotta focus:outline-none focus:ring-2 focus:ring-terracotta/20"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">
              {t("country")}
            </label>
            <input
              {...register("country")}
              className="w-full rounded-lg border border-sandy-dark bg-white px-4 py-2.5 text-sm transition-colors focus:border-terracotta focus:outline-none focus:ring-2 focus:ring-terracotta/20"
            />
          </div>
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700">
            {t("specialRequests")}
          </label>
          <textarea
            {...register("specialRequests")}
            rows={3}
            placeholder={t("specialRequestsPlaceholder")}
            className="w-full resize-none rounded-lg border border-sandy-dark bg-white px-4 py-2.5 text-sm transition-colors focus:border-terracotta focus:outline-none focus:ring-2 focus:ring-terracotta/20"
          />
        </div>

        {/* GDPR Consent */}
        <div className="rounded-lg border border-sandy-dark bg-sandy-light/50 p-4">
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={gdprConsent}
              onChange={(e) => setGdprConsent(e.target.checked)}
              className="mt-0.5 h-4 w-4 rounded border-gray-300 text-terracotta focus:ring-terracotta"
            />
            <span className="text-xs text-gray-600 leading-relaxed">
              {t("gdprConsent")} *
            </span>
          </label>
        </div>

        <div className="flex justify-end pt-2">
          <Button type="submit" size="lg" disabled={!gdprConsent}>
            {t("proceedToDetails")}
          </Button>
        </div>
      </form>
    </div>
  );
}
