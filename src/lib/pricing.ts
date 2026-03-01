import { prisma } from "@/lib/prisma";
import { eachDayOfInterval, differenceInDays } from "date-fns";
import { parseIntArray } from "@/lib/json-array";

/**
 * Calculate the total price for a room stay server-side.
 * Uses base price + pricing rules (seasonal, day-of-week).
 * This is the single source of truth for pricing — never trust client-submitted prices.
 */
export async function calculateStayPrice(
  roomId: string,
  checkInDate: Date,
  checkOutDate: Date,
): Promise<{ totalPrice: number; nights: number }> {
  const nights = differenceInDays(checkOutDate, checkInDate);

  if (nights <= 0) {
    throw new Error("Check-out must be after check-in");
  }

  const room = await prisma.room.findUnique({
    where: { id: roomId },
    include: {
      pricingRules: {
        where: {
          startDate: { lte: checkOutDate },
          endDate: { gte: checkInDate },
        },
      },
    },
  });

  if (!room) {
    throw new Error("Room not found");
  }

  const stayDays = eachDayOfInterval({
    start: checkInDate,
    end: new Date(checkOutDate.getTime() - 86400000), // exclude checkout day
  });

  let totalPrice = 0;
  for (const day of stayDays) {
    const dayOfWeek = day.getDay(); // 0=Sun..6=Sat

    const matchingRules = room.pricingRules.filter(
      (rule) => day >= rule.startDate && day <= rule.endDate,
    );

    // Day-specific rule takes priority over general rule
    const daySpecificRule = matchingRules.find((rule) => {
      const days = parseIntArray(rule.daysOfWeek);
      return days.length > 0 && days.includes(dayOfWeek);
    });
    const generalRule = matchingRules.find(
      (rule) => parseIntArray(rule.daysOfWeek).length === 0,
    );

    const applicableRule = daySpecificRule || generalRule;
    totalPrice += applicableRule
      ? Number(applicableRule.pricePerNight)
      : Number(room.basePrice);
  }

  return { totalPrice: Math.round(totalPrice), nights };
}
