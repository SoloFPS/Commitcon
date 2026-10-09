"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import {
  HeartHandshake,
  Clock,
  CheckCircle2,
  XCircle,
  Truck,
  ArrowRight,
  AlertCircle,
  ExternalLink,
} from "lucide-react";

export default function ShelterRequestsPage() {
  const [offers, setOffers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);

  const fetchOffers = () => {
    setLoading(true);
    fetch("/api/offers")
      .then((r) => r.json())
      .then((data) => {
        setOffers(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    fetchOffers();
  }, []);

  async function handleAction(offerId: string, action: "ACCEPT" | "REJECT") {
    if (!confirm(`Are you sure you want to ${action.toLowerCase()} this offer?`)) return;
    setProcessingId(offerId);

    try {
      const res = await fetch(`/api/offers/${offerId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });

      const data = await res.json();
      setProcessingId(null);

      if (!res.ok) {
        alert(data.error || `Failed to ${action.toLowerCase()} offer`);
        return;
      }

      fetchOffers();
    } catch {
      setProcessingId(null);
      alert("Network error processing offer");
    }
  }

  return (
    <main className="mx-auto max-w-7xl px-4 sm:px-6 py-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-forest">
            My Allocation Requests & Offers
          </h1>
          <p className="mt-1 text-xs text-ink/65">
            Track status, confirm incoming food offers, and monitor active pickups.
          </p>
        </div>

        <Link
          href="/shelter/donations"
          className="btn py-2 px-4 text-xs font-semibold shadow-xs"
        >
          Find More Surplus Food
        </Link>
      </div>

      <div className="rounded-2xl border border-ink/10 bg-white shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-xs text-ink/50 animate-pulse">
            Loading your requests...
          </div>
        ) : offers.length === 0 ? (
          <div className="p-12 text-center">
            <HeartHandshake className="mx-auto h-8 w-8 text-ink/30 mb-2" />
            <p className="text-xs text-ink/60">No allocation requests or offers yet.</p>
            <Link href="/shelter/donations" className="btn mt-3 py-1.5 px-3 text-xs">
              Explore Available Food
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-ink/10 bg-cream/60 text-ink/70">
                <tr>
                  <th className="py-3 px-4 font-semibold">Food Listing & Donor</th>
                  <th className="py-3 px-4 font-semibold">Allocated Quantity</th>
                  <th className="py-3 px-4 font-semibold">Pickup Deadline</th>
                  <th className="py-3 px-4 font-semibold">Status</th>
                  <th className="py-3 px-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink/10">
                {offers.map((o) => (
                  <tr key={o._id} className="hover:bg-cream/30 transition-colors">
                    <td className="py-3.5 px-4">
                      <Link
                        href={`/allocations/${o._id}`}
                        className="font-semibold text-forest hover:underline block"
                      >
                        {o.donation?.title || "Food Item"}
                      </Link>
                      <span className="text-[11px] text-ink/60">
                        Donor: {o.donor?.name || "Provider"} ({o.donor?.city})
                      </span>
                    </td>

                    <td className="py-3.5 px-4 font-bold text-forest">
                      {o.quantity} {o.donation?.unit}
                    </td>

                    <td className="py-3.5 px-4">
                      {o.donation?.pickupDeadline
                        ? new Date(o.donation.pickupDeadline).toLocaleString()
                        : "N/A"}
                    </td>

                    <td className="py-3.5 px-4">
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-[10px] font-semibold ${
                          o.status === "COMPLETED"
                            ? "bg-emerald-100 text-emerald-800"
                            : o.status === "ACCEPTED" || o.status === "SCHEDULED"
                            ? "bg-blue-100 text-blue-800"
                            : o.status === "OFFER_PENDING"
                            ? "bg-amber-100 text-amber-800"
                            : o.status === "CANCELLED"
                            ? "bg-red-100 text-red-800"
                            : "bg-ink/10 text-ink/70"
                        }`}
                      >
                        {o.status.replace("_", " ")}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {o.status === "OFFER_PENDING" && (
                          <>
                            <button
                              onClick={() => handleAction(o._id, "ACCEPT")}
                              disabled={processingId === o._id}
                              className="btn py-1 px-3 text-[11px] font-semibold shadow-xs"
                            >
                              Accept
                            </button>
                            <button
                              onClick={() => handleAction(o._id, "REJECT")}
                              disabled={processingId === o._id}
                              className="btn-ghost py-1 px-2.5 text-[11px] text-red-700 hover:bg-red-50"
                            >
                              Decline
                            </button>
                          </>
                        )}

                        <Link
                          href={`/allocations/${o._id}`}
                          className="btn-ghost py-1 px-2 text-[11px] font-semibold flex items-center gap-1"
                        >
                          <Truck className="h-3 w-3" />
                          Track
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </main>
  );
}
