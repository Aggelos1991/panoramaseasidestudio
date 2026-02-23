import { prisma } from "@/lib/prisma";
import Image from "next/image";
import { cn } from "@/lib/utils";

async function getRooms() {
  return prisma.room.findMany({
    include: {
      images: { where: { isPrimary: true }, take: 1 },
      _count: { select: { bookings: true } },
    },
    orderBy: { sortOrder: "asc" },
  });
}

export default async function AdminRoomsPage() {
  let rooms: Awaited<ReturnType<typeof getRooms>> = [];
  try {
    rooms = await getRooms();
  } catch {
    // DB not connected
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Rooms</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage room types and settings
          </p>
        </div>
      </div>

      <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {rooms.length === 0 ? (
          <p className="col-span-full text-center text-gray-400 py-12">
            No rooms configured. Run the seed script to add rooms.
          </p>
        ) : (
          rooms.map((room) => (
            <div
              key={room.id}
              className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm"
            >
              <div className="relative aspect-video">
                <Image
                  src={
                    room.images[0]?.url ||
                    "https://panoramastudiosmastichari.hotelskosisland.com/data/Photos/OriginalPhoto/16795/1679569/1679569240.JPEG"
                  }
                  alt={room.nameEn}
                  fill
                  className="object-cover"
                  sizes="400px"
                />
                <div
                  className={cn(
                    "absolute right-3 top-3 rounded-full px-2.5 py-0.5 text-xs font-medium",
                    room.isActive
                      ? "bg-green-100 text-green-700"
                      : "bg-red-100 text-red-700",
                  )}
                >
                  {room.isActive ? "Active" : "Inactive"}
                </div>
              </div>
              <div className="p-5">
                <h3 className="font-semibold text-gray-900">{room.nameEn}</h3>
                <div className="mt-2 flex flex-wrap gap-2 text-xs text-gray-500">
                  <span className="rounded bg-gray-100 px-2 py-0.5">
                    {room.capacity} guests
                  </span>
                  <span className="rounded bg-gray-100 px-2 py-0.5">
                    {room.sizeSqm} m&sup2;
                  </span>
                  <span className="rounded bg-gray-100 px-2 py-0.5">
                    {room.totalUnits} unit{room.totalUnits > 1 ? "s" : ""}
                  </span>
                  <span className="rounded bg-gray-100 px-2 py-0.5">
                    {room._count.bookings} bookings
                  </span>
                </div>
                <div className="mt-3 flex items-baseline gap-1">
                  <span className="text-xl font-bold text-terracotta">
                    &euro;{Number(room.basePrice)}
                  </span>
                  <span className="text-sm text-gray-400">/ night</span>
                </div>
                <div className="mt-3 flex flex-wrap gap-1">
                  {room.amenities.slice(0, 5).map((a) => (
                    <span
                      key={a}
                      className="rounded bg-sandy-light px-2 py-0.5 text-xs text-gray-600"
                    >
                      {a}
                    </span>
                  ))}
                  {room.amenities.length > 5 && (
                    <span className="rounded bg-sandy-light px-2 py-0.5 text-xs text-gray-400">
                      +{room.amenities.length - 5}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
