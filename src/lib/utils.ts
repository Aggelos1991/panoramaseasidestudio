import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number, currency = "EUR"): string {
  return new Intl.NumberFormat("en-EU", {
    style: "currency",
    currency,
  }).format(amount);
}

export function generateReferenceNumber(): string {
  const year = new Date().getFullYear();
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `PAN-${year}-${code}`;
}

export function getLocalizedField<T extends Record<string, unknown>>(
  item: T,
  field: string,
  locale: string,
): string {
  const localeMap: Record<string, string> = {
    en: "En",
    el: "El",
    de: "De",
  };
  const suffix = localeMap[locale] || "En";
  const key = `${field}${suffix}` as keyof T;
  return (item[key] as string) || (item[`${field}En` as keyof T] as string) || "";
}
