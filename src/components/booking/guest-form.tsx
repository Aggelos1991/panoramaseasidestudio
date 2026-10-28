"use client";

import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { guestDetailsSchema, type GuestDetailsData } from "@/lib/validators";
import type { GuestDetails } from "@/app/[locale]/booking/page";
import { useEffect, useState } from "react";

type Props = {
  onSubmit: (details: GuestDetails) => void;
};

const fieldClass =
  "mt-2 w-full rounded-xl border border-black/10 bg-white/80 px-4 py-2.5 font-sans text-sm text-[#1c1916] outline-none transition-colors focus:border-[#1c1916]";

const labelClass =
  "block font-sans text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-[#1c1916]";

export function GuestForm({ onSubmit }: Props) {
  const t = useTranslations("booking");
  const [gdprConsent, setGdprConsent] = useState(false);
  const [noPets, setNoPets] = useState(false);
  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<GuestDetailsData>({
    resolver: zodResolver(guestDetailsSchema),
  });

  useEffect(() => {
    fetch("/api/guest")
      .then((response) => (response.ok ? response.json() : null))
      .then((data) => {
        if (!data?.guest) return;
        setValue("firstName", data.guest.firstName);
        setValue("lastName", data.guest.lastName);
        setValue("email", data.guest.email);
      })
      .catch(() => {});
  }, [setValue]);

  function onFormSubmit(data: GuestDetailsData) {
    if (!gdprConsent || !noPets) return;
    onSubmit({ ...data, pets: false });
  }

  return (
    <div className="glass-card rounded-[28px] p-6 sm:p-8">
      <h2 className="font-film text-4xl font-medium leading-none tracking-tight text-[#1c1916]">
        {t("yourDetails")}
      </h2>

      <form onSubmit={handleSubmit(onFormSubmit)} className="mt-8 space-y-5">
        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label htmlFor="guest-first-name" className={labelClass}>
              {t("firstName")} *
            </label>
            <input id="guest-first-name" {...register("firstName")} className={fieldClass} />
            {errors.firstName && (
              <p className="mt-1 text-xs text-red-700">{errors.firstName.message}</p>
            )}
          </div>
          <div>
            <label htmlFor="guest-last-name" className={labelClass}>
              {t("lastName")} *
            </label>
            <input id="guest-last-name" {...register("lastName")} className={fieldClass} />
            {errors.lastName && (
              <p className="mt-1 text-xs text-red-700">{errors.lastName.message}</p>
            )}
          </div>
        </div>

        <div>
          <label htmlFor="guest-email" className={labelClass}>
            {t("email")} *
          </label>
          <input id="guest-email" {...register("email")} type="email" className={fieldClass} />
          {errors.email && (
            <p className="mt-1 text-xs text-red-700">{errors.email.message}</p>
          )}
        </div>

        <div>
          <label htmlFor="guest-birth" className={labelClass}>
            {t("dateOfBirth")} *
          </label>
          <input
            id="guest-birth"
            {...register("dateOfBirth")}
            type="date"
            max={new Date(new Date().setFullYear(new Date().getFullYear() - 18)).toISOString().slice(0, 10)}
            className={fieldClass}
          />
          <p className="mt-1 text-xs text-[#1c1916]/55">{t("minAgeNote")}</p>
          {errors.dateOfBirth && (
            <p className="mt-1 text-xs text-red-700">{errors.dateOfBirth.message}</p>
          )}
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label htmlFor="guest-phone" className={labelClass}>
              {t("phone")}
            </label>
            <input id="guest-phone" {...register("phone")} type="tel" className={fieldClass} />
          </div>
          <div>
            <label htmlFor="guest-country" className={labelClass}>
              {t("country")}
            </label>
            <input id="guest-country" {...register("country")} className={fieldClass} />
          </div>
        </div>

        <div>
          <label htmlFor="guest-requests" className={labelClass}>
            {t("specialRequests")}
          </label>
          <textarea
            id="guest-requests"
            {...register("specialRequests")}
            rows={3}
            placeholder={t("specialRequestsPlaceholder")}
            className={`${fieldClass} resize-none`}
          />
        </div>

        <div className="rounded-2xl border border-black/10 bg-white/40 p-4">
          <label className="flex cursor-pointer items-start gap-3">
            <input
              type="checkbox"
              checked={noPets}
              onChange={(e) => setNoPets(e.target.checked)}
              className="mt-0.5 h-4 w-4 rounded border-black/20 accent-[#1c1916]"
            />
            <span className="text-xs leading-relaxed text-[#1c1916]/75">
              {t("noPets")} *
            </span>
          </label>
        </div>

        <div className="rounded-2xl border border-black/10 bg-white/40 p-4">
          <label className="flex cursor-pointer items-start gap-3">
            <input
              type="checkbox"
              checked={gdprConsent}
              onChange={(e) => setGdprConsent(e.target.checked)}
              className="mt-0.5 h-4 w-4 rounded border-black/20 accent-[#1c1916]"
            />
            <span className="text-xs leading-relaxed text-[#1c1916]/75">
              {t("gdprConsent")} *
            </span>
          </label>
        </div>

        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={!gdprConsent || !noPets}
            className="inline-flex h-12 items-center justify-center bg-[#1c1916] px-6 font-sans text-sm font-semibold tracking-wide text-[#f3efe8] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {t("reviewStay")}
          </button>
        </div>
      </form>
    </div>
  );
}
