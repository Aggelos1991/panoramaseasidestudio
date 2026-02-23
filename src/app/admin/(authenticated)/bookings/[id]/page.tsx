"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import {
  ArrowLeft,
  Calendar,
  User,
  Mail,
  Phone,
  Globe,
  Receipt,
  MessageSquare,
} from "lucide-react";

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
  paymentMethod: string | null;
  paymentNotes: string | null;
  gdprConsent: boolean;
  createdAt: string;
  room: { nameEn: string; slug: string };
};

const statusColors: Record<string, string> = {
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

  async function updateStatus(status: string) {
    setUpdating(true);
    try {
      const res = await fetch(`/api/bookings/${params.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (res.ok) {
        const updated = await res.json();
        setBooking((prev) => (prev ? { ...prev, ...updated } : null));
      }
    } catch {
      alert("Failed to update booking");
    } finally {
      setUpdating(false);
    }
  }

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center text-gray-400">
        Loading...
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="flex h-64 items-center justify-center text-gray-400">
        Booking not found
      </div>
    );
  }

  return (
    <div>
      <button
        onClick={() => router.push("/admin/bookings")}
        className="mb-6 flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700"
      >
        <ArrowLeft className="h-4 w-4" /> Back to Bookings
      </button>

      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {booking.referenceNumber}
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Created {format(new Date(booking.createdAt), "MMM dd, yyyy HH:mm")}
          </p>
        </div>
        <span
          className={cn(
            "rounded-full px-4 py-1.5 text-sm font-medium",
            statusColors[booking.status],
          )}
        >
          {booking.status}
        </span>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        {/* Booking Details */}
        <div className="rounded-xl border border-gray-200 bg-white p-6">
          <h2 className="font-semibold text-gray-900">Booking Details</h2>
          <div className="mt-4 space-y-3">
            <div className="flex items-center gap-3 text-sm">
              <Calendar className="h-4 w-4 text-gray-400" />
              <span className="text-gray-500">Room:</span>
              <span className="font-medium">{booking.room.nameEn}</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <Calendar className="h-4 w-4 text-gray-400" />
              <span className="text-gray-500">Check-in:</span>
              <span className="font-medium">
                {format(new Date(booking.checkIn), "MMM dd, yyyy")}
              </span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <Calendar className="h-4 w-4 text-gray-400" />
              <span className="text-gray-500">Check-out:</span>
              <span className="font-medium">
                {format(new Date(booking.checkOut), "MMM dd, yyyy")}
              </span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <span className="ml-7 text-gray-500">Nights:</span>
              <span className="font-medium">{booking.nights}</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <span className="ml-7 text-gray-500">Guests:</span>
              <span className="font-medium">{booking.guests}</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <Receipt className="h-4 w-4 text-gray-400" />
              <span className="text-gray-500">Total:</span>
              <span className="text-lg font-bold text-terracotta">
                &euro;{Number(booking.totalPrice)}
              </span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <span className="ml-7 text-gray-500">Payment:</span>
              <span
                className={cn(
                  "rounded-full px-2 py-0.5 text-xs font-medium",
                  booking.paymentStatus === "PAID"
                    ? "bg-green-100 text-green-700"
                    : "bg-yellow-100 text-yellow-700",
                )}
              >
                {booking.paymentStatus}
              </span>
            </div>
          </div>
        </div>

        {/* Guest Details */}
        <div className="rounded-xl border border-gray-200 bg-white p-6">
          <h2 className="font-semibold text-gray-900">Guest Information</h2>
          <div className="mt-4 space-y-3">
            <div className="flex items-center gap-3 text-sm">
              <User className="h-4 w-4 text-gray-400" />
              <span className="font-medium">
                {booking.guestFirstName} {booking.guestLastName}
              </span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <Mail className="h-4 w-4 text-gray-400" />
              <a
                href={`mailto:${booking.guestEmail}`}
                className="text-terracotta hover:underline"
              >
                {booking.guestEmail}
              </a>
            </div>
            {booking.guestPhone && (
              <div className="flex items-center gap-3 text-sm">
                <Phone className="h-4 w-4 text-gray-400" />
                <span>{booking.guestPhone}</span>
              </div>
            )}
            {booking.guestCountry && (
              <div className="flex items-center gap-3 text-sm">
                <Globe className="h-4 w-4 text-gray-400" />
                <span>{booking.guestCountry}</span>
              </div>
            )}
            {booking.specialRequests && (
              <div className="mt-4 border-t border-gray-200 pt-4">
                <div className="flex items-start gap-3 text-sm">
                  <MessageSquare className="mt-0.5 h-4 w-4 text-gray-400" />
                  <div>
                    <p className="font-medium text-gray-500">
                      Special Requests
                    </p>
                    <p className="mt-1 text-gray-700">
                      {booking.specialRequests}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* GDPR Info */}
      <div className="mt-6 rounded-xl border border-gray-200 bg-white p-6">
        <h2 className="font-semibold text-gray-900">Data & Consent</h2>
        <div className="mt-3 flex items-center gap-2 text-sm">
          <span className={cn(
            "rounded-full px-2 py-0.5 text-xs font-medium",
            booking.gdprConsent ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
          )}>
            {booking.gdprConsent ? "GDPR Consent Given" : "No GDPR Consent"}
          </span>
        </div>
      </div>

      {/* Actions */}
      <div className="mt-6 flex flex-wrap gap-3">
        {booking.status === "PENDING" && (
          <Button
            onClick={() => updateStatus("CONFIRMED")}
            disabled={updating}
          >
            Confirm Booking
          </Button>
        )}
        {booking.status === "CONFIRMED" && (
          <Button
            variant="secondary"
            onClick={() => updateStatus("COMPLETED")}
            disabled={updating}
          >
            Mark as Completed
          </Button>
        )}
        {booking.paymentStatus === "UNPAID" && (booking.status === "PENDING" || booking.status === "CONFIRMED") && (
          <Button
            variant="secondary"
            onClick={async () => {
              setUpdating(true);
              try {
                const res = await fetch(`/api/bookings/${params.id}`, {
                  method: "PATCH",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ paymentStatus: "PAID" }),
                });
                if (res.ok) {
                  const updated = await res.json();
                  setBooking((prev) => (prev ? { ...prev, ...updated } : null));
                }
              } catch {
                alert("Failed to update payment");
              } finally {
                setUpdating(false);
              }
            }}
            disabled={updating}
          >
            Mark as Paid
          </Button>
        )}
        {(booking.status === "PENDING" ||
          booking.status === "CONFIRMED") && (
          <Button
            variant="danger"
            onClick={() => updateStatus("CANCELLED")}
            disabled={updating}
          >
            Cancel Booking
          </Button>
        )}
        {booking.status === "CONFIRMED" && (
          <Button
            variant="ghost"
            onClick={() => updateStatus("NO_SHOW")}
            disabled={updating}
          >
            Mark No-Show
          </Button>
        )}
      </div>
    </div>
  );
}
