"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Package,
  Sparkles,
  Search,
  Filter,
  Clock,
  Navigation,
  CheckCircle2,
  AlertCircle,
  Building2,
  Send,
  X,
  Info,
} from "lucide-react";

export default function ShelterDonationsMarketplace() {
  const [matches, setMatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [dietaryFilter, setDietaryFilter] = useState("ALL");
  const [categoryFilter, setCategoryFilter] = useState("ALL");

  // Claim modal state
  const [selectedMatch, setSelectedMatch] = useState<any | null>(null);
  const [requestQty, setRequestQty] = useState<number>(1);
  const [notes, setNotes] = useState("");
  const [requesting, setRequesting] = useState(false);

  const fetchMatches = () => {
    setLoading(true);
    fetch("/api/matches")
      .then((r) => r.json())
      .then((data) => {
        setMatches(data.matches || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    fetchMatches();
  }, []);

  async function handleRequestFood(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedMatch) return;
    setRequesting(true);

    try {
      const idempotencyKey = `req_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      const res = await fetch("/api/offers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          donationId: selectedMatch.donation.id,
          quantity: requestQty,
          notes,
          idempotencyKey,
        }),
      });

      const data = await res.json();
      setRequesting(false);

      if (!res.ok) {
        alert(data.error || "Failed to submit request");
        return;
      }

      alert("Request submitted successfully! The food provider has been notified.");
      setSelectedMatch(null);
      fetchMatches();
    } catch {
      setRequesting(false);
      alert("Network error submitting request");
    }
  }

  const filteredMatches = matches.filter((m) => {
    const d = m.donation;
    const matchesSearch =
      search === "" ||
      d.title.toLowerCase().includes(search.toLowerCase()) ||
      d.category.toLowerCase().includes(search.toLowerCase());
    const matchesDietary = dietaryFilter === "ALL" || d.dietary === dietaryFilter;
    const matchesCategory = categoryFilter === "ALL" || d.category === categoryFilter;
    return matchesSearch && matchesDietary && matchesCategory;
  });

  return (
    <main className="mx-auto max-w-7xl px-4 sm:px-6 py-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-forest">
            Available Surplus Food Marketplace
          </h1>
          <p className="mt-1 text-xs text-ink/65">
            Real-time surplus listings matched to your shelter's dietary requirements and daily capacity.
          </p>
        </div>

        <Link
          href="/shelter/requests"
          className="btn-ghost py-2 px-4 text-xs font-semibold bg-white shadow-2xs"
        >
          View My Allocation Requests
        </Link>
      </div>

      {/* Filter and Search Bar */}
      <div className="mb-6 flex flex-wrap gap-3 items-center rounded-xl border border-ink/10 bg-white p-3.5 shadow-xs">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ink/40" />
          <input
            type="text"
            placeholder="Search by food title or category..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input pl-9 py-1.5 text-xs"
          />
        </div>

        <select
          value={dietaryFilter}
          onChange={(e) => setDietaryFilter(e.target.value)}
          className="input w-auto py-1.5 text-xs bg-white"
        >
          <option value="ALL">All Dietary</option>
          <option value="VEG">Vegetarian Only</option>
          <option value="NON_VEG">Non-Vegetarian</option>
        </select>
      </div>

      {/* Matches Grid */}
      {loading ? (
        <div className="p-16 text-center text-xs text-ink/50 animate-pulse">
          Evaluating matching engine rules for current food surplus...
        </div>
      ) : filteredMatches.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-ink/15 p-12 text-center bg-white">
          <Package className="mx-auto h-10 w-10 text-ink/30 mb-3" />
          <h3 className="text-sm font-semibold text-ink/80">No active surplus listings match filters</h3>
          <p className="mt-1 text-xs text-ink/60">
            Check back soon as local restaurants and bakeries publish surplus throughout the day.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredMatches.map((m) => {
            const d = m.donation;
            const hoursLeft = m.metrics.hoursLeft;

            return (
              <div
                key={d.id}
                className="rounded-2xl border border-ink/10 bg-white p-6 shadow-xs flex flex-col justify-between hover:border-forest/40 transition-all hover:shadow-sm"
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <span className="rounded-full bg-forest/10 px-2.5 py-0.5 text-[10px] font-bold text-forest">
                      {d.category}
                    </span>

                    <div className="flex items-center gap-1 rounded-full bg-sage/60 px-2.5 py-0.5 text-[11px] font-bold text-forest">
                      <Sparkles className="h-3 w-3 text-amber-warn" />
                      <span>{m.score}/100 Match</span>
                    </div>
                  </div>

                  <h3 className="text-base font-bold text-forest line-clamp-1">{d.title}</h3>
                  <p className="text-xs text-ink/60 mt-0.5">
                    Offered by <span className="font-semibold text-ink">{d.donor?.name || "Verified Provider"}</span>
                  </p>

                  {/* Quantity and Expiry Badges */}
                  <div className="mt-4 flex flex-wrap gap-2 text-xs">
                    <span className="rounded-lg bg-cream px-2.5 py-1 text-ink font-semibold border border-ink/10">
                      {d.remainingQuantity} {d.unit} remaining
                    </span>
                    <span
                      className={`rounded-lg px-2.5 py-1 text-xs font-semibold ${
                        d.dietary === "VEG"
                          ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                          : "bg-amber-50 text-amber-800 border border-amber-200"
                      }`}
                    >
                      {d.dietary}
                    </span>
                  </div>

                  <div className="mt-4 space-y-1.5 text-xs text-ink/70 border-t border-ink/10 pt-3">
                    <div className="flex items-center gap-1.5">
                      <Clock className="h-3.5 w-3.5 text-ink/40" />
                      <span>
                        Deadline: {hoursLeft > 0 ? `${hoursLeft.toFixed(1)}h remaining` : "Expired"}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Navigation className="h-3.5 w-3.5 text-ink/40" />
                      <span>
                        ~{m.metrics.distanceKm} km straight-line (est. {m.metrics.estimatedTransitMins}m travel)
                      </span>
                    </div>
                  </div>

                  {/* Explanations summary */}
                  <div className="mt-3 space-y-1">
                    {m.explanations.slice(0, 2).map((exp: string, idx: number) => (
                      <p key={idx} className="text-[11px] text-emerald-800 flex items-center gap-1.5">
                        <CheckCircle2 className="h-3 w-3 shrink-0" />
                        {exp}
                      </p>
                    ))}
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-ink/10 flex items-center justify-between">
                  <span className="text-[11px] text-ink/50">
                    Storage: {d.storageRequirements || "AMBIENT"}
                  </span>

                  <button
                    onClick={() => {
                      setSelectedMatch(m);
                      setRequestQty(Math.min(10, d.remainingQuantity));
                    }}
                    className="btn py-1.5 px-4 text-xs font-semibold shadow-xs flex items-center gap-1.5"
                  >
                    Request Food
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Claim Modal */}
      {selectedMatch && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-forest">Request Food Allocation</h3>
              <button
                onClick={() => setSelectedMatch(null)}
                className="rounded-lg p-1 text-ink/40 hover:text-ink/80"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleRequestFood} className="space-y-4 text-xs">
              <div>
                <p className="font-semibold text-sm text-ink">{selectedMatch.donation.title}</p>
                <p className="text-ink/60">
                  Donor: {selectedMatch.donation.donor?.name} • Up to{" "}
                  {selectedMatch.donation.remainingQuantity} {selectedMatch.donation.unit} available
                </p>
              </div>

              <div>
                <label className="mb-1 block font-medium text-ink/80">
                  Requested Quantity ({selectedMatch.donation.unit})
                </label>
                <input
                  type="number"
                  min="0.1"
                  max={selectedMatch.donation.remainingQuantity}
                  step="0.1"
                  required
                  value={requestQty}
                  onChange={(e) => setRequestQty(Number(e.target.value))}
                  className="input"
                />
              </div>

              <div>
                <label className="mb-1 block font-medium text-ink/80">
                  Delivery / Pickup Coordination Note
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Our van can collect today at 16:30, contact driver Dave on arrival."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="input"
                />
              </div>

              <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-[11px] text-emerald-900 flex items-center gap-2">
                <Info className="h-4 w-4 shrink-0 text-emerald-700" />
                <span>
                  Concurrency protected: quantity is reserved safely upon confirmation to avoid double-allocation.
                </span>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedMatch(null)}
                  className="btn-ghost py-1.5 px-3 text-xs"
                >
                  Cancel
                </button>
                <button className="btn py-1.5 px-4 text-xs font-semibold shadow-xs" disabled={requesting}>
                  {requesting ? "Submitting…" : "Confirm Request"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
