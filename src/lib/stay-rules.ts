import { isInClosedSeason } from "@/lib/closed-season";

/**
 * House rules for new bookings. Stored here and checked on the server.
 * Check-in is 14:00 until midnight. Check-out is by 12:00.
 * Every room holds at most 2 guests. Guests must be 18 or older.
 * Pets are not allowed. November through March is closed.
 */
export const STAY_POLICY = {
  maxGuestsPerRoom: 2,
  minAge: 18,
  petsAllowed: false,
  checkInFrom: "14:00",
  checkInUntil: "24:00",
  checkOutBy: "12:00",
  closedSeason: "November–March",
} as const;

export type BookingGuest = {
  guests: number;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  country: string | null;
  specialRequests: string | null;
};

export type StayRuleResult =
  | { ok: true; guest: BookingGuest }
  | { ok: false; status: number; error: string };

const PET_REQUEST =
  /\b(pets?|dogs?|cats?|puppies|kittens|animals)\b/i;

function cleanText(value: unknown, max: number): string | null {
  if (typeof value !== "string") return null;
  const text = value.replace(/[\u0000-\u001F]/g, "").trim();
  if (!text || text.length > max) return null;
  return text;
}

function parseClock(value: unknown): number | null | "invalid" {
  if (value == null || value === "") return null;
  if (typeof value !== "string" || !/^\d{2}:\d{2}$/.test(value)) return "invalid";
  const [hour, minute] = value.split(":").map(Number);
  if (hour === 24 && minute === 0) return 24 * 60;
  if (hour > 23 || minute > 59) return "invalid";
  return hour * 60 + minute;
}

function ageOn(dateOfBirth: Date, on: Date): number {
  let age = on.getUTCFullYear() - dateOfBirth.getUTCFullYear();
  const month = on.getUTCMonth() - dateOfBirth.getUTCMonth();
  if (month < 0 || (month === 0 && on.getUTCDate() < dateOfBirth.getUTCDate())) {
    age -= 1;
  }
  return age;
}

function readAge(dateOfBirth: unknown, age: unknown, checkIn: Date): number | "missing" | "invalid" {
  if (typeof dateOfBirth === "string" && /^\d{4}-\d{2}-\d{2}$/.test(dateOfBirth)) {
    const born = new Date(`${dateOfBirth}T00:00:00.000Z`);
    if (Number.isNaN(born.getTime()) || born > checkIn) return "invalid";
    return ageOn(born, checkIn);
  }
  if (typeof age === "number" && Number.isInteger(age)) return age;
  if (typeof age === "string" && /^\d{1,3}$/.test(age)) return Number(age);
  return "missing";
}

function bringingPets(pets: unknown, specialRequests: string | null): boolean {
  if (pets === true || pets === 1 || pets === "1" || pets === "true" || pets === "yes") {
    return true;
  }
  return Boolean(specialRequests && PET_REQUEST.test(specialRequests));
}

export function validateBookingRequest(input: {
  guests: unknown;
  checkIn: Date;
  checkOut: Date;
  firstName: unknown;
  lastName: unknown;
  email: unknown;
  phone?: unknown;
  country?: unknown;
  specialRequests?: unknown;
  dateOfBirth?: unknown;
  age?: unknown;
  pets?: unknown;
  arrivalTime?: unknown;
  departureTime?: unknown;
}): StayRuleResult {
  if (Number.isNaN(input.checkIn.getTime()) || Number.isNaN(input.checkOut.getTime())) {
    return { ok: false, status: 400, error: "Invalid dates" };
  }
  if (input.checkOut <= input.checkIn) {
    return { ok: false, status: 400, error: "Check-out must be after check-in" };
  }
  if (isInClosedSeason(input.checkIn, input.checkOut)) {
    return {
      ok: false,
      status: 409,
      error: "Rooms are closed during this period (November – March)",
    };
  }

  const guests = Number(input.guests);
  if (!Number.isInteger(guests) || guests < 1 || guests > STAY_POLICY.maxGuestsPerRoom) {
    return { ok: false, status: 400, error: "Each room allows at most 2 guests" };
  }

  const guestAge = readAge(input.dateOfBirth, input.age, input.checkIn);
  if (guestAge === "missing" || guestAge === "invalid") {
    return { ok: false, status: 400, error: "A guest aged 18 or older is required" };
  }
  if (guestAge < STAY_POLICY.minAge || guestAge > 120) {
    return { ok: false, status: 400, error: "Guests must be 18 or older" };
  }

  const arrival = parseClock(input.arrivalTime);
  if (arrival === "invalid") {
    return { ok: false, status: 400, error: "Check-in is from 14:00 until midnight" };
  }
  if (arrival != null && (arrival < 14 * 60 || arrival > 24 * 60)) {
    return { ok: false, status: 400, error: "Check-in is from 14:00 until midnight" };
  }

  const departure = parseClock(input.departureTime);
  if (departure === "invalid") {
    return { ok: false, status: 400, error: "Check-out is by 12:00" };
  }
  if (departure != null && departure > 12 * 60) {
    return { ok: false, status: 400, error: "Check-out is by 12:00" };
  }

  const firstName = cleanText(input.firstName, 80);
  const lastName = cleanText(input.lastName, 80);
  const email = cleanText(input.email, 254)?.toLowerCase() ?? null;
  if (!firstName || firstName.length < 2 || !lastName || lastName.length < 2) {
    return { ok: false, status: 400, error: "Missing required fields" };
  }
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { ok: false, status: 400, error: "Missing required fields" };
  }

  const phoneText = typeof input.phone === "string" ? input.phone.trim() : "";
  const phone = phoneText ? cleanText(phoneText, 40) : null;
  if (phoneText && !phone) {
    return { ok: false, status: 400, error: "Missing required fields" };
  }
  const countryText = typeof input.country === "string" ? input.country.trim() : "";
  const country = countryText ? cleanText(countryText, 80) : null;
  if (countryText && !country) {
    return { ok: false, status: 400, error: "Missing required fields" };
  }

  let specialRequests: string | null = null;
  if (typeof input.specialRequests === "string" && input.specialRequests.trim()) {
    specialRequests = cleanText(input.specialRequests, 2000);
    if (!specialRequests) {
      return { ok: false, status: 400, error: "Missing required fields" };
    }
  }

  if (bringingPets(input.pets, specialRequests)) {
    return { ok: false, status: 400, error: "Pets are not allowed" };
  }

  return {
    ok: true,
    guest: { guests, firstName, lastName, email, phone, country, specialRequests },
  };
}
