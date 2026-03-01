import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { differenceInDays, eachDayOfInterval, parseISO } from "date-fns";
import { getLocalizedField } from "@/lib/utils";
import { HOTEL_IMAGES, FALLBACK_ROOMS } from "@/lib/constants";
import { isInClosedSeason } from "@/lib/closed-season";

const PHOTO_BASE =
  "https://panoramastudiosmastichari.hotelskosisland.com/data/Photos/OriginalPhoto";

function getFallbackRooms(nights: number, guests: number, locale: string) {
  return FALLBACK_ROOMS
    .filter((room) => room.capacity >= guests)
    .map((room) => ({
      id: `fallback-${room.slug}`,
      slug: room.slug,
      name: getLocalizedField(room, "name", locale),
      capacity: room.capacity,
      sizeSqm: room.sizeSqm,
      bedType: room.bedType,
      pricePerNight: room.basePrice,
      totalPrice: room.basePrice * nights,
      nights,
      imageUrl: room.primaryImage,
      amenities: room.amenities,
    }));
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { checkIn, checkOut, guests = 1, locale = "en" } = body;

    if (!checkIn || !checkOut) {
      return NextResponse.json(
        { error: "checkIn and checkOut are required" },
        { status: 400 },
      );
    }

    // Ensure dates are parsed as UTC midnight to match DB storage
    const checkInDate = new Date(checkIn + "T00:00:00.000Z");
    const checkOutDate = new Date(checkOut + "T00:00:00.000Z");
    const nights = differenceInDays(checkOutDate, checkInDate);

    if (nights <= 0) {
      return NextResponse.json(
        { error: "Check-out must be after check-in" },
        { status: 400 },
      );
    }

    // Rooms closed Nov–Mar
    if (isInClosedSeason(checkInDate, checkOutDate)) {
      return NextResponse.json({ rooms: [] });
    }

    let rooms;
    try {
      rooms = await prisma.room.findMany({
        where: {
          isActive: true,
          capacity: { gte: guests },
        },
        include: {
          images: {
            where: { isPrimary: true },
            take: 1,
          },
          pricingRules: {
            where: {
              startDate: { lte: checkOutDate },
              endDate: { gte: checkInDate },
            },
          },
          blockedDates: {
            where: {
              date: {
                gte: checkInDate,
                lt: checkOutDate,
              },
            },
          },
        },
        orderBy: { sortOrder: "asc" },
      });
    } catch {
      return NextResponse.json({
        rooms: getFallbackRooms(nights, guests, locale),
      });
    }

    if (rooms.length === 0) {
      return NextResponse.json({
        rooms: getFallbackRooms(nights, guests, locale),
      });
    }

    const availableRooms = [];

    for (const room of rooms) {
      if (room.blockedDates.length > 0) continue;

      const [overlappingBookings, overlappingExternal] = await Promise.all([
        prisma.booking.count({
          where: {
            roomId: room.id,
            status: "CONFIRMED",
            checkIn: { lt: checkOutDate },
            checkOut: { gt: checkInDate },
          },
        }),
        prisma.externalBooking.count({
          where: {
            roomId: room.id,
            checkIn: { lt: checkOutDate },
            checkOut: { gt: checkInDate },
          },
        }),
      ]);

      if (overlappingBookings + overlappingExternal >= room.totalUnits) continue;

      const stayDays = eachDayOfInterval({
        start: checkInDate,
        end: new Date(checkOutDate.getTime() - 86400000),
      });

      let totalPrice = 0;
      for (const day of stayDays) {
        const dayOfWeek = day.getDay(); // 0=Sun..6=Sat

        const matchingRules = room.pricingRules.filter(
          (rule) => day >= rule.startDate && day <= rule.endDate,
        );

        // Day-specific rule takes priority over general rule
        const daySpecificRule = matchingRules.find(
          (rule) => rule.daysOfWeek.length > 0 && rule.daysOfWeek.includes(dayOfWeek),
        );
        const generalRule = matchingRules.find(
          (rule) => rule.daysOfWeek.length === 0,
        );

        const applicableRule = daySpecificRule || generalRule;
        totalPrice += applicableRule
          ? Number(applicableRule.pricePerNight)
          : Number(room.basePrice);
      }

      const avgPricePerNight = Math.round(totalPrice / nights);

      availableRooms.push({
        id: room.id,
        slug: room.slug,
        name: getLocalizedField(room, "name", locale),
        capacity: room.capacity,
        sizeSqm: room.sizeSqm,
        bedType: room.bedType,
        pricePerNight: avgPricePerNight,
        totalPrice: Math.round(totalPrice),
        nights,
        imageUrl:
          room.images[0]?.url ||
          HOTEL_IMAGES.rooms[room.slug as keyof typeof HOTEL_IMAGES.rooms] ||
          `${PHOTO_BASE}/16795/1679569/1679569240.JPEG`,
        amenities: room.amenities,
      });
    }

    return NextResponse.json({ rooms: availableRooms });
  } catch (error) {
    console.error("Availability check error:", error);
    return NextResponse.json(
      { error: "Failed to check availability" },
      { status: 500 },
    );
  }
}
