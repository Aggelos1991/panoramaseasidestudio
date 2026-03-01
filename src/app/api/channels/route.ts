import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminSession } from "@/lib/auth";

// GET — list all channels
export async function GET() {
  try {
    const session = await getAdminSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const channels = await prisma.channel.findMany({
      include: {
        room: { select: { nameEn: true, slug: true } },
        _count: { select: { externalBookings: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ channels });
  } catch (error) {
    console.error("Channels fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch channels" },
      { status: 500 },
    );
  }
}

// POST — create a new channel
export async function POST(request: NextRequest) {
  try {
    const session = await getAdminSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { name, platform, icalImportUrl, roomId, color } = body;

    if (!name || !platform || !roomId) {
      return NextResponse.json(
        { error: "Name, platform, and room are required" },
        { status: 400 },
      );
    }

    // Validate iCal URL to prevent SSRF attacks
    if (icalImportUrl) {
      try {
        const url = new URL(icalImportUrl);
        if (!["http:", "https:"].includes(url.protocol)) {
          return NextResponse.json(
            { error: "iCal URL must use HTTP(S)" },
            { status: 400 },
          );
        }
        const hostname = url.hostname.toLowerCase();
        const blocked =
          hostname === "localhost" ||
          hostname === "127.0.0.1" ||
          hostname.startsWith("10.") ||
          hostname.startsWith("192.168.") ||
          hostname.startsWith("172.") ||
          hostname === "mysql" ||
          hostname === "app" ||
          hostname.includes("169.254") ||
          hostname === "0.0.0.0";
        if (blocked) {
          return NextResponse.json(
            { error: "iCal URL cannot point to internal addresses" },
            { status: 400 },
          );
        }
      } catch {
        return NextResponse.json(
          { error: "Invalid iCal URL" },
          { status: 400 },
        );
      }
    }

    const channel = await prisma.channel.create({
      data: {
        name,
        platform,
        icalImportUrl: icalImportUrl || null,
        roomId,
        color: color || "#6366f1",
      },
      include: {
        room: { select: { nameEn: true, slug: true } },
      },
    });

    return NextResponse.json({ channel });
  } catch (error) {
    console.error("Channel creation error:", error);
    return NextResponse.json(
      { error: "Failed to create channel" },
      { status: 500 },
    );
  }
}

// DELETE — delete a channel by id (passed as query param)
export async function DELETE(request: NextRequest) {
  try {
    const session = await getAdminSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "ID required" }, { status: 400 });
    }

    await prisma.channel.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Channel deletion error:", error);
    return NextResponse.json(
      { error: "Failed to delete channel" },
      { status: 500 },
    );
  }
}
