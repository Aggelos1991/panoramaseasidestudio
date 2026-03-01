import { eachDayOfInterval } from "date-fns";

// Rooms are closed November through March
const CLOSED_MONTHS = new Set([11, 12, 1, 2, 3]);

export const OPEN_SEASON = { startMonth: 4, endMonth: 10 } as const;

/**
 * Returns true if ANY night of the stay falls in the closed season (Nov 1 – Mar 31).
 * checkIn/checkOut are the first/last night dates.
 */
export function isInClosedSeason(checkIn: Date, checkOut: Date): boolean {
  const nights = eachDayOfInterval({
    start: checkIn,
    end: new Date(checkOut.getTime() - 86400000), // exclude checkout day
  });

  return nights.some((day) => CLOSED_MONTHS.has(day.getMonth() + 1));
}
