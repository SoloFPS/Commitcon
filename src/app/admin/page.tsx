"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ShieldCheck,
  Users,
  CheckCircle2,
  XCircle,
  Clock,
  Leaf,
  Scale,
  HeartHandshake,
  TrendingUp,
  AlertTriangle,
  ArrowRight,
  Sparkles,
} from "lucide-react";

export default function AdminOverviewPage() {
  const [stats, setStats] = useState<any>(null);
  const [forecast, setForecast] = useState<any>(null);
  const [pendingOrgs, setPendingOrgs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [verifyingId, setVerifyingId] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [resStats, resForecast, resOrgs] = await Promise.all([
        fetch("/api/admin/analytics").then((r) => r.json()),
        fetch("/api/forecast").then((r) => r.json()),
        fetch("/api/admin/organizations?status=PENDING").then((r) => r.json()),
      ]);

      setStats(resStats.stats);
      setForecast(resForecast);
      setPendingOrgs(Array.isArray(resOrgs) ? resOrgs : []);
    } catch {
      console.error("Failed to load admin data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  async function handleVerify(orgId: string, status: "VERIFIED" | "REJECTED") {
    const notes = prompt(`Optional verification notes for ${status}:`) ?? undefined;
    setVerifyingId(orgId);

    try {
      const res = await fetch("/api/admin/organizations", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orgId, status, notes }),
      });

      setVerifyingId(null);
      if (!res.ok) {
        alert("Failed to update organization status");
        return;
      }

      fetchData();
    } catch {
      setVerifyingId(null);
      alert("Network error updating organization");
    }
  }

  if (loading) {
    return (
      <main className="mx-auto max-w-7xl px-4 sm:px-6 py-12 text-center text-xs text-ink/50 animate-pulse">
        Loading system analytics and pending verification requests...
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-7xl px-4 sm:px-6 py-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-forest">
              Administrative Control Center
            </h1>
            <span className="rounded-full bg-forest text-white px-2.5 py-0.5 text-[10px] font-bold">
              Superadmin
            </span>
          </div>
          <p className="mt-1 text-xs text-ink/65">
            System overview, organization verifications, and real-time environmental metrics.
          </p>
        </div>

        <div className="flex gap-2">
          <Link
            href="/admin/organizations"
            className="btn-ghost py-2 px-3 text-xs font-semibold bg-white shadow-2xs"
          >
            Manage All Organizations
          </Link>
          <Link
            href="/allocations"
            className="btn py-2 px-3 text-xs font-semibold shadow-xs"
          >
            Audit Allocations
          </Link>
        </div>
      </div>

      {/* System Impact Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
        <div className="rounded-xl border border-ink/10 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between text-ink/60 mb-2">
            <span className="text-xs font-medium">Total Food Listed</span>
            <Scale className="h-4 w-4 text-forest" />
          </div>
          <p className="text-2xl font-bold text-forest">
            {stats?.totalFoodDonatedKg?.toLocaleString() || 0} <span className="text-xs font-normal text-ink/50">kg</span>
          </p>
          <span className="text-[11px] text-ink/50 mt-1 block">Surplus published</span>
        </div>

        <div className="rounded-xl border border-ink/10 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between text-ink/60 mb-2">
            <span className="text-xs font-medium">Delivered to Shelters</span>
            <HeartHandshake className="h-4 w-4 text-emerald-600" />
          </div>
          <p className="text-2xl font-bold text-emerald-700">
            {stats?.totalFoodDeliveredKg?.toLocaleString() || 0} <span className="text-xs font-normal text-ink/50">kg</span>
          </p>
          <span className="text-[11px] text-ink/50 mt-1 block">Verified handovers</span>
        </div>

        <div className="rounded-xl border border-ink/10 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between text-ink/60 mb-2">
            <span className="text-xs font-medium">CO₂e Avoided</span>
            <Leaf className="h-4 w-4 text-emerald-600" />
          </div>
          <p className="text-2xl font-bold text-forest">
            {stats?.estimatedCo2AvoidedKg?.toLocaleString() || 0} <span className="text-xs font-normal text-ink/50">kg</span>
          </p>
          <span className="text-[11px] text-ink/50 mt-1 block">FAO emission factor</span>
        </div>

        <div className="rounded-xl border border-ink/10 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between text-ink/60 mb-2">
            <span className="text-xs font-medium">Delivery Success Rate</span>
            <TrendingUp className="h-4 w-4 text-amber-warn" />
          </div>
          <p className="text-2xl font-bold text-amber-warn">
            {stats?.deliverySuccessRate || 100}%
          </p>
          <span className="text-[11px] text-ink/50 mt-1 block">From created allocations</span>
        </div>
      </div>

      {/* Grid: Pending Verifications & Forecasting */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-10">
        {/* Pending Organization Verifications */}
        <div className="rounded-2xl border border-ink/10 bg-white p-6 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-bold text-forest flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-amber-warn" />
                Pending Verification Requests ({pendingOrgs.length})
              </h2>
              <p className="text-xs text-ink/60">
                Review newly registered organizations before unlocking operational privileges.
              </p>
            </div>
            <Link
              href="/admin/organizations"
              className="text-xs font-semibold text-forest hover:underline"
            >
              View directory →
            </Link>
          </div>

          {pendingOrgs.length === 0 ? (
            <div className="rounded-xl border border-dashed border-ink/15 p-8 text-center bg-cream/40">
              <CheckCircle2 className="mx-auto h-8 w-8 text-emerald-600/50 mb-2" />
              <p className="text-xs text-ink/60">All organizations are up to date! No pending verifications.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {pendingOrgs.map((org) => (
                <div
                  key={org._id}
                  className="rounded-xl border border-ink/10 p-4 bg-cream/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs text-forest">{org.name}</span>
                      <span className="rounded-full bg-forest/10 px-2 py-0.5 text-[10px] font-semibold text-forest">
                        {org.kind}
                      </span>
                    </div>
                    <p className="text-[11px] text-ink/65 mt-0.5">
                      {org.address}, {org.city} • Contact: {org.contactName} ({org.phone})
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => handleVerify(org._id, "VERIFIED")}
                      disabled={verifyingId === org._id}
                      className="rounded-lg bg-emerald-700 text-white px-3 py-1.5 text-xs font-semibold hover:bg-emerald-800 shadow-2xs"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => handleVerify(org._id, "REJECTED")}
                      disabled={verifyingId === org._id}
                      className="rounded-lg border border-red-300 text-red-700 px-2.5 py-1.5 text-xs font-semibold hover:bg-red-50"
                    >
                      Reject
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Statistical Surplus & Demand Forecast */}
        <div className="rounded-2xl border border-ink/10 bg-white p-6 shadow-xs">
          <div className="mb-4">
            <h2 className="text-base font-bold text-forest flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-forest" />
              Surplus & Demand Forecasting
            </h2>
            <p className="text-xs text-ink/60">
              Moving-average predictions calculated strictly from historical donation data.
            </p>
          </div>

          <div className="rounded-xl border border-ink/10 bg-cream/40 p-4 mb-4 text-xs">
            <p className="text-ink/80 leading-relaxed">{forecast?.forecastNotice}</p>
          </div>

          {forecast?.categoryForecasts?.length > 0 ? (
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-ink/70 uppercase">Expected Weekly Surplus</h4>
              <div className="divide-y divide-ink/10">
                {forecast.categoryForecasts.map((cf: any) => (
                  <div key={cf.category} className="py-2.5 flex items-center justify-between text-xs">
                    <div>
                      <span className="font-semibold text-forest">{cf.category}</span>
                      <span className="text-[11px] text-ink/50 block">
                        Peak Days: {cf.peakDays?.join(", ")}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="font-bold text-ink">~{cf.expectedWeeklySurplusKg} kg/wk</span>
                      <span
                        className={`block text-[10px] font-semibold ${
                          cf.confidence === "HIGH"
                            ? "text-emerald-700"
                            : cf.confidence === "MEDIUM"
                            ? "text-amber-700"
                            : "text-ink/40"
                        }`}
                      >
                        {cf.confidence} Confidence
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="p-6 text-center text-xs text-ink/50">
              {forecast?.suggestedPreparationWindow}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
