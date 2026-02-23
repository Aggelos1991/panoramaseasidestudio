"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { ArrowLeft } from "lucide-react";

type Booking = {
  id: string;
  referenceNumber: string;
  checkIn: string;
  checkOut: string;
  nights: number;
  guests: number;
  totalPrice: string;
  status: string;
  paymentStatus: string;
  guestFirstName: string;
  guestLastName: string;
  guestEmail: string;
  guestPhone: string | null;
  guestCountry: string | null;
  specialRequests: string | null;
  gdprConsent: boolean;
  createdAt: string;
  room: { nameEn: string };
};

const STATUS: Record<string, string> = {
  PENDING: "bg-yellow-100 text-yellow-700",
  CONFIRMED: "bg-green-100 text-green-700",
  CANCELLED: "bg-red-100 text-red-700",
  COMPLETED: "bg-blue-100 text-blue-700",
  NO_SHOW: "bg-gray-100 text-gray-700",
};

export default function BookingDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    fetch(`/api/bookings/${params.id}`)
      .then((res) => res.json())
      .then(setBooking)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [params.id]);

  async function update(data: Record<string, string>) {
    setUpdating(true);
    try {
      const res = await fetch(`/api/bookings/${params.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (res.ok) {
        const updated = await res.json();
        setBooking((prev) => (prev ? { ...prev, ...updated } : null));
      }
    } catch {
      alert("Failed to update");
    } finally {
      setUpdating(false);
    }
  }

  if (loading) return <div className="py-20 text-center text-gray-400">Loading...</div>;
  if (!booking) return <div className="py-20 text-center text-gray-400">Booking not found</div>;

  return (
    <div className="max-w-3xl">
      <button
        onClick={() => router.push("/admin/bookings")}
        className="mb-4 flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700"
      >
        <ArrowLeft className="h-4 w-4" /> Back
      </button>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">{booking.referenceNumber}</h1>
          <p className="text-sm text-gray-500">
            {format(new Date(booking.createdAt), "MMM dd, yyyy")}
          </p>
        </div>
        <span className={`rounded-full px-3 py-1 text-xs font-medium ${STATUS[booking.status] || "bg-gray-100"}`}>
          {booking.status}
        </span>
      </div>

      {/* Info grid */}
      <div className="mt-6 rounded-xl border border-gray-200 bg-white p-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <Info label="Guest" value={`${booking.guestFirstName} ${booking.guestLastName}`} />
          <Info label="Email" value={booking.guestEmail} />
          <Info label="Room" value={booking.room.nameEn} />
          <Info label="Guests" value={`${booking.guests}`} />
          <Info label="Check-in" value={format(new Date(booking.checkIn), "MMM dd, yyyy")} />
          <Info label="Check-out" value={format(new Date(booking.checkOut), "MMM dd, yyyy")} />
          <Info label="Nights" value={`${booking.nights}`} />
          <Info label="Total" value={`\u20AC${Number(booking.totalPrice)}`} bold />
          {booking.guestPhone && <Info label="Phone" value={booking.guestPhone} />}
          {booking.guestCountry && <Info label="Country" value={booking.guestCountry} />}
          <Info label="Payment" value={booking.paymentStatus} />
          <Info label="GDPR Consent" value={booking.gdprConsent ? "Yes" : "No"} />
        </div>
        {booking.specialRequests && (
          <div className="mt-4 border-t pt-4">
            <p className="text-xs font-medium text-gray-400 uppercase">Special Requests</p>
            <p className="mt-1 text-sm text-gray-700">{booking.specialRequests}</p>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="mt-4 flex flex-wrap gap-2">
        {booking.status === "PENDING" && (
          <Button onClick={() => update({ status: "CONFIRMED" })} disabled={updating}>
            Confirm
          </Button>
        )}
        {booking.status === "CONFIRMED" && (
          <Button variant="secondary" onClick={() => update({ status: "COMPLETED" })} disabled={updating}>
            Complete
          </Button>
        )}
        {booking.paymentStatus === "UNPAID" && ["PENDING", "CONFIRMED"].includes(booking.status) && (
          <Button variant="secondary" onClick={() => update({ paymentStatus: "PAID" })} disabled={updating}>
            Mark Paid
          </Button>
        )}
        {["PENDING", "CONFIRMED"].includes(booking.status) && (
          <Button variant="danger" onClick={() => update({ status: "CANCELLED" })} disabled={updating}>
            Cancel
          </Button>
        )}
      </div>
    </div>
  );
}

function Info({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <div>
      <p className="text-xs font-medium text-gray-400 uppercase">{label}</p>
      <p className={`mt-0.5 text-sm ${bold ? "text-lg font-bold text-terracotta" : "text-gray-900"}`}>
        {value}
      </p>
    </div>
  );
}
