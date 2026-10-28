import {
  countBookings,
  countExternalBookings,
  listBookings,
  listExternalBookings,
  listRooms,
  sumBookingTotals,
} from "@/lib/store";
import { CalendarCheck, Euro, BedDouble, TrendingUp, Calendar, Users, Link2 } from "lucide-react";
import { format, startOfMonth, endOfMonth, startOfDay, endOfDay } from "date-fns";
import { decryptPII, BOOKING_PII_FIELDS } from "@/lib/gdpr-crypto";
import { PageHeader } from "@/components/admin/page-header";
import { StatCard } from "@/components/admin/stat-card";
import { BookingsTable } from "../bookings/bookings-table";
import { ChannelActivityTable } from "@/components/admin/channel-activity-table";

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
    countBookings({
      status: "CONFIRMED",
      createdFrom: monthStart,
      createdTo: monthEnd,
    }),
    sumBookingTotals({
      status: "CONFIRMED",
      createdFrom: monthStart,
      createdTo: monthEnd,
    }),
    listRooms({ activeOnly: true }).then((rooms) => rooms.length),
    countExternalBookings({
      createdFrom: monthStart,
      createdTo: monthEnd,
    }),
    countBookings({
      status: "CONFIRMED",
      checkInFrom: todayStart,
      checkInTo: todayEnd,
    }),
    countExternalBookings({
      checkInFrom: todayStart,
      checkInTo: todayEnd,
    }),
    countBookings({
      status: "CONFIRMED",
      checkOutFrom: todayStart,
      checkOutTo: todayEnd,
    }),
    countExternalBookings({
      checkOutFrom: todayStart,
      checkOutTo: todayEnd,
    }),
    listBookings({}, { includeRoom: true, take: 100 }),
    listExternalBookings({ take: 50 }),
  ]);

  return {
    bookingsMonth,
    revenue: revenueMonth,
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
    room: { nameEn: b.room?.nameEn || "Room" },
  }));

  const serializedExternal = stats.recentExternal.map((eb) => ({
    id: eb.id,
    summary: eb.summary,
    checkIn: eb.checkIn.toISOString(),
    checkOut: eb.checkOut.toISOString(),
    roomName: eb.room?.nameEn || "Room",
    platform: eb.channel?.platform || "OTHER",
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
      <div className="mt-6" style={{ animation: "slide-up 0.4s ease-out 0.4s both" }}>
        <ChannelActivityTable data={serializedExternal} />
      </div>
    </div>
  );
}
