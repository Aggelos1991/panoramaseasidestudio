import { prisma } from "@/lib/prisma";
import {
  CalendarCheck,
  Euro,
  TrendingUp,
  Users,
  ArrowUpRight,
  BedDouble,
  Clock,
} from "lucide-react";
import { format, startOfMonth, endOfMonth } from "date-fns";
import Link from "next/link";

async function getStats() {
  const now = new Date();
  const monthStart = startOfMonth(now);
  const monthEnd = endOfMonth(now);

  const [
    totalBookingsMonth,
    revenueMonth,
    upcomingCheckins,
    totalGuests,
    pendingBookings,
    totalRooms,
    recentBookings,
  ] = await Promise.all([
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
    prisma.booking.findMany({
      where: {
        checkIn: {
          gte: now,
          lte: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000),
        },
        status: { in: ["PENDING", "CONFIRMED"] },
      },
      include: { room: true },
      orderBy: { checkIn: "asc" },
      take: 10,
    }),
    prisma.booking.aggregate({
      where: {
        createdAt: { gte: monthStart, lte: monthEnd },
        status: { in: ["CONFIRMED", "COMPLETED"] },
      },
      _sum: { guests: true },
    }),
    prisma.booking.count({
      where: { status: "PENDING" },
    }),
    prisma.room.count({
      where: { isActive: true },
    }),
    prisma.booking.findMany({
      include: { room: true },
      orderBy: { createdAt: "desc" },
      take: 20,
    }),
  ]);

  return {
    totalBookingsMonth,
    revenueMonth: Number(revenueMonth._sum.totalPrice || 0),
    upcomingCheckins,
    totalGuests: totalGuests._sum.guests || 0,
    pendingBookings,
    totalRooms,
    recentBookings,
  };
}

const STATUS_BADGES: Record<string, string> = {
  PENDING: "bg-yellow-100 text-yellow-700",
  CONFIRMED: "bg-green-100 text-green-700",
  CANCELLED: "bg-red-100 text-red-700",
  COMPLETED: "bg-blue-100 text-blue-700",
  NO_SHOW: "bg-gray-100 text-gray-700",
};

const PAYMENT_BADGES: Record<string, string> = {
  UNPAID: "bg-red-50 text-red-600",
  PAID: "bg-green-50 text-green-600",
  REFUNDED: "bg-gray-100 text-gray-600",
  PARTIALLY_REFUNDED: "bg-orange-50 text-orange-600",
};

export default async function AdminDashboardPage() {
  let stats;
  try {
    stats = await getStats();
  } catch {
    stats = {
      totalBookingsMonth: 0,
      revenueMonth: 0,
      upcomingCheckins: [],
      totalGuests: 0,
      pendingBookings: 0,
      totalRooms: 0,
      recentBookings: [],
    };
  }

  const statCards = [
    {
      title: "Bookings This Month",
      value: stats.totalBookingsMonth.toString(),
      icon: CalendarCheck,
      color: "bg-blue-50 text-blue-600",
    },
    {
      title: "Revenue This Month",
      value: `\u20AC${stats.revenueMonth.toLocaleString()}`,
      icon: Euro,
      color: "bg-green-50 text-green-600",
    },
    {
      title: "Pending Bookings",
      value: stats.pendingBookings.toString(),
      icon: Clock,
      color: "bg-yellow-50 text-yellow-600",
    },
    {
      title: "Active Rooms",
      value: stats.totalRooms.toString(),
      icon: BedDouble,
      color: "bg-purple-50 text-purple-600",
    },
    {
      title: "Total Guests",
      value: stats.totalGuests.toString(),
      icon: Users,
      color: "bg-indigo-50 text-indigo-600",
    },
    {
      title: "Upcoming Check-ins",
      value: stats.upcomingCheckins.length.toString(),
      icon: TrendingUp,
      color: "bg-orange-50 text-orange-600",
    },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
      <p className="mt-1 text-sm text-gray-500">
        Welcome back. Here&apos;s your hotel overview.
      </p>

      {/* Stats Grid */}
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {statCards.map((card) => (
          <div
            key={card.title}
            className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm"
          >
            <div className="flex items-center justify-between">
              <div
                className={`flex h-10 w-10 items-center justify-center rounded-lg ${card.color}`}
              >
                <card.icon className="h-5 w-5" />
              </div>
              <ArrowUpRight className="h-4 w-4 text-gray-400" />
            </div>
            <p className="mt-3 text-2xl font-bold text-gray-900">
              {card.value}
            </p>
            <p className="mt-1 text-sm text-gray-500">{card.title}</p>
          </div>
        ))}
      </div>

      {/* Upcoming Check-ins */}
      <div className="mt-8 rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-200 px-6 py-4">
          <h2 className="font-semibold text-gray-900">
            Upcoming Check-ins (Next 7 Days)
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-gray-200 bg-gray-50 text-xs uppercase text-gray-500">
              <tr>
                <th className="px-6 py-3">Reference</th>
                <th className="px-6 py-3">Guest</th>
                <th className="px-6 py-3">Room</th>
                <th className="px-6 py-3">Check-in</th>
                <th className="px-6 py-3">Nights</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {stats.upcomingCheckins.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-6 py-8 text-center text-gray-400"
                  >
                    No upcoming check-ins
                  </td>
                </tr>
              ) : (
                stats.upcomingCheckins.map((booking) => (
                  <tr key={booking.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <Link
                        href={`/admin/bookings/${booking.id}`}
                        className="font-mono text-sm font-medium text-terracotta hover:underline"
                      >
                        {booking.referenceNumber}
                      </Link>
                    </td>
                    <td className="px-6 py-4">
                      {booking.guestFirstName} {booking.guestLastName}
                    </td>
                    <td className="px-6 py-4 text-gray-500">
                      {booking.room.nameEn}
                    </td>
                    <td className="px-6 py-4 text-gray-500">
                      {format(new Date(booking.checkIn), "MMM dd")}
                    </td>
                    <td className="px-6 py-4 text-gray-500">
                      {booking.nights}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${STATUS_BADGES[booking.status] || "bg-gray-100 text-gray-700"}`}>
                        {booking.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-medium">
                      &euro;{Number(booking.totalPrice)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* All Recent Bookings */}
      <div className="mt-8 rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
          <h2 className="font-semibold text-gray-900">Recent Bookings</h2>
          <Link
            href="/admin/bookings"
            className="text-sm font-medium text-terracotta hover:underline"
          >
            View All
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-gray-200 bg-gray-50 text-xs uppercase text-gray-500">
              <tr>
                <th className="px-6 py-3">Reference</th>
                <th className="px-6 py-3">Guest</th>
                <th className="px-6 py-3">Email</th>
                <th className="px-6 py-3">Room</th>
                <th className="px-6 py-3">Dates</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3">Payment</th>
                <th className="px-6 py-3">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {stats.recentBookings.length === 0 ? (
                <tr>
                  <td
                    colSpan={8}
                    className="px-6 py-8 text-center text-gray-400"
                  >
                    No bookings yet
                  </td>
                </tr>
              ) : (
                stats.recentBookings.map((booking) => (
                  <tr key={booking.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <Link
                        href={`/admin/bookings/${booking.id}`}
                        className="font-mono text-sm font-medium text-terracotta hover:underline"
                      >
                        {booking.referenceNumber}
                      </Link>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {booking.guestFirstName} {booking.guestLastName}
                    </td>
                    <td className="px-6 py-4 text-gray-500">
                      {booking.guestEmail}
                    </td>
                    <td className="px-6 py-4 text-gray-500 whitespace-nowrap">
                      {booking.room.nameEn}
                    </td>
                    <td className="px-6 py-4 text-gray-500 whitespace-nowrap">
                      {format(new Date(booking.checkIn), "MMM dd")} &ndash;{" "}
                      {format(new Date(booking.checkOut), "MMM dd")}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${STATUS_BADGES[booking.status] || "bg-gray-100 text-gray-700"}`}>
                        {booking.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${PAYMENT_BADGES[booking.paymentStatus] || "bg-gray-100 text-gray-600"}`}>
                        {booking.paymentStatus}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-medium whitespace-nowrap">
                      &euro;{Number(booking.totalPrice)}
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
