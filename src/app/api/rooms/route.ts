import { NextRequest, NextResponse } from "next/server";
import { parseStringArray } from "@/lib/json-array";
import { createRoom, findRoom, listRooms, nextRoomSortOrder } from "@/lib/store";
import { getAdminSession } from "@/lib/auth";
import { parseTourUrl } from "@/lib/tours";

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export async function GET() {
  try {
    const rooms = await listRooms({ activeOnly: true });

    const parsed = rooms.map((room) => ({
      ...room,
      amenities: parseStringArray(room.amenities),
    }));

    return NextResponse.json(parsed);
  } catch (error) {
    console.error("Rooms fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch rooms" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getAdminSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const {
      nameEn,
      nameEl = "",
      nameDe = "",
      descEn = "",
      descEl = "",
      descDe = "",
      capacity,
      bedType = "",
      sizeSqm = 0,
      basePrice,
      totalUnits = 1,
      amenities = [],
      images = [],
      tourUrl,
    } = body;

    if (!nameEn || !capacity || !basePrice) {
      return NextResponse.json(
        { error: "Name, capacity, and base price are required" },
        { status: 400 },
      );
    }

    const parsedTour = parseTourUrl(tourUrl);
    if ("error" in parsedTour) {
      return NextResponse.json({ error: parsedTour.error }, { status: 400 });
    }

    // Generate unique slug
    let slug = slugify(nameEn);
    const existing = await findRoom(slug);
    if (existing) {
      slug = `${slug}-${Date.now().toString(36)}`;
    }

    const sortOrder = await nextRoomSortOrder();

    const room = await createRoom({
      slug,
      nameEn,
      nameEl: nameEl || nameEn,
      nameDe: nameDe || nameEn,
      descEn,
      descEl: descEl || descEn,
      descDe: descDe || descEn,
      capacity,
      bedType,
      sizeSqm,
      basePrice,
      totalUnits,
      amenities,
      tourUrl: parsedTour.tourUrl,
      sortOrder,
      images,
    });

    return NextResponse.json({
      ...room,
      amenities: parseStringArray(room.amenities),
    }, { status: 201 });
  } catch (error) {
    console.error("Room creation error:", error);
    return NextResponse.json(
      { error: "Failed to create room" },
      { status: 500 },
    );
  }
}
