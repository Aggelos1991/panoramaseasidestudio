import { prisma } from "@/lib/prisma";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import Link from "next/link";

const statusColors: Record<string, string> = {
  PENDING: "bg-yellow-100 text-yellow-700",
  CONFIRMED: "bg-green-100 text-green-700",
  CANCELLED: "bg-red-100 text-red-700",
  COMPLETED: "bg-blue-100 text-blue-700",
  NO_SHOW: "bg-gray-100 text-gray-700",
};

async function getBookings() {
  return prisma.booking.findMany({
    include: { room: true },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
}

export default async function AdminBookingsPage() {
  let bookings: Awaited<ReturnType<typeof getBookings>> = [];
  try {
    bookings = await getBookings();
  } catch {
    // DB not connected
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Bookings</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage all hotel bookings
          </p>
        </div>
      </div>

      <div className="mt-8 rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-gray-200 bg-gray-50 text-xs uppercase text-gray-500">
              <tr>
                <th className="px-6 py-3">Reference</th>
                <th className="px-6 py-3">Guest</th>
                <th className="px-6 py-3">Room</th>
                <th className="px-6 py-3">Check-in</th>
                <th className="px-6 py-3">Check-out</th>
                <th className="px-6 py-3">Nights</th>
                <th className="px-6 py-3">Total</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3">Payment</th>
                <th className="px-6 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {bookings.length === 0 ? (
                <tr>
                  <td
                    colSpan={10}
                    className="px-6 py-12 text-center text-gray-400"
                  >
                    No bookings yet
                  </td>
                </tr>
              ) : (
                bookings.map((booking) => (
                  <tr key={booking.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 font-mono text-sm font-medium text-terracotta">
                      {booking.referenceNumber}
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-medium text-gray-900">
                          {booking.guestFirstName} {booking.guestLastName}
                        </p>
                        <p className="text-xs text-gray-400">
                          {booking.guestEmail}
                        </p>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-500">
                      {booking.room.nameEn}
                    </td>
                    <td className="px-6 py-4 text-gray-500">
                      {format(new Date(booking.checkIn), "MMM dd, yyyy")}
                    </td>
                    <td className="px-6 py-4 text-gray-500">
                      {format(new Date(booking.checkOut), "MMM dd, yyyy")}
                    </td>
                    <td className="px-6 py-4 text-gray-500">
                      {booking.nights}
                    </td>
                    <td className="px-6 py-4 font-medium text-gray-900">
                      &euro;{Number(booking.totalPrice)}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={cn(
                          "inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium",
                          statusColors[booking.status] || "bg-gray-100",
                        )}
                      >
                        {booking.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={cn(
                          "inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium",
                          booking.paymentStatus === "PAID"
                            ? "bg-green-100 text-green-700"
                            : "bg-yellow-100 text-yellow-700",
                        )}
                      >
                        {booking.paymentStatus}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <Link
                        href={`/admin/bookings/${booking.id}`}
                        className="text-sm font-medium text-terracotta hover:underline"
                      >
                        View
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
