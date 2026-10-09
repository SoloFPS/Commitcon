"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  Package,
  ArrowLeft,
  Sparkles,
  Clock,
  Compass,
  CheckCircle2,
  AlertCircle,
  Truck,
  Send,
  Building2,
  Phone,
  User,
  Info,
} from "lucide-react";
import { LocationMap } from "@/components/LocationMap";

export default function DonationDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const [donation, setDonation] = useState<any>(null);
  const [matches, setMatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dispatchingId, setDispatchingId] = useState<string | null>(null);
  const [offerQuantity, setOfferQuantity] = useState<number>(0);
  const [msg, setMsg] = useState("");

  const fetchData = async () => {
    setLoading(true);
    try {
      const [resDonation, resMatches] = await Promise.all([
        fetch(`/api/donations/${id}`).then((r) => r.json()),
        fetch(`/api/donations/${id}/matches`).then((r) => r.json()),
      ]);
      setDonation(resDonation);
      setMatches(resMatches.matches || []);
      setOfferQuantity(resDonation.remainingQuantity || resDonation.totalQuantity || 1);
    } catch {
      setMsg("Failed to load donation details");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) fetchData();
  }, [id]);

  async function handleDispatchOffer(recipientId: string) {
    if (!offerQuantity || offerQuantity <= 0) {
      alert("Please specify a valid quantity");
      return;
    }
    setDispatchingId(recipientId);
    setMsg("");

    try {
      const idempotencyKey = `off_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      const res = await fetch("/api/offers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          donationId: id,
          recipientId,
          quantity: offerQuantity,
          idempotencyKey,
        }),
      });

      const data = await res.json();
      setDispatchingId(null);

      if (!res.ok) {
        alert(data.error || "Failed to dispatch offer");
        return;
      }

      alert("Allocation offer dispatched successfully! The shelter has been notified.");
      router.push(`/allocations/${data._id}`);
    } catch {
      setDispatchingId(null);
      alert("Network error dispatching offer");
    }
  }

  if (loading) {
    return (
      <main className="mx-auto max-w-7xl px-4 sm:px-6 py-12 text-center text-xs text-ink/50 animate-pulse">
        Loading donation and running smart matching engine...
      </main>
    );
  }

  if (!donation || donation.error) {
    return (
      <main className="mx-auto max-w-xl px-6 py-12 text-center">
        <AlertCircle className="mx-auto h-8 w-8 text-red-500 mb-2" />
        <h2 className="text-base font-semibold">Donation listing not found</h2>
        <Link href="/restaurant/donations" className="btn mt-4 text-xs">
          Return to My Donations
        </Link>
      </main>
    );
  }

  const hoursLeft = Math.max(
    0,
    (new Date(donation.pickupDeadline).getTime() - Date.now()) / (1000 * 60 * 60)
  );

  return (
    <main className="mx-auto max-w-7xl px-4 sm:px-6 py-10">
      <Link
        href="/restaurant/donations"
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-ink/60 hover:text-forest mb-6"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Back to All Listings
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Listing Overview & Details */}
        <div className="lg:col-span-1 space-y-6">
          <div className="rounded-2xl border border-ink/10 bg-white p-6 shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <span
                className={`rounded-full px-2.5 py-0.5 text-[10px] font-semibold ${
                  donation.status === "AVAILABLE"
                    ? "bg-emerald-100 text-emerald-800"
                    : donation.status === "ALLOCATED"
                    ? "bg-blue-100 text-blue-800"
                    : "bg-ink/10 text-ink/70"
                }`}
              >
                {donation.status}
              </span>
              <span className="text-xs text-ink/50 font-medium">
                {hoursLeft > 0 ? `${hoursLeft.toFixed(1)}h until deadline` : "Expired"}
              </span>
            </div>

            <h1 className="text-xl font-bold text-forest leading-snug">{donation.title}</h1>
            <p className="mt-1 text-xs text-ink/65">{donation.category}</p>

            <div className="mt-5 space-y-3 border-t border-ink/10 pt-4 text-xs">
              <div className="flex justify-between">
                <span className="text-ink/60">Remaining Unallocated:</span>
                <span className="font-bold text-forest">
                  {donation.remainingQuantity} {donation.unit}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-ink/60">Total Initial:</span>
                <span className="font-medium text-ink">
                  {donation.totalQuantity} {donation.unit}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-ink/60">Dietary:</span>
                <span className="font-semibold text-emerald-800">{donation.dietary}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-ink/60">Storage:</span>
                <span>{donation.storageRequirements || "AMBIENT"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-ink/60">Pickup Deadline:</span>
                <span>{new Date(donation.pickupDeadline).toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-ink/60">Pickup Address:</span>
                <span className="text-right max-w-[180px] truncate">
                  {donation.pickupAddress || "Registered Premises"}
                </span>
              </div>
            </div>

            {donation.description && (
              <div className="mt-4 border-t border-ink/10 pt-3">
                <p className="text-[11px] text-ink/70 italic">“{donation.description}”</p>
              </div>
            )}
          </div>

          {/* Location radar */}
          {donation.location?.coordinates && (
            <div className="rounded-2xl border border-ink/10 bg-white p-5 shadow-xs">
              <h3 className="text-xs font-semibold text-forest mb-3 flex items-center gap-1.5">
                <Compass className="h-4 w-4" />
                Pickup Geospatial Coordinates
              </h3>
              <LocationMap
                origin={{
                  lng: donation.location.coordinates[0],
                  lat: donation.location.coordinates[1],
                  label: donation.title,
                }}
                className="h-48"
              />
            </div>
          )}
        </div>

        {/* Right Column: Smart Matching Engine Recommendations */}
        <div className="lg:col-span-2 space-y-6">
          <div className="rounded-2xl border border-ink/10 bg-white p-6 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
              <div>
                <h2 className="text-base font-bold text-forest flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-amber-warn" />
                  Smart Match Recommendations ({matches.length})
                </h2>
                <p className="text-xs text-ink/60">
                  Ranked by category fit, expiry urgency, transit proximity, and recipient demand.
                </p>
              </div>

              {donation.remainingQuantity > 0 && (
                <div className="flex items-center gap-2 bg-cream/80 border border-ink/10 rounded-xl px-3 py-1.5">
                  <span className="text-xs text-ink/70">Offer Qty:</span>
                  <input
                    type="number"
                    min="1"
                    max={donation.remainingQuantity}
                    value={offerQuantity}
                    onChange={(e) => setOfferQuantity(Number(e.target.value))}
                    className="w-16 rounded border border-ink/20 bg-white px-2 py-0.5 text-xs text-center font-bold"
                  />
                  <span className="text-xs text-ink/60">{donation.unit}</span>
                </div>
              )}
            </div>

            {matches.length === 0 ? (
              <div className="rounded-xl border border-dashed border-ink/15 p-8 text-center bg-cream/40">
                <Building2 className="mx-auto h-8 w-8 text-ink/30 mb-2" />
                <p className="text-xs text-ink/60">No registered shelters found in range.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {matches.map((m) => {
                  const s = m.shelter;
                  const isPending = s.verificationStatus !== "VERIFIED";

                  return (
                    <div
                      key={s.id}
                      className={`rounded-xl border p-5 transition-all ${
                        m.eligible
                          ? "border-ink/10 bg-white hover:border-forest/40 hover:shadow-xs"
                          : "border-ink/10 bg-ink/[0.02] opacity-75"
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2.5">
                            <h3 className="font-semibold text-sm text-forest">{s.name}</h3>
                            <span
                              className={`rounded-full px-2 py-0.2 text-[10px] font-semibold ${
                                isPending
                                  ? "bg-amber-100 text-amber-800"
                                  : "bg-emerald-100 text-emerald-800"
                              }`}
                            >
                              {s.verificationStatus}
                            </span>
                          </div>

                          <p className="text-xs text-ink/60 mt-0.5">
                            {s.address}, {s.city} • Serves ~{s.peopleServed || 40} people daily
                          </p>

                          {/* Match Factors & Metrics */}
                          <div className="mt-3 flex flex-wrap gap-2 text-[11px]">
                            <span className="rounded-md bg-forest/5 px-2 py-1 text-forest font-semibold">
                              ~{m.metrics.distanceKm} km straight-line (est. {m.metrics.estimatedTransitMins}m travel)
                            </span>
                            <span className="rounded-md bg-sage px-2 py-1 text-ink font-medium">
                              Category Fit: {m.factors.categoryFit}/25
                            </span>
                            <span className="rounded-md bg-sage px-2 py-1 text-ink font-medium">
                              Urgency Score: {m.factors.expiryUrgency}/25
                            </span>
                          </div>

                          {/* Explanations */}
                          <div className="mt-3 space-y-1">
                            {m.explanations.map((exp: string, idx: number) => (
                              <p key={idx} className="text-[11px] text-emerald-800 flex items-center gap-1.5">
                                <CheckCircle2 className="h-3 w-3 shrink-0" />
                                {exp}
                              </p>
                            ))}
                            {m.tradeoffs.map((tr: string, idx: number) => (
                              <p key={idx} className="text-[11px] text-amber-800 flex items-center gap-1.5">
                                <Info className="h-3 w-3 shrink-0" />
                                {tr}
                              </p>
                            ))}
                          </div>
                        </div>

                        {/* Match Score Badge & Action */}
                        <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-3 shrink-0 border-t sm:border-t-0 pt-3 sm:pt-0 border-ink/10">
                          <div className="text-right">
                            <div className="flex items-baseline justify-end gap-1">
                              <span className="text-2xl font-bold text-forest">{m.score}</span>
                              <span className="text-[11px] text-ink/50">/100</span>
                            </div>
                            <span className="text-[10px] text-ink/50 uppercase font-semibold">
                              Compatibility
                            </span>
                          </div>

                          {m.eligible && donation.remainingQuantity > 0 && donation.status === "AVAILABLE" && (
                            <button
                              onClick={() => handleDispatchOffer(s.id)}
                              disabled={dispatchingId === s.id}
                              className="btn py-1.5 px-3.5 text-xs font-semibold flex items-center gap-1.5 shadow-xs"
                            >
                              <Send className="h-3 w-3" />
                              {dispatchingId === s.id ? "Sending…" : `Dispatch Offer`}
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
