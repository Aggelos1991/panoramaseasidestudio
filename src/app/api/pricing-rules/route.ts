import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { parseIntArray, toJsonArray } from "@/lib/json-array";

// GET — list all pricing rules (optionally filter by roomId)
export async function GET(request: NextRequest) {
  try {
    const roomId = request.nextUrl.searchParams.get("roomId");

    const rules = await prisma.pricingRule.findMany({
      where: roomId ? { roomId } : undefined,
      include: {
        room: { select: { nameEn: true, slug: true } },
      },
      orderBy: [{ startDate: "asc" }],
    });

    const parsed = rules.map((rule) => ({
      ...rule,
      daysOfWeek: parseIntArray(rule.daysOfWeek),
    }));

    return NextResponse.json({ rules: parsed });
  } catch (error) {
    console.error("Pricing rules GET error:", error);
    return NextResponse.json(
      { error: "Failed to fetch pricing rules" },
      { status: 500 },
    );
  }
}

// POST — create a new pricing rule
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, roomId, startDate, endDate, pricePerNight, daysOfWeek } = body;

    if (!name || !roomId || !startDate || !endDate || !pricePerNight) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (end <= start) {
      return NextResponse.json(
        { error: "End date must be after start date" },
        { status: 400 },
      );
    }

    if (Number(pricePerNight) <= 0) {
      return NextResponse.json(
        { error: "Price must be greater than 0" },
        { status: 400 },
      );
    }

    if (daysOfWeek !== undefined && daysOfWeek !== null) {
      if (!Array.isArray(daysOfWeek) || !daysOfWeek.every((d: unknown) => typeof d === "number" && d >= 0 && d <= 6)) {
        return NextResponse.json(
          { error: "daysOfWeek must be an array of integers 0-6" },
          { status: 400 },
        );
      }
    }

    const rule = await prisma.pricingRule.create({
      data: {
        name,
        roomId,
        startDate: start,
        endDate: end,
        pricePerNight: Number(pricePerNight),
        daysOfWeek: toJsonArray(daysOfWeek || []),
      },
      include: {
        room: { select: { nameEn: true, slug: true } },
      },
    });

    return NextResponse.json({
      rule: {
        ...rule,
        daysOfWeek: parseIntArray(rule.daysOfWeek),
      },
    }, { status: 201 });
  } catch (error) {
    console.error("Pricing rules POST error:", error);
    return NextResponse.json(
      { error: "Failed to create pricing rule" },
      { status: 500 },
    );
  }
}

// DELETE — delete a pricing rule by id
export async function DELETE(request: NextRequest) {
  try {
    const id = request.nextUrl.searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Missing id" }, { status: 400 });
    }

    await prisma.pricingRule.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Pricing rules DELETE error:", error);
    return NextResponse.json(
      { error: "Failed to delete pricing rule" },
      { status: 500 },
    );
  }
}
