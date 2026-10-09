import { getServerSession } from "next-auth";
import Link from "next/link";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { FoodDonation } from "@/models/FoodDonation";
import { DonationOffer } from "@/models/DonationOffer";
import { Organization } from "@/models/Organization";
import { VerificationBanner } from "@/components/VerificationBanner";
import {
  Package,
  Clock,
  CheckCircle2,
  PlusCircle,
  TrendingUp,
  AlertCircle,
  Truck,
  ArrowRight,
  Leaf,
  Scale,
} from "lucide-react";

export const dynamic = "force-dynamic";

export default async function RestaurantDashboard() {
  const session = await getServerSession(authOptions);
  const u = session?.user as any;
  if (!u?.id) redirect("/login");

  await connectDB();
  const org = await Organization.findById(u.orgId).lean<any>();

  const [availableCount, pendingOffersCount, completedOffersCount, donations, activeOffers] =
    await Promise.all([
      FoodDonation.countDocuments({
        donor: u.orgId,
        status: { $in: ["AVAILABLE", "PARTIALLY_ALLOCATED"] },
        pickupDeadline: { $gt: new Date() },
      }),
      DonationOffer.countDocuments({ donor: u.orgId, status: "OFFER_PENDING" }),
      DonationOffer.countDocuments({ donor: u.orgId, status: "COMPLETED" }),
      FoodDonation.find({ donor: u.orgId })
        .sort({ createdAt: -1 })
        .limit(5)
        .lean<any[]>(),
      DonationOffer.find({ donor: u.orgId })
        .populate("recipient", "name city phone")
        .populate("donation", "title unit")
        .sort({ createdAt: -1 })
        .limit(5)
        .lean<any[]>(),
    ]);

  const totalKgRescued = donations.reduce((acc, curr) => acc + (curr.totalQuantity || 0), 0);
  const estimatedCo2Offset = Math.round(totalKgRescued * 2.5);

  return (
    <main className="mx-auto max-w-7xl px-4 sm:px-6 py-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-forest">
              Provider Dashboard
            </h1>
            <span
              className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
                org?.verificationStatus === "VERIFIED"
                  ? "bg-emerald-100 text-emerald-800"
                  : org?.verificationStatus === "REJECTED"
                  ? "bg-red-100 text-red-800"
                  : "bg-amber-100 text-amber-800"
              }`}
            >
              {org?.verificationStatus ?? "PENDING"}
            </span>
          </div>
          <p className="mt-1 text-sm text-ink/65">
            {org?.name ?? "Your Business"} • {org?.city ?? "City"}
          </p>
        </div>

        <div className="flex gap-2.5">
          <Link
            href="/restaurant/donations/new"
            className="btn py-2 px-4 text-xs font-semibold flex items-center gap-1.5 shadow-xs"
          >
            <PlusCircle className="h-4 w-4" />
            Publish Surplus Food
          </Link>
          <Link
            href="/allocations"
            className="btn-ghost py-2 px-4 text-xs font-semibold flex items-center gap-1.5 bg-white shadow-2xs"
          >
            <Truck className="h-4 w-4" />
            Track Logistics
          </Link>
        </div>
      </div>

      <VerificationBanner status={org?.verificationStatus ?? "PENDING"} role="PROVIDER" />

      {/* Metrics Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
        <div className="rounded-xl border border-ink/10 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between text-ink/60 mb-2">
            <span className="text-xs font-medium">Available Listings</span>
            <Package className="h-4 w-4 text-forest" />
          </div>
          <p className="text-2xl sm:text-3xl font-bold text-forest">{availableCount}</p>
          <span className="text-[11px] text-ink/50 mt-1 block">Active on marketplace</span>
        </div>

        <div className="rounded-xl border border-ink/10 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between text-ink/60 mb-2">
            <span className="text-xs font-medium">Pending Requests</span>
            <Clock className="h-4 w-4 text-amber-warn" />
          </div>
          <p className="text-2xl sm:text-3xl font-bold text-amber-warn">{pendingOffersCount}</p>
          <span className="text-[11px] text-ink/50 mt-1 block">Awaiting confirmation</span>
        </div>

        <div className="rounded-xl border border-ink/10 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between text-ink/60 mb-2">
            <span className="text-xs font-medium">Completed Deliveries</span>
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
          </div>
          <p className="text-2xl sm:text-3xl font-bold text-emerald-700">{completedOffersCount}</p>
          <span className="text-[11px] text-ink/50 mt-1 block">Successfully rescued</span>
        </div>

        <div className="rounded-xl border border-ink/10 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between text-ink/60 mb-2">
            <span className="text-xs font-medium">Est. CO₂e Avoided</span>
            <Leaf className="h-4 w-4 text-emerald-600" />
          </div>
          <p className="text-2xl sm:text-3xl font-bold text-forest">
            {estimatedCo2Offset} <span className="text-xs font-normal text-ink/60">kg</span>
          </p>
          <span className="text-[11px] text-ink/50 mt-1 block">~{totalKgRescued} kg food rescued</span>
        </div>
      </div>

      {/* Grid: Recent Donations & Active Offers */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Food Listings */}
        <div className="rounded-2xl border border-ink/10 bg-white p-6 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-forest flex items-center gap-2">
              <Package className="h-4 w-4" />
              Recent Surplus Listings
            </h2>
            <Link
              href="/restaurant/donations"
              className="text-xs font-semibold text-forest hover:underline flex items-center gap-1"
            >
              View all ({donations.length})
              <ArrowRight className="h-3 w-3" />
            </Link>
          </div>

          {donations.length === 0 ? (
            <div className="rounded-xl border border-dashed border-ink/15 p-8 text-center bg-cream/30">
              <Package className="mx-auto h-8 w-8 text-ink/30 mb-2" />
              <p className="text-xs text-ink/60">No surplus donations published yet.</p>
              <Link
                href="/restaurant/donations/new"
                className="btn mt-3 py-1.5 px-3 text-xs"
              >
                Post first donation
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-ink/10">
              {donations.map((d) => {
                const hoursLeft = Math.max(
                  0,
                  (new Date(d.pickupDeadline).getTime() - Date.now()) / (1000 * 60 * 60)
                );
                return (
                  <div key={d._id} className="py-3.5 flex items-center justify-between gap-4">
                    <div>
                      <Link
                        href={`/restaurant/donations/${d._id}`}
                        className="text-xs font-semibold text-forest hover:underline"
                      >
                        {d.title}
                      </Link>
                      <div className="flex items-center gap-2 text-[11px] text-ink/60 mt-0.5">
                        <span>{d.category}</span>
                        <span>•</span>
                        <span>
                          {d.remainingQuantity} / {d.totalQuantity} {d.unit} remaining
                        </span>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span
                        className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                          d.status === "AVAILABLE"
                            ? "bg-emerald-100 text-emerald-800"
                            : d.status === "ALLOCATED"
                            ? "bg-blue-100 text-blue-800"
                            : "bg-ink/10 text-ink/70"
                        }`}
                      >
                        {d.status}
                      </span>
                      <p className="text-[10px] text-ink/50 mt-1">
                        {hoursLeft > 0 ? `${hoursLeft.toFixed(1)}h left` : "Expired"}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Recent Allocation Offers & Requests */}
        <div className="rounded-2xl border border-ink/10 bg-white p-6 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-forest flex items-center gap-2">
              <Truck className="h-4 w-4" />
              Allocation Pipeline
            </h2>
            <Link
              href="/allocations"
              className="text-xs font-semibold text-forest hover:underline flex items-center gap-1"
            >
              View all
              <ArrowRight className="h-3 w-3" />
            </Link>
          </div>

          {activeOffers.length === 0 ? (
            <div className="rounded-xl border border-dashed border-ink/15 p-8 text-center bg-cream/30">
              <Truck className="mx-auto h-8 w-8 text-ink/30 mb-2" />
              <p className="text-xs text-ink/60">No allocation offers in the pipeline.</p>
              <p className="text-[11px] text-ink/40 mt-1">
                Matches with nearby shelters will show here once food is allocated.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-ink/10">
              {activeOffers.map((o) => (
                <div key={o._id} className="py-3.5 flex items-center justify-between gap-4">
                  <div>
                    <Link
                      href={`/allocations/${o._id}`}
                      className="text-xs font-semibold text-forest hover:underline"
                    >
                      {o.quantity} {o.donation?.unit} to {o.recipient?.name || "Shelter"}
                    </Link>
                    <p className="text-[11px] text-ink/60 mt-0.5">
                      Donation: {o.donation?.title || "Food Listing"}
                    </p>
                  </div>

                  <div className="text-right shrink-0">
                    <span
                      className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                        o.status === "COMPLETED"
                          ? "bg-emerald-100 text-emerald-800"
                          : o.status === "ACCEPTED"
                          ? "bg-blue-100 text-blue-800"
                          : o.status === "CANCELLED"
                          ? "bg-red-100 text-red-800"
                          : "bg-amber-100 text-amber-800"
                      }`}
                    >
                      {o.status.replace("_", " ")}
                    </span>
                    <Link
                      href={`/allocations/${o._id}`}
                      className="block text-[10px] text-forest hover:underline mt-1 font-medium"
                    >
                      View timeline →
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
