import { prisma } from "@/lib/prisma";
import { format } from "date-fns";
import Link from "next/link";
import { decryptPII, BOOKING_PII_FIELDS } from "@/lib/gdpr-crypto";

const STATUS: Record<string, string> = {
  PENDING: "bg-yellow-100 text-yellow-700",
  CONFIRMED: "bg-green-100 text-green-700",
  CANCELLED: "bg-red-100 text-red-700",
  COMPLETED: "bg-blue-100 text-blue-700",
  NO_SHOW: "bg-gray-100 text-gray-700",
};

async function getBookings() {
  const raw = await prisma.booking.findMany({
    include: { room: true },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
  return raw.map((b) =>
    decryptPII(b as unknown as Record<string, unknown>, [...BOOKING_PII_FIELDS]),
  ) as unknown as typeof raw;
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
      <h1 className="text-2xl font-bold text-gray-900">Bookings</h1>
      <p className="mt-1 text-sm text-gray-500">Manage all reservations</p>

      <div className="mt-6 rounded-xl border border-gray-200 bg-white">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b bg-gray-50 text-xs uppercase text-gray-500">
              <tr>
                <th className="px-5 py-2.5 text-left">Guest</th>
                <th className="px-5 py-2.5 text-left">Room</th>
                <th className="px-5 py-2.5 text-left">Dates</th>
                <th className="px-5 py-2.5 text-left">Status</th>
                <th className="px-5 py-2.5 text-right">Total</th>
                <th className="px-5 py-2.5 text-right" />
              </tr>
            </thead>
            <tbody className="divide-y">
              {bookings.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-gray-400">
                    No bookings yet
                  </td>
                </tr>
              ) : (
                bookings.map((b) => (
                  <tr key={b.id} className="hover:bg-gray-50">
                    <td className="px-5 py-3">
                      <p className="font-medium text-gray-900">
                        {b.guestFirstName} {b.guestLastName}
                      </p>
                      <p className="text-xs text-gray-400">{b.guestEmail}</p>
                    </td>
                    <td className="px-5 py-3 text-gray-500">{b.room.nameEn}</td>
                    <td className="px-5 py-3 text-gray-500 whitespace-nowrap">
                      {format(new Date(b.checkIn), "MMM dd")} &ndash;{" "}
                      {format(new Date(b.checkOut), "MMM dd")}
                      <span className="ml-1 text-xs text-gray-400">({b.nights}n)</span>
                    </td>
                    <td className="px-5 py-3">
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS[b.status] || "bg-gray-100"}`}>
                        {b.status}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-right font-medium">
                      &euro;{Number(b.totalPrice)}
                    </td>
                    <td className="px-5 py-3 text-right">
                      <Link
                        href={`/admin/bookings/${b.id}`}
                        className="text-sm text-terracotta hover:underline"
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
