"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Truck,
  Clock,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Filter,
  Search,
  Package,
} from "lucide-react";

export default function AllocationsPage() {
  const [offers, setOffers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetch("/api/offers")
      .then((r) => r.json())
      .then((data) => {
        setOffers(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const filtered = offers.filter((o) => {
    const matchesStatus = statusFilter === "ALL" || o.status === statusFilter;
    const matchesSearch =
      search === "" ||
      o.donation?.title?.toLowerCase().includes(search.toLowerCase()) ||
      o.donor?.name?.toLowerCase().includes(search.toLowerCase()) ||
      o.recipient?.name?.toLowerCase().includes(search.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  return (
    <main className="mx-auto max-w-7xl px-4 sm:px-6 py-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-forest">
            Food Allocations & Logistics
          </h1>
          <p className="mt-1 text-xs text-ink/65">
            Monitor real-time food handovers, scheduled pickups, and completed deliveries.
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="mb-6 flex flex-wrap gap-3 items-center rounded-xl border border-ink/10 bg-white p-3.5 shadow-xs">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ink/40" />
          <input
            type="text"
            placeholder="Search by food title, donor, or shelter..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input pl-9 py-1.5 text-xs"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="input w-auto py-1.5 text-xs bg-white"
        >
          <option value="ALL">All Statuses</option>
          <option value="OFFER_PENDING">Pending Offer</option>
          <option value="ACCEPTED">Accepted / Reserved</option>
          <option value="SCHEDULED">Scheduled</option>
          <option value="PICKUP_CONFIRMED">Picked Up</option>
          <option value="COMPLETED">Completed Delivery</option>
          <option value="CANCELLED">Cancelled</option>
          <option value="FAILED_DELIVERY">Failed Delivery</option>
        </select>
      </div>

      <div className="rounded-2xl border border-ink/10 bg-white shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-xs text-ink/50 animate-pulse">
            Loading allocations...
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center">
            <Truck className="mx-auto h-8 w-8 text-ink/30 mb-2" />
            <p className="text-xs text-ink/60">No allocations match your search criteria.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-ink/10 bg-cream/60 text-ink/70">
                <tr>
                  <th className="py-3 px-4 font-semibold">Allocation ID & Food</th>
                  <th className="py-3 px-4 font-semibold">Donor Organization</th>
                  <th className="py-3 px-4 font-semibold">Recipient Shelter</th>
                  <th className="py-3 px-4 font-semibold">Allocated Qty</th>
                  <th className="py-3 px-4 font-semibold">Current Status</th>
                  <th className="py-3 px-4 font-semibold text-right">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink/10">
                {filtered.map((o) => (
                  <tr key={o._id} className="hover:bg-cream/30 transition-colors">
                    <td className="py-3.5 px-4">
                      <Link
                        href={`/allocations/${o._id}`}
                        className="font-bold text-forest hover:underline block"
                      >
                        #{o._id.slice(-6).toUpperCase()}
                      </Link>
                      <span className="text-[11px] text-ink/70 font-medium">
                        {o.donation?.title || "Food Item"}
                      </span>
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="font-semibold text-ink">{o.donor?.name || "Provider"}</span>
                      <span className="text-[11px] text-ink/50 block">{o.donor?.city}</span>
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="font-semibold text-ink">
                        {o.recipient?.name || "Shelter"}
                      </span>
                      <span className="text-[11px] text-ink/50 block">{o.recipient?.city}</span>
                    </td>

                    <td className="py-3.5 px-4 font-bold text-forest">
                      {o.quantity} {o.donation?.unit}
                    </td>

                    <td className="py-3.5 px-4">
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-[10px] font-semibold ${
                          o.status === "COMPLETED"
                            ? "bg-emerald-100 text-emerald-800"
                            : o.status === "ACCEPTED" || o.status === "SCHEDULED"
                            ? "bg-blue-100 text-blue-800"
                            : o.status === "PICKUP_CONFIRMED"
                            ? "bg-purple-100 text-purple-800"
                            : o.status === "CANCELLED" || o.status === "FAILED_DELIVERY"
                            ? "bg-red-100 text-red-800"
                            : "bg-amber-100 text-amber-800"
                        }`}
                      >
                        {o.status.replace("_", " ")}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <Link
                        href={`/allocations/${o._id}`}
                        className="btn-ghost py-1 px-3 text-[11px] font-semibold inline-flex items-center gap-1"
                      >
                        Timeline →
                      </Link>
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
