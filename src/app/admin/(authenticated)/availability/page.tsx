import { prisma } from "@/lib/prisma";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, addMonths } from "date-fns";

async function getAvailabilityData() {
  const now = new Date();
  const start = startOfMonth(now);
  const end = endOfMonth(addMonths(now, 2));

  const [rooms, bookings, blockedDates] = await Promise.all([
    prisma.room.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: "asc" },
    }),
    prisma.booking.findMany({
      where: {
        status: { in: ["PENDING", "CONFIRMED"] },
        checkIn: { lte: end },
        checkOut: { gte: start },
      },
      select: {
        roomId: true,
        checkIn: true,
        checkOut: true,
      },
    }),
    prisma.blockedDate.findMany({
      where: {
        date: { gte: start, lte: end },
      },
    }),
  ]);

  return { rooms, bookings, blockedDates, start, end };
}

export default async function AdminAvailabilityPage() {
  let data;
  try {
    data = await getAvailabilityData();
  } catch {
    return (
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Availability</h1>
        <p className="mt-4 text-gray-500">
          Connect the database to view availability.
        </p>
      </div>
    );
  }

  const { rooms, bookings, blockedDates, start, end } = data;
  const days = eachDayOfInterval({ start, end });
  const months = [...new Set(days.map((d) => format(d, "MMMM yyyy")))];

  // Build occupancy map: roomId -> date string -> count
  const occupancyMap: Record<string, Record<string, number>> = {};
  const blockedMap: Record<string, Set<string>> = {};

  for (const room of rooms) {
    occupancyMap[room.id] = {};
    blockedMap[room.id] = new Set();
  }

  for (const booking of bookings) {
    const bookDays = eachDayOfInterval({
      start: new Date(booking.checkIn),
      end: new Date(new Date(booking.checkOut).getTime() - 86400000),
    });
    for (const day of bookDays) {
      const key = format(day, "yyyy-MM-dd");
      if (occupancyMap[booking.roomId]) {
        occupancyMap[booking.roomId][key] =
          (occupancyMap[booking.roomId][key] || 0) + 1;
      }
    }
  }

  for (const blocked of blockedDates) {
    const key = format(new Date(blocked.date), "yyyy-MM-dd");
    if (blockedMap[blocked.roomId]) {
      blockedMap[blocked.roomId].add(key);
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900">Availability</h1>
      <p className="mt-1 text-sm text-gray-500">
        View room occupancy for the next 3 months
      </p>

      <div className="mt-4 flex items-center gap-4 text-xs">
        <span className="flex items-center gap-1.5">
          <span className="h-3 w-3 rounded bg-green-200" /> Available
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-3 w-3 rounded bg-yellow-200" /> Partially Booked
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-3 w-3 rounded bg-red-200" /> Fully Booked
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-3 w-3 rounded bg-gray-300" /> Blocked
        </span>
      </div>

      {months.map((month) => {
        const monthDays = days.filter(
          (d) => format(d, "MMMM yyyy") === month,
        );

        return (
          <div
            key={month}
            className="mt-6 overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm"
          >
            <div className="border-b border-gray-200 px-6 py-3">
              <h2 className="font-semibold text-gray-900">{month}</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="sticky left-0 z-10 bg-gray-50 px-4 py-2 text-left font-medium text-gray-500">
                      Room
                    </th>
                    {monthDays.map((day) => (
                      <th
                        key={day.toISOString()}
                        className="min-w-[28px] px-0.5 py-2 text-center font-medium text-gray-400"
                      >
                        <div>{format(day, "dd")}</div>
                        <div className="text-[10px]">
                          {format(day, "EEE").charAt(0)}
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rooms.map((room) => (
                    <tr key={room.id} className="border-b border-gray-100">
                      <td className="sticky left-0 z-10 bg-white px-4 py-2 font-medium text-gray-700 whitespace-nowrap">
                        {room.nameEn}
                        <span className="ml-1 text-gray-400">
                          ({room.totalUnits})
                        </span>
                      </td>
                      {monthDays.map((day) => {
                        const key = format(day, "yyyy-MM-dd");
                        const booked = occupancyMap[room.id]?.[key] || 0;
                        const isBlocked =
                          blockedMap[room.id]?.has(key) || false;
                        const isFull = booked >= room.totalUnits;
                        const isPartial = booked > 0 && !isFull;

                        let bgColor = "bg-green-100";
                        if (isBlocked) bgColor = "bg-gray-300";
                        else if (isFull) bgColor = "bg-red-200";
                        else if (isPartial) bgColor = "bg-yellow-200";

                        return (
                          <td key={key} className="px-0.5 py-1.5 text-center">
                            <div
                              className={`mx-auto h-5 w-5 rounded text-[10px] leading-5 font-medium ${bgColor}`}
                              title={`${room.nameEn}: ${booked}/${room.totalUnits} booked${isBlocked ? " (blocked)" : ""}`}
                            >
                              {booked > 0 && !isBlocked ? booked : ""}
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );
      })}
    </div>
  );
}
