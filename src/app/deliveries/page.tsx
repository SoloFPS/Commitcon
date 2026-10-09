"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Truck,
  MapPin,
  Clock,
  CheckCircle2,
  Phone,
  Navigation,
  ArrowRight,
  Package,
} from "lucide-react";

export default function DeliveriesPortalPage() {
  const [activeDeliveries, setActiveDeliveries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/offers")
      .then((r) => r.json())
      .then((data) => {
        const list = Array.isArray(data) ? data : [];
        // Filter to active logistics in progress
        setActiveDeliveries(
          list.filter((o) =>
            ["ACCEPTED", "SCHEDULED", "PICKUP_CONFIRMED"].includes(o.status)
          )
        );
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  return (
    <main className="mx-auto max-w-7xl px-4 sm:px-6 py-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-forest">
            Active Deliveries & Pickup Schedule
          </h1>
          <p className="mt-1 text-xs text-ink/65">
            Real-time logistics dispatch: active food collections and drop-offs.
          </p>
        </div>

        <Link
          href="/allocations"
          className="btn-ghost py-2 px-4 text-xs font-semibold bg-white shadow-2xs"
        >
          View All Completed History
        </Link>
      </div>

      {loading ? (
        <div className="p-12 text-center text-xs text-ink/50 animate-pulse">
          Loading active delivery runs...
        </div>
      ) : activeDeliveries.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-ink/15 p-12 text-center bg-white">
          <Truck className="mx-auto h-10 w-10 text-ink/30 mb-3" />
          <h3 className="text-sm font-semibold text-ink/80">No active deliveries in progress</h3>
          <p className="mt-1 text-xs text-ink/60">
            When allocations are accepted and scheduled for pickup, they will appear here.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {activeDeliveries.map((o) => (
            <div
              key={o._id}
              className="rounded-2xl border border-ink/10 bg-white p-6 shadow-xs flex flex-col justify-between hover:border-forest/40 transition-all"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-3">
                  <span className="font-mono text-xs font-bold text-ink/40">
                    #{o._id.slice(-6).toUpperCase()}
                  </span>
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-[10px] font-semibold ${
                      o.status === "PICKUP_CONFIRMED"
                        ? "bg-purple-100 text-purple-800"
                        : "bg-blue-100 text-blue-800"
                    }`}
                  >
                    {o.status.replace("_", " ")}
                  </span>
                </div>

                <h3 className="text-base font-bold text-forest line-clamp-1">
                  {o.quantity} {o.donation?.unit} of {o.donation?.title}
                </h3>

                <div className="mt-4 space-y-3 text-xs border-t border-ink/10 pt-3">
                  <div>
                    <span className="font-semibold text-ink flex items-center gap-1.5 mb-0.5">
                      <MapPin className="h-3.5 w-3.5 text-forest" />
                      Pickup From
                    </span>
                    <p className="text-ink/80 font-medium">{o.donor?.name}</p>
                    <p className="text-[11px] text-ink/60">
                      {o.donation?.pickupAddress || o.donor?.address}, {o.donor?.city}
                    </p>
                    {o.donor?.phone && (
                      <p className="text-[11px] text-ink/50 mt-0.5 flex items-center gap-1">
                        <Phone className="h-3 w-3" />
                        {o.donor.phone}
                      </p>
                    )}
                  </div>

                  <div className="border-t border-ink/10 pt-2">
                    <span className="font-semibold text-ink flex items-center gap-1.5 mb-0.5">
                      <Navigation className="h-3.5 w-3.5 text-amber-warn" />
                      Drop-off At
                    </span>
                    <p className="text-ink/80 font-medium">{o.recipient?.name}</p>
                    <p className="text-[11px] text-ink/60">
                      {o.recipient?.address}, {o.recipient?.city}
                    </p>
                    {o.recipient?.phone && (
                      <p className="text-[11px] text-ink/50 mt-0.5 flex items-center gap-1">
                        <Phone className="h-3 w-3" />
                        {o.recipient.phone}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-ink/10 flex items-center justify-between">
                <span className="text-[11px] text-ink/50">
                  {o.scheduledPickupTime
                    ? `Scheduled: ${new Date(o.scheduledPickupTime).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}`
                    : "Flexible pickup"}
                </span>

                <Link
                  href={`/allocations/${o._id}`}
                  className="btn py-1.5 px-3 text-xs font-semibold shadow-xs flex items-center gap-1"
                >
                  Manage Run →
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
