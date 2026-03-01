import { prisma } from "@/lib/prisma";
import { CalendarCheck, Euro, BedDouble, TrendingUp, Calendar, Users, Link2 } from "lucide-react";
import { format, startOfMonth, endOfMonth, startOfDay, endOfDay } from "date-fns";
import { decryptPII, BOOKING_PII_FIELDS } from "@/lib/gdpr-crypto";
import { PageHeader } from "@/components/admin/page-header";
import { StatCard } from "@/components/admin/stat-card";
import { BookingsTable } from "../bookings/bookings-table";

const PLATFORM_BADGE: Record<string, { label: string; cls: string }> = {
  BOOKING_COM: { label: "Booking.com", cls: "bg-blue-50 text-blue-700 border border-blue-200/50" },
  EXPEDIA: { label: "Expedia", cls: "bg-yellow-50 text-yellow-700 border border-yellow-200/50" },
  AIRBNB: { label: "Airbnb", cls: "bg-rose-50 text-rose-700 border border-rose-200/50" },
  VRBO: { label: "VRBO", cls: "bg-indigo-50 text-indigo-700 border border-indigo-200/50" },
  OTHER: { label: "Other", cls: "bg-gray-50 text-gray-600 border border-gray-200/50" },
};

async function getStats() {
  const now = new Date();
  const monthStart = startOfMonth(now);
  const monthEnd = endOfMonth(now);
  const todayStart = startOfDay(now);
  const todayEnd = endOfDay(now);

  const [
    bookingsMonth,
    revenueMonth,
    roomCount,
    channelBookingsMonth,
    todayCheckInsInternal,
    todayCheckInsExternal,
    todayCheckOutsInternal,
    todayCheckOutsExternal,
    allBookings,
    recentExternal,
  ] = await Promise.all([
    prisma.booking.count({
      where: {
        status: "CONFIRMED",
        createdAt: { gte: monthStart, lte: monthEnd },
      },
    }),
    prisma.booking.aggregate({
      where: {
        status: "CONFIRMED",
        createdAt: { gte: monthStart, lte: monthEnd },
      },
      _sum: { totalPrice: true },
    }),
    prisma.room.count({ where: { isActive: true } }),
    prisma.externalBooking.count({
      where: {
        createdAt: { gte: monthStart, lte: monthEnd },
      },
    }),
    prisma.booking.count({
      where: {
        status: "CONFIRMED",
        checkIn: { gte: todayStart, lte: todayEnd },
      },
    }),
    prisma.externalBooking.count({
      where: {
        checkIn: { gte: todayStart, lte: todayEnd },
      },
    }),
    prisma.booking.count({
      where: {
        status: "CONFIRMED",
        checkOut: { gte: todayStart, lte: todayEnd },
      },
    }),
    prisma.externalBooking.count({
      where: {
        checkOut: { gte: todayStart, lte: todayEnd },
      },
    }),
    // All bookings for the table
    prisma.booking.findMany({
      include: { room: true },
      orderBy: { createdAt: "desc" },
      take: 100,
    }),
    // Last 5 external bookings
    prisma.externalBooking.findMany({
      include: { room: true, channel: true },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
  ]);

  return {
    bookingsMonth,
    revenue: Number(revenueMonth._sum.totalPrice || 0),
    roomCount,
    channelBookingsMonth,
    todayCheckIns: todayCheckInsInternal + todayCheckInsExternal,
    todayCheckOuts: todayCheckOutsInternal + todayCheckOutsExternal,
    allBookings: allBookings.map(
      (b) =>
        decryptPII(b as unknown as Record<string, unknown>, [
          ...BOOKING_PII_FIELDS,
        ]) as unknown as typeof b,
    ),
    recentExternal,
  };
}

type DashboardStats = Awaited<ReturnType<typeof getStats>>;

const DEFAULTS: DashboardStats = {
  bookingsMonth: 0,
  revenue: 0,
  roomCount: 0,
  channelBookingsMonth: 0,
  todayCheckIns: 0,
  todayCheckOuts: 0,
  allBookings: [],
  recentExternal: [],
};

export default async function AdminDashboardPage() {
  let stats: DashboardStats;
  try {
    stats = await getStats();
  } catch {
    stats = DEFAULTS;
  }

  const cards = [
    { label: "Bookings", value: stats.bookingsMonth, icon: CalendarCheck, color: "text-blue-600", bg: "bg-blue-100/80", accent: "border-l-blue-500" },
    { label: "Revenue", value: `\u20AC${stats.revenue.toLocaleString()}`, icon: Euro, color: "text-emerald-600", bg: "bg-emerald-100/80", accent: "border-l-emerald-500" },
    { label: "Active Rooms", value: stats.roomCount, icon: BedDouble, color: "text-violet-600", bg: "bg-violet-100/80", accent: "border-l-violet-500" },
    { label: "Channel Bookings", value: stats.channelBookingsMonth, icon: Link2, color: "text-amber-600", bg: "bg-amber-100/80", accent: "border-l-amber-500" },
  ];

  const monthName = format(new Date(), "MMMM yyyy");

  // Serialize bookings for client component
  const serializedBookings = stats.allBookings.map((b) => ({
    id: b.id,
    guestFirstName: b.guestFirstName,
    guestLastName: b.guestLastName,
    guestEmail: b.guestEmail,
    checkIn: b.checkIn.toISOString(),
    checkOut: b.checkOut.toISOString(),
    nights: b.nights,
    totalPrice: String(b.totalPrice),
    status: b.status,
    room: { nameEn: b.room.nameEn },
  }));

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Welcome back"
        subtitle={`Here\u2019s what\u2019s happening with your property in ${monthName}`}
        icon={TrendingUp}
      />

      {/* Stats */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        {cards.map((s, i) => (
          <StatCard key={s.label} index={i} label={s.label} value={s.value} icon={s.icon} color={s.color} bg={s.bg} accent={s.accent} />
        ))}
      </div>

      {/* Today's Overview */}
      <div
        className="mt-6 grid gap-4 grid-cols-2"
        style={{ animation: "slide-up 0.4s ease-out 0.32s both" }}
      >
        <div className="flex items-center gap-4 rounded-2xl bg-white p-5 shadow-sm">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50">
            <Calendar className="h-5 w-5 text-blue-500" />
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900">{stats.todayCheckIns}</p>
            <p className="text-xs font-medium text-gray-400">Check-ins Today</p>
          </div>
        </div>
        <div className="flex items-center gap-4 rounded-2xl bg-white p-5 shadow-sm">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-orange-50">
            <Users className="h-5 w-5 text-orange-500" />
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900">{stats.todayCheckOuts}</p>
            <p className="text-xs font-medium text-gray-400">Check-outs Today</p>
          </div>
        </div>
      </div>

      {/* Website Bookings — with search & filters */}
      <div className="mt-6" style={{ animation: "slide-up 0.4s ease-out 0.35s both" }}>
        <h2 className="mb-3 text-base font-semibold text-gray-900">Website Bookings</h2>
        <BookingsTable bookings={serializedBookings} />
      </div>

      {/* Channel Activity */}
      <div
        className="mt-6 overflow-hidden rounded-2xl bg-white shadow-sm"
        style={{ animation: "slide-up 0.4s ease-out 0.4s both" }}
      >
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
          <h2 className="text-base font-semibold text-gray-900">Channel Activity</h2>
          <div className="inline-flex items-center gap-1.5 rounded-lg bg-amber-50 px-3 py-1.5 text-xs font-medium text-amber-700">
            <Link2 className="h-3 w-3" />
            External Platforms
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50/80">
              <tr>
                <th className="px-3 sm:px-6 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-gray-400">Summary</th>
                <th className="px-3 sm:px-6 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-gray-400">Room</th>
                <th className="px-3 sm:px-6 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-gray-400">Dates</th>
                <th className="px-3 sm:px-6 py-3 text-right text-[11px] font-semibold uppercase tracking-wider text-gray-400">Platform</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {stats.recentExternal.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-12 text-center text-sm text-gray-300">
                    No channel bookings yet
                  </td>
                </tr>
              ) : (
                stats.recentExternal.map((eb) => {
                  const badge = PLATFORM_BADGE[eb.channel.platform] ?? PLATFORM_BADGE.OTHER;
                  return (
                    <tr key={eb.id} className="transition-colors hover:bg-gray-50/50">
                      <td className="px-3 sm:px-6 py-4">
                        <span className="font-medium text-gray-900">{eb.summary || "Untitled reservation"}</span>
                      </td>
                      <td className="px-3 sm:px-6 py-4 text-gray-500">{eb.room.nameEn}</td>
                      <td className="px-3 sm:px-6 py-4 text-gray-500 whitespace-nowrap">
                        {format(new Date(eb.checkIn), "MMM dd")} &ndash; {format(new Date(eb.checkOut), "MMM dd")}
                      </td>
                      <td className="px-3 sm:px-6 py-4 text-right">
                        <span className={`inline-block rounded-md px-2.5 py-1 text-[11px] font-semibold ${badge.cls}`}>
                          {badge.label}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
