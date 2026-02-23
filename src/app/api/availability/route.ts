import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { differenceInDays, eachDayOfInterval, parseISO } from "date-fns";
import { getLocalizedField } from "@/lib/utils";
import { HOTEL_IMAGES, FALLBACK_ROOMS } from "@/lib/constants";

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

    const checkInDate = parseISO(checkIn);
    const checkOutDate = parseISO(checkOut);
    const nights = differenceInDays(checkOutDate, checkInDate);

    if (nights <= 0) {
      return NextResponse.json(
        { error: "Check-out must be after check-in" },
        { status: 400 },
      );
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

      const overlappingBookings = await prisma.booking.count({
        where: {
          roomId: room.id,
          status: { in: ["PENDING", "CONFIRMED"] },
          checkIn: { lt: checkOutDate },
          checkOut: { gt: checkInDate },
        },
      });

      if (overlappingBookings >= room.totalUnits) continue;

      const stayDays = eachDayOfInterval({
        start: checkInDate,
        end: new Date(checkOutDate.getTime() - 86400000),
      });

      let totalPrice = 0;
      for (const day of stayDays) {
        const applicableRule = room.pricingRules.find(
          (rule) => day >= rule.startDate && day <= rule.endDate,
        );
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
