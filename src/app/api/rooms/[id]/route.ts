import { NextRequest, NextResponse } from "next/server";
import { parseStringArray } from "@/lib/json-array";
import {
  countBookingsForRoom,
  deactivateRoom,
  deleteRoom,
  findRoom,
  listPricingRules,
  updateRoom,
} from "@/lib/store";
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
    const room = await findRoom(id);

    if (!room) {
      return NextResponse.json({ error: "Room not found" }, { status: 404 });
    }

    const pricingRules = session ? await listPricingRules(room.id) : undefined;

    return NextResponse.json({
      ...room,
      amenities: parseStringArray(room.amenities),
      ...(pricingRules ? { pricingRules } : {}),
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
    if (amenities !== undefined) data.amenities = amenities;
    if (body.tourUrl !== undefined) {
      const parsedTour = parseTourUrl(body.tourUrl);
      if ("error" in parsedTour) {
        return NextResponse.json({ error: parsedTour.error }, { status: 400 });
      }
      data.tourUrl = parsedTour.tourUrl;
    }

    const updated = await updateRoom(id, data, images);

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
    const bookingCount = await countBookingsForRoom(id);

    if (bookingCount > 0) {
      await deactivateRoom(id);
      return NextResponse.json({ deleted: false, deactivated: true });
    }

    await deleteRoom(id);
    return NextResponse.json({ deleted: true });
  } catch (error) {
    console.error("Room delete error:", error);
    return NextResponse.json(
      { error: "Failed to delete room" },
      { status: 500 },
    );
  }
}
