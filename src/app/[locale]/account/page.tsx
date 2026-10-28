"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameMonth,
  isWithinInterval,
  parseISO,
  startOfMonth,
  startOfWeek,
  subMonths,
} from "date-fns";

type Guest = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
};

type Stay = {
  id: string;
  referenceNumber: string;
  checkIn: string;
  checkOut: string;
  nights: number;
  status: string;
  totalPrice: number;
  currency: string;
  room: { nameEn: string; nameEl: string; nameDe: string };
};

export default function AccountPage() {
  const t = useTranslations("account");
  const locale = useLocale();
  const [guest, setGuest] = useState<Guest | null>(null);
  const [stays, setStays] = useState<Stay[]>([]);
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const [month, setMonth] = useState(() => startOfMonth(new Date()));

  async function loadAccount() {
    const me = await fetch("/api/guest");
    if (!me.ok) {
      setGuest(null);
      setStays([]);
      return;
    }
    const meData = await me.json();
    setGuest(meData.guest);
    const staysRes = await fetch("/api/guest/stays");
    const staysData = staysRes.ok ? await staysRes.json() : { stays: [] };
    setStays(staysData.stays || []);
  }

  useEffect(() => {
    const code = new URLSearchParams(window.location.search).get("error");
    if (code === "missing" || code === "invalid" || code === "exists" || code === "failed") {
      setError(t(code));
    }
    loadAccount().catch(() => {});
    // t is stable for the error string read above; avoid refetching on each render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setPending(true);
    const submitter = (event.nativeEvent as SubmitEvent).submitter;
    const form = new FormData(
      event.currentTarget,
      submitter instanceof HTMLElement ? submitter : undefined,
    );
    try {
      const res = await fetch("/api/guest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: form.get("mode"),
          locale,
          firstName: form.get("firstName"),
          lastName: form.get("lastName"),
          email: form.get("email"),
          password: form.get("password"),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        const code = data.error;
        setError(
          code === "missing" || code === "invalid" || code === "exists" || code === "failed"
            ? t(code)
            : t("failed"),
        );
        return;
      }
      setGuest(data.guest);
      await loadAccount();
    } catch {
      setError(t("failed"));
    } finally {
      setPending(false);
    }
  }

  async function signOut() {
    await fetch("/api/guest", { method: "DELETE" });
    setGuest(null);
    setStays([]);
  }

  const days = useMemo(() => {
    return eachDayOfInterval({
      start: startOfWeek(startOfMonth(month), { weekStartsOn: 1 }),
      end: endOfWeek(endOfMonth(month), { weekStartsOn: 1 }),
    });
  }, [month]);

  const roomName = (stay: Stay) => {
    if (locale === "el") return stay.room.nameEl;
    if (locale === "de") return stay.room.nameDe;
    return stay.room.nameEn;
  };

  const weekdayLabels = useMemo(() => {
    return Array.from({ length: 7 }, (_, index) =>
      new Intl.DateTimeFormat(locale, { weekday: "narrow" }).format(new Date(2024, 0, 1 + index)),
    );
  }, [locale]);

  return (
    <div className="min-h-screen bg-cream px-4 pb-20 pt-28 sm:px-6">
      <div className="mx-auto max-w-3xl">
        <h1 className="font-serif text-4xl text-deep-blue">{t("title")}</h1>
        <p className="mt-3 max-w-xl text-gray-600">{t("intro")}</p>

        {guest ? (
          <div className="mt-10">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-deep-blue">
                {guest.firstName} {guest.lastName}
              </p>
              <button
                type="button"
                onClick={signOut}
                className="text-sm text-gray-600 underline-offset-4 hover:underline"
              >
                {t("signOut")}
              </button>
            </div>

            <div className="mt-8 bg-white p-4 shadow-soft sm:p-6">
              <div className="mb-4 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setMonth((current) => subMonths(current, 1))}
                  className="px-2 py-1 text-deep-blue"
                  aria-label={t("previous")}
                >
                  ‹
                </button>
                <p className="font-medium text-deep-blue">
                  {new Intl.DateTimeFormat(locale, { month: "long", year: "numeric" }).format(month)}
                </p>
                <button
                  type="button"
                  onClick={() => setMonth((current) => addMonths(current, 1))}
                  className="px-2 py-1 text-deep-blue"
                  aria-label={t("next")}
                >
                  ›
                </button>
              </div>
              <div className="grid grid-cols-7 gap-1 text-center text-xs text-gray-500">
                {weekdayLabels.map((day) => (
                  <div key={day} className="py-1">
                    {day}
                  </div>
                ))}
              </div>
              <div className="mt-1 grid grid-cols-7 gap-1">
                {days.map((day) => {
                  const key = format(day, "yyyy-MM-dd");
                  const stay = stays.find((item) => {
                    const start = parseISO(item.checkIn);
                    const end = parseISO(item.checkOut);
                    return (
                      item.status === "CONFIRMED" &&
                      isWithinInterval(day, {
                        start,
                        end: new Date(end.getTime() - 86400000),
                      })
                    );
                  });
                  return (
                    <div
                      key={key}
                      className={`flex h-11 items-center justify-center text-sm ${
                        !isSameMonth(day, month)
                          ? "text-gray-300"
                          : stay
                            ? "bg-deep-blue text-white"
                            : "text-deep-blue"
                      }`}
                      title={stay ? stay.referenceNumber : undefined}
                    >
                      {format(day, "d")}
                    </div>
                  );
                })}
              </div>
            </div>

            {stays.length === 0 ? (
              <div className="mt-8">
                <p className="text-gray-600">{t("empty")}</p>
                <Link
                  href="/booking"
                  className="mt-4 inline-block bg-terracotta px-5 py-3 text-sm text-white"
                >
                  {t("book")}
                </Link>
              </div>
            ) : (
              <ul className="mt-8 divide-y divide-sandy-dark/40 border-y border-sandy-dark/40">
                {stays.map((stay) => (
                  <li key={stay.id} className="flex flex-wrap items-baseline justify-between gap-2 py-4">
                    <div>
                      <p className="font-medium text-deep-blue">{roomName(stay)}</p>
                      <p className="text-sm text-gray-600">
                        {stay.checkIn} — {stay.checkOut}
                        <span className="mx-2 text-gray-300">/</span>
                        {stay.nights} {t("nights")}
                      </p>
                    </div>
                    <p className="text-sm text-gray-600">
                      {t("reference")} {stay.referenceNumber}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </div>
        ) : (
          <form
            action="/api/guest"
            method="post"
            onSubmit={onSubmit}
            className="mt-10 max-w-md space-y-4 bg-white p-6 shadow-soft"
          >
            <input type="hidden" name="locale" value={locale} />
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block text-sm text-gray-700">
                {t("firstName")}
                <input
                  name="firstName"
                  autoComplete="given-name"
                  className="mt-1 w-full border border-sandy-dark px-3 py-2 outline-none focus:border-deep-blue"
                />
              </label>
              <label className="block text-sm text-gray-700">
                {t("lastName")}
                <input
                  name="lastName"
                  autoComplete="family-name"
                  className="mt-1 w-full border border-sandy-dark px-3 py-2 outline-none focus:border-deep-blue"
                />
              </label>
            </div>

            <label className="block text-sm text-gray-700">
              {t("email")}
              <input
                name="email"
                type="email"
                required
                autoComplete="email"
                className="mt-1 w-full border border-sandy-dark px-3 py-2 outline-none focus:border-deep-blue"
              />
            </label>
            <label className="block text-sm text-gray-700">
              {t("password")}
              <input
                name="password"
                type="password"
                required
                minLength={8}
                autoComplete="current-password"
                className="mt-1 w-full border border-sandy-dark px-3 py-2 outline-none focus:border-deep-blue"
              />
            </label>
            <p className="text-xs text-gray-500">{t("passwordHint")}</p>
            {error && <p className="text-sm text-red-700">{error}</p>}
            <div className="flex flex-wrap gap-3">
              <button
                type="submit"
                name="mode"
                value="login"
                disabled={pending}
                className="bg-deep-blue px-5 py-3 text-sm text-white disabled:opacity-60"
              >
                {t("submitSignIn")}
              </button>
              <button
                type="submit"
                name="mode"
                value="register"
                disabled={pending}
                className="border border-deep-blue px-5 py-3 text-sm text-deep-blue disabled:opacity-60"
              >
                {t("submitCreate")}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
