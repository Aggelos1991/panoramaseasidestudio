import { prisma } from "@/lib/prisma";
import { CalendarCheck, Euro, Clock, BedDouble } from "lucide-react";
import { format, startOfMonth, endOfMonth } from "date-fns";
import Link from "next/link";
import { decryptPII, BOOKING_PII_FIELDS } from "@/lib/gdpr-crypto";

async function getStats() {
  const now = new Date();
  const monthStart = startOfMonth(now);
  const monthEnd = endOfMonth(now);

  const [bookingsMonth, revenueMonth, pendingCount, roomCount, recentBookings] =
    await Promise.all([
      prisma.booking.count({
        where: {
          createdAt: { gte: monthStart, lte: monthEnd },
          status: { in: ["CONFIRMED", "COMPLETED"] },
        },
      }),
      prisma.booking.aggregate({
        where: {
          createdAt: { gte: monthStart, lte: monthEnd },
          status: { in: ["CONFIRMED", "COMPLETED"] },
        },
        _sum: { totalPrice: true },
      }),
      prisma.booking.count({ where: { status: "PENDING" } }),
      prisma.room.count({ where: { isActive: true } }),
      prisma.booking.findMany({
        include: { room: true },
        orderBy: { createdAt: "desc" },
        take: 10,
      }),
    ]);

  return {
    bookingsMonth,
    revenue: Number(revenueMonth._sum.totalPrice || 0),
    pending: pendingCount,
    rooms: roomCount,
    recent: recentBookings.map(
      (b) =>
        decryptPII(b as unknown as Record<string, unknown>, [
          ...BOOKING_PII_FIELDS,
        ]) as unknown as typeof b,
    ),
  };
}

const STATUS: Record<string, string> = {
  PENDING: "bg-yellow-100 text-yellow-700",
  CONFIRMED: "bg-green-100 text-green-700",
  CANCELLED: "bg-red-100 text-red-700",
  COMPLETED: "bg-blue-100 text-blue-700",
  NO_SHOW: "bg-gray-100 text-gray-700",
};

export default async function AdminDashboardPage() {
  let stats;
  try {
    stats = await getStats();
  } catch {
    stats = { bookingsMonth: 0, revenue: 0, pending: 0, rooms: 0, recent: [] };
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
      <p className="mt-1 text-sm text-gray-500">Hotel overview</p>

      {/* Stats */}
      <div className="mt-6 grid gap-4 grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Bookings", value: stats.bookingsMonth, icon: CalendarCheck, color: "text-blue-600 bg-blue-50" },
          { label: "Revenue", value: `\u20AC${stats.revenue}`, icon: Euro, color: "text-green-600 bg-green-50" },
          { label: "Pending", value: stats.pending, icon: Clock, color: "text-yellow-600 bg-yellow-50" },
          { label: "Rooms", value: stats.rooms, icon: BedDouble, color: "text-purple-600 bg-purple-50" },
        ].map((s) => (
          <div key={s.label} className="rounded-xl border border-gray-200 bg-white p-4">
            <div className={`inline-flex h-9 w-9 items-center justify-center rounded-lg ${s.color}`}>
              <s.icon className="h-4 w-4" />
            </div>
            <p className="mt-2 text-2xl font-bold text-gray-900">{s.value}</p>
            <p className="text-xs text-gray-500">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Recent Bookings */}
      <div className="mt-6 rounded-xl border border-gray-200 bg-white">
        <div className="flex items-center justify-between border-b px-5 py-3">
          <h2 className="font-semibold text-gray-900">Recent Bookings</h2>
          <Link href="/admin/bookings" className="text-sm text-terracotta hover:underline">
            View all
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b bg-gray-50 text-xs uppercase text-gray-500">
              <tr>
                <th className="px-5 py-2.5 text-left">Guest</th>
                <th className="px-5 py-2.5 text-left">Room</th>
                <th className="px-5 py-2.5 text-left">Dates</th>
                <th className="px-5 py-2.5 text-left">Status</th>
                <th className="px-5 py-2.5 text-right">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {stats.recent.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-gray-400">
                    No bookings yet
                  </td>
                </tr>
              ) : (
                stats.recent.map((b) => (
                  <tr key={b.id} className="hover:bg-gray-50">
                    <td className="px-5 py-3">
                      <Link href={`/admin/bookings/${b.id}`} className="font-medium text-gray-900 hover:text-terracotta">
                        {b.guestFirstName} {b.guestLastName}
                      </Link>
                      <p className="text-xs text-gray-400">{b.referenceNumber}</p>
                    </td>
                    <td className="px-5 py-3 text-gray-500">{b.room.nameEn}</td>
                    <td className="px-5 py-3 text-gray-500 whitespace-nowrap">
                      {format(new Date(b.checkIn), "MMM dd")} &ndash; {format(new Date(b.checkOut), "MMM dd")}
                    </td>
                    <td className="px-5 py-3">
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS[b.status] || "bg-gray-100"}`}>
                        {b.status}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-right font-medium">&euro;{Number(b.totalPrice)}</td>
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
