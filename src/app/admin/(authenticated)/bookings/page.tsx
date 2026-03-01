import { prisma } from "@/lib/prisma";
import { decryptPII, BOOKING_PII_FIELDS } from "@/lib/gdpr-crypto";
import { CalendarCheck } from "lucide-react";
import { BookingsTable } from "./bookings-table";
import { PageHeader } from "@/components/admin/page-header";

async function getBookings() {
  const raw = await prisma.booking.findMany({
    include: { room: true },
    orderBy: { createdAt: "desc" },
    take: 100,
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

  const serialized = bookings.map((b) => ({
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

  const confirmedCount = bookings.filter((b) => b.status === "CONFIRMED").length;
  const cancelledCount = bookings.filter((b) => b.status === "CANCELLED").length;
  const revenue = bookings
    .filter((b) => b.status === "CONFIRMED")
    .reduce((sum, b) => sum + Number(b.totalPrice), 0);

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Bookings"
        subtitle="Manage all reservations and guest details"
        icon={CalendarCheck}
      />

      {/* Quick stats */}
      <div className="mb-6 grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="rounded-xl bg-white p-4 shadow-sm">
          <p className="text-2xl font-bold text-gray-900">{bookings.length}</p>
          <p className="text-xs font-medium text-gray-400">Total Bookings</p>
        </div>
        <div className="rounded-xl bg-white p-4 shadow-sm">
          <p className="text-2xl font-bold text-emerald-600">{confirmedCount}</p>
          <p className="text-xs font-medium text-gray-400">Active</p>
        </div>
        <div className="rounded-xl bg-white p-4 shadow-sm">
          <p className="text-2xl font-bold text-red-600">{cancelledCount}</p>
          <p className="text-xs font-medium text-gray-400">Cancelled</p>
        </div>
        <div className="rounded-xl bg-white p-4 shadow-sm">
          <p className="text-2xl font-bold text-gray-900">&euro;{revenue}</p>
          <p className="text-xs font-medium text-gray-400">Revenue</p>
        </div>
      </div>

      <BookingsTable bookings={serialized} />
    </div>
  );
}
