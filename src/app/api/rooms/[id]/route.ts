import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { parseStringArray, toJsonArray } from "@/lib/json-array";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const room = await prisma.room.findUnique({
      where: { id },
      include: {
        images: { orderBy: { sortOrder: "asc" } },
        pricingRules: { orderBy: { startDate: "asc" } },
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
    const { id } = await params;
    const body = await request.json();

    // Separate images from room data
    const { images, amenities, ...roomData } = body;

    // Convert amenities array to JSON string for MySQL storage
    const data = {
      ...roomData,
      ...(amenities !== undefined ? { amenities: toJsonArray(amenities) } : {}),
    };

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
