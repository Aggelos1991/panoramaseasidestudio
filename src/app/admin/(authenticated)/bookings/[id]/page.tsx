"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { ArrowLeft, User, Mail, BedDouble, Users, CalendarDays, Moon, Phone, Globe, Shield, MessageSquare } from "lucide-react";

type Booking = {
  id: string;
  referenceNumber: string;
  checkIn: string;
  checkOut: string;
  nights: number;
  guests: number;
  totalPrice: string;
  status: string;
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
  CONFIRMED: "bg-emerald-50 text-emerald-700",
  CANCELLED: "bg-red-50 text-red-600",
};

function statusLabel(s: string) {
  if (s === "CONFIRMED") return "Active";
  if (s === "CANCELLED") return "Cancelled";
  return s.charAt(0) + s.slice(1).toLowerCase();
}

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

  if (loading) return <div className="flex h-64 items-center justify-center text-sm text-gray-400">Loading...</div>;
  if (!booking) return <div className="flex h-64 items-center justify-center text-sm text-gray-400">Booking not found</div>;

  return (
    <div className="animate-fade-in max-w-4xl">
      <button
        onClick={() => router.push("/admin/bookings")}
        className="mb-6 inline-flex items-center gap-1.5 text-sm text-gray-400 transition-colors hover:text-gray-600"
      >
        <ArrowLeft className="h-4 w-4" /> Back to bookings
      </button>

      {/* Header card */}
      <div className="rounded-xl bg-gradient-to-r from-deep-blue to-deep-blue-light p-6 text-white shadow-lg">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs font-medium text-white/50 uppercase tracking-wider">Booking Reference</p>
            <h1 className="mt-1 text-2xl font-bold">{booking.referenceNumber}</h1>
            <p className="mt-1 text-sm text-white/50">
              Created {format(new Date(booking.createdAt), "MMM dd, yyyy")}
            </p>
          </div>
          <span className={`rounded-lg px-3 py-1.5 text-xs font-bold ${STATUS[booking.status] || "bg-gray-100"}`}>
            {statusLabel(booking.status)}
          </span>
        </div>

        {/* Quick stats */}
        <div className="mt-5 grid grid-cols-2 gap-4 border-t border-white/10 pt-5">
          <div>
            <p className="text-[11px] text-white/40 uppercase">Total</p>
            <p className="mt-0.5 text-xl font-bold">&euro;{Number(booking.totalPrice)}</p>
          </div>
          <div>
            <p className="text-[11px] text-white/40 uppercase">Nights</p>
            <p className="mt-0.5 text-xl font-bold">{booking.nights}</p>
          </div>
        </div>
      </div>

      {/* Info cards */}
      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        {/* Guest info */}
        <div className="rounded-xl bg-white p-5 shadow-sm">
          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Guest Information</h3>
          <div className="mt-4 space-y-3.5">
            <InfoRow icon={User} label="Name" value={`${booking.guestFirstName} ${booking.guestLastName}`} />
            <InfoRow icon={Mail} label="Email" value={booking.guestEmail} />
            {booking.guestPhone && <InfoRow icon={Phone} label="Phone" value={booking.guestPhone} />}
            {booking.guestCountry && <InfoRow icon={Globe} label="Country" value={booking.guestCountry} />}
            <InfoRow icon={Shield} label="GDPR Consent" value={booking.gdprConsent ? "Given" : "Not given"} />
          </div>
        </div>

        {/* Stay info */}
        <div className="rounded-xl bg-white p-5 shadow-sm">
          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Stay Details</h3>
          <div className="mt-4 space-y-3.5">
            <InfoRow icon={BedDouble} label="Room" value={booking.room.nameEn} />
            <InfoRow icon={Users} label="Guests" value={`${booking.guests}`} />
            <InfoRow icon={CalendarDays} label="Check-in" value={format(new Date(booking.checkIn), "EEE, MMM dd yyyy")} />
            <InfoRow icon={CalendarDays} label="Check-out" value={format(new Date(booking.checkOut), "EEE, MMM dd yyyy")} />
            <InfoRow icon={Moon} label="Nights" value={`${booking.nights}`} />
          </div>
        </div>
      </div>

      {/* Special requests */}
      {booking.specialRequests && (
        <div className="mt-4 rounded-xl bg-white p-5 shadow-sm">
          <div className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4 text-gray-400" />
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Special Requests</h3>
          </div>
          <p className="mt-3 text-sm leading-relaxed text-gray-600">{booking.specialRequests}</p>
        </div>
      )}

      {/* Actions */}
      {booking.status === "CONFIRMED" && (
        <div className="mt-6 flex flex-wrap gap-2">
          <Button variant="danger" onClick={() => update({ status: "CANCELLED" })} disabled={updating}>
            Cancel Booking
          </Button>
        </div>
      )}
    </div>
  );
}

function InfoRow({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gray-50">
        <Icon className="h-3.5 w-3.5 text-gray-400" />
      </div>
      <div className="min-w-0">
        <p className="text-[11px] text-gray-400">{label}</p>
        <p className="text-sm font-medium text-gray-900 truncate">{value}</p>
      </div>
    </div>
  );
}
