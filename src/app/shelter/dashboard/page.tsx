import { getServerSession } from "next-auth";
import Link from "next/link";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { Organization } from "@/models/Organization";
import { DonationOffer } from "@/models/DonationOffer";
import { FoodDonation } from "@/models/FoodDonation";
import { VerificationBanner } from "@/components/VerificationBanner";
import {
  HeartHandshake,
  Package,
  Clock,
  CheckCircle2,
  TrendingUp,
  Truck,
  ArrowRight,
  Sparkles,
  Scale,
  Users,
} from "lucide-react";

export const dynamic = "force-dynamic";

export default async function ShelterDashboard() {
  const session = await getServerSession(authOptions);
  const u = session?.user as any;
  if (!u?.id) redirect("/login");

  await connectDB();
  const org = await Organization.findById(u.orgId).lean<any>();

  const [pendingOffers, completedOffers, availableMarketCount] = await Promise.all([
    DonationOffer.find({ recipient: u.orgId, status: "OFFER_PENDING" })
      .populate("donor", "name city phone")
      .populate("donation", "title unit remainingQuantity pickupDeadline dietary")
      .sort({ createdAt: -1 })
      .lean<any[]>(),
    DonationOffer.find({ recipient: u.orgId, status: "COMPLETED" })
      .populate("donation", "title unit")
      .lean<any[]>(),
    FoodDonation.countDocuments({
      status: { $in: ["AVAILABLE", "PARTIALLY_ALLOCATED"] },
      pickupDeadline: { $gt: new Date() },
      remainingQuantity: { $gt: 0 },
    }),
  ]);

  const totalReceivedKg = completedOffers.reduce((acc, curr) => acc + (curr.quantity || 0), 0);
  const mealsServed = Math.round(totalReceivedKg / 0.42);

  return (
    <main className="mx-auto max-w-7xl px-4 sm:px-6 py-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-forest">
              Shelter & Charity Dashboard
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
            {org?.name ?? "Your Shelter"} • Serves ~{org?.peopleServed ?? 50} people daily
          </p>
        </div>

        <div className="flex gap-2.5">
          <Link
            href="/shelter/donations"
            className="btn py-2 px-4 text-xs font-semibold flex items-center gap-1.5 shadow-xs"
          >
            <Sparkles className="h-4 w-4" />
            Discover Surplus Food
          </Link>
          <Link
            href="/profile"
            className="btn-ghost py-2 px-4 text-xs font-semibold flex items-center gap-1.5 bg-white shadow-2xs"
          >
            <Users className="h-4 w-4" />
            Demand Settings
          </Link>
        </div>
      </div>

      <VerificationBanner status={org?.verificationStatus ?? "PENDING"} role="SHELTER" />

      {/* Metrics Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
        <div className="rounded-xl border border-ink/10 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between text-ink/60 mb-2">
            <span className="text-xs font-medium">Surplus Available</span>
            <Package className="h-4 w-4 text-forest" />
          </div>
          <p className="text-2xl sm:text-3xl font-bold text-forest">{availableMarketCount}</p>
          <span className="text-[11px] text-ink/50 mt-1 block">Compatible listings nearby</span>
        </div>

        <div className="rounded-xl border border-ink/10 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between text-ink/60 mb-2">
            <span className="text-xs font-medium">Offers Awaiting You</span>
            <Clock className="h-4 w-4 text-amber-warn" />
          </div>
          <p className="text-2xl sm:text-3xl font-bold text-amber-warn">{pendingOffers.length}</p>
          <span className="text-[11px] text-ink/50 mt-1 block">Requires acceptance</span>
        </div>

        <div className="rounded-xl border border-ink/10 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between text-ink/60 mb-2">
            <span className="text-xs font-medium">Food Rescued & Received</span>
            <Scale className="h-4 w-4 text-emerald-600" />
          </div>
          <p className="text-2xl sm:text-3xl font-bold text-emerald-700">
            {totalReceivedKg} <span className="text-xs font-normal text-ink/60">kg</span>
          </p>
          <span className="text-[11px] text-ink/50 mt-1 block">Successfully delivered</span>
        </div>

        <div className="rounded-xl border border-ink/10 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between text-ink/60 mb-2">
            <span className="text-xs font-medium">Estimated Meals Provided</span>
            <HeartHandshake className="h-4 w-4 text-emerald-600" />
          </div>
          <p className="text-2xl sm:text-3xl font-bold text-forest">{mealsServed}+</p>
          <span className="text-[11px] text-ink/50 mt-1 block">To community members</span>
        </div>
      </div>

      {/* Incoming Offers Alert Box */}
      <div className="mb-10 rounded-2xl border border-ink/10 bg-white p-6 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-base font-bold text-forest flex items-center gap-2">
              <Clock className="h-4 w-4 text-amber-warn" />
              Incoming Allocation Offers ({pendingOffers.length})
            </h2>
            <p className="text-xs text-ink/60">
              Surplus food offered directly to your organization by local providers.
            </p>
          </div>
          <Link
            href="/shelter/requests"
            className="text-xs font-semibold text-forest hover:underline flex items-center gap-1"
          >
            View all requests
            <ArrowRight className="h-3 w-3" />
          </Link>
        </div>

        {pendingOffers.length === 0 ? (
          <div className="rounded-xl border border-dashed border-ink/15 p-8 text-center bg-cream/40">
            <Package className="mx-auto h-8 w-8 text-ink/30 mb-2" />
            <p className="text-xs text-ink/60">No pending offers currently awaiting acceptance.</p>
            <Link
              href="/shelter/donations"
              className="btn mt-3 py-1.5 px-3 text-xs inline-flex items-center gap-1.5"
            >
              <Sparkles className="h-3 w-3" />
              Browse available donations
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {pendingOffers.map((offer) => (
              <div
                key={offer._id}
                className="rounded-xl border border-amber-warn/20 bg-amber-warn/5 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-forest">
                      {offer.quantity} {offer.donation?.unit} of {offer.donation?.title}
                    </span>
                    <span className="rounded-md bg-white px-2 py-0.5 text-[10px] font-semibold text-emerald-800 border border-ink/10">
                      {offer.donation?.dietary}
                    </span>
                  </div>
                  <p className="text-xs text-ink/70 mt-1">
                    Offered by <span className="font-medium text-ink">{offer.donor?.name}</span> • {offer.donor?.city}
                  </p>
                  <p className="text-[11px] text-ink/50 mt-0.5">
                    Pickup Deadline: {new Date(offer.donation?.pickupDeadline).toLocaleString()}
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <Link
                    href={`/allocations/${offer._id}`}
                    className="btn py-1.5 px-4 text-xs font-semibold shadow-xs"
                  >
                    Review & Accept
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}