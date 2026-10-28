import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { parseStringArray, toJsonArray } from "@/lib/json-array";
import { getAdminSession } from "@/lib/auth";
import { parseTourUrl } from "@/lib/tours";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    // Only include pricing rules for authenticated admin requests
    const session = await getAdminSession();
    const room = await prisma.room.findUnique({
      where: { id },
      include: {
        images: { orderBy: { sortOrder: "asc" } },
        ...(session ? { pricingRules: { orderBy: { startDate: "asc" } } } : {}),
      },
    });

    if (!room) {
      return NextResponse.json({ error: "Room not found" }, { status: 404 });
    }

    return NextResponse.json({
      ...room,
      amenities: parseStringArray(room.amenities),
    });
  } catch (error) {
    console.error("Room fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch room" },
      { status: 500 },
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await getAdminSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();

    // Whitelist allowed fields to prevent mass assignment
    const { images, amenities } = body;
    const ALLOWED_FIELDS = [
      "nameEn", "nameEl", "nameDe", "descEn", "descEl", "descDe",
      "capacity", "bedType", "sizeSqm", "basePrice", "totalUnits",
      "sortOrder", "isActive", "slug",
    ] as const;

    const data: Record<string, unknown> = {};
    for (const field of ALLOWED_FIELDS) {
      if (body[field] !== undefined) data[field] = body[field];
    }
    if (amenities !== undefined) data.amenities = toJsonArray(amenities);
    if (body.tourUrl !== undefined) {
      const parsedTour = parseTourUrl(body.tourUrl);
      if ("error" in parsedTour) {
        return NextResponse.json({ error: parsedTour.error }, { status: 400 });
      }
      data.tourUrl = parsedTour.tourUrl;
    }

    const room = await prisma.room.update({
      where: { id },
      data,
    });

    // If images provided, replace all images
    if (images !== undefined) {
      await prisma.roomImage.deleteMany({ where: { roomId: id } });
      if (images.length > 0) {
        await prisma.roomImage.createMany({
          data: images.map(
            (img: { url: string; alt?: string; isPrimary?: boolean }, i: number) => ({
              roomId: id,
              url: img.url,
              alt: img.alt || room.nameEn,
              isPrimary: img.isPrimary || i === 0,
              sortOrder: i,
            }),
          ),
        });
      }
    }

    const updated = await prisma.room.findUnique({
      where: { id },
      include: { images: { orderBy: { sortOrder: "asc" } } },
    });

    return NextResponse.json(updated ? {
      ...updated,
      amenities: parseStringArray(updated.amenities),
    } : updated);
  } catch (error) {
    console.error("Room update error:", error);
    return NextResponse.json(
      { error: "Failed to update room" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await getAdminSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    // Check if room has bookings
    const bookingCount = await prisma.booking.count({ where: { roomId: id } });

    if (bookingCount > 0) {
      // Soft delete — keep room but deactivate
      await prisma.room.update({
        where: { id },
        data: { isActive: false },
      });
      return NextResponse.json({ deleted: false, deactivated: true });
    }

    // Hard delete — no bookings, safe to remove
    await prisma.room.delete({ where: { id } });
    return NextResponse.json({ deleted: true });
  } catch (error) {
    console.error("Room delete error:", error);
    return NextResponse.json(
      { error: "Failed to delete room" },
      { status: 500 },
    );
  }
}
