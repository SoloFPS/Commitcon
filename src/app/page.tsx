import Link from "next/link";
import {
  Utensils,
  HeartHandshake,
  ShieldCheck,
  Zap,
  ArrowRight,
  Truck,
  Leaf,
  Scale,
  Sparkles,
} from "lucide-react";
import { connectDB } from "@/lib/db";
import { getSystemAnalytics } from "@/lib/analytics";

export const dynamic = "force-dynamic";

export default async function Home() {
  let stats = {
    totalFoodDonatedKg: 0,
    totalFoodDeliveredKg: 0,
    totalMealsRescued: 0,
    estimatedCo2AvoidedKg: 0,
    activeProvidersCount: 0,
    activeSheltersCount: 0,
  };

  try {
    await connectDB();
    const liveStats = await getSystemAnalytics();
    stats = {
      totalFoodDonatedKg: liveStats.totalFoodDonatedKg,
      totalFoodDeliveredKg: liveStats.totalFoodDeliveredKg,
      totalMealsRescued: liveStats.totalMealsRescued,
      estimatedCo2AvoidedKg: liveStats.estimatedCo2AvoidedKg,
      activeProvidersCount: liveStats.activeProvidersCount,
      activeSheltersCount: liveStats.activeSheltersCount,
    };
  } catch {}

  return (
    <main className="min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-forest/10 via-cream to-cream px-6 pt-20 pb-24">
        <div className="mx-auto max-w-6xl text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-forest/20 bg-white/80 px-4 py-1.5 text-xs font-semibold text-forest shadow-xs backdrop-blur-sm mb-6">
            <Sparkles className="h-3.5 w-3.5 text-forest" />
            Zero-Waste Redistribution Platform
          </div>

          <h1 className="mx-auto max-w-4xl text-4xl sm:text-6xl font-bold tracking-tight text-forest leading-[1.15]">
            Good food deserves a{" "}
            <span className="underline decoration-amber-warn/40 decoration-wavy">better destination</span> than the landfill.
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-base sm:text-lg text-ink/75 leading-relaxed">
            FoodBridge automates the connection between restaurants, supermarkets, and hotels with nearby
            shelters and charities. AI-powered smart matching prioritizes expiry urgency and transportation feasibility.
          </p>

          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/register"
              className="btn px-6 py-3 text-sm font-semibold shadow-md hover:shadow-lg transition-all flex items-center gap-2"
            >
              Get Started Free
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/login"
              className="btn-ghost px-6 py-3 text-sm font-semibold bg-white/80 hover:bg-white shadow-xs"
            >
              Sign In to Dashboard
            </Link>
          </div>
        </div>
      </section>

      {/* Live Impact Counters */}
      <section className="mx-auto max-w-6xl px-6 -mt-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 rounded-2xl border border-ink/10 bg-white p-6 shadow-sm">
          <div className="border-r border-ink/10 last:border-none pr-4">
            <div className="flex items-center gap-2 text-forest text-xs font-medium mb-1">
              <Scale className="h-4 w-4" />
              <span>Surplus Listed</span>
            </div>
            <p className="text-2xl sm:text-3xl font-bold text-forest">
              {stats.totalFoodDonatedKg.toLocaleString()} <span className="text-sm font-normal text-ink/60">kg</span>
            </p>
          </div>

          <div className="border-r border-ink/10 last:border-none pr-4">
            <div className="flex items-center gap-2 text-forest text-xs font-medium mb-1">
              <HeartHandshake className="h-4 w-4" />
              <span>Meals Rescued</span>
            </div>
            <p className="text-2xl sm:text-3xl font-bold text-forest">
              {stats.totalMealsRescued.toLocaleString()}+
            </p>
          </div>

          <div className="border-r border-ink/10 last:border-none pr-4">
            <div className="flex items-center gap-2 text-forest text-xs font-medium mb-1">
              <Leaf className="h-4 w-4 text-emerald-600" />
              <span>CO₂e Avoided</span>
            </div>
            <p className="text-2xl sm:text-3xl font-bold text-forest">
              {stats.estimatedCo2AvoidedKg.toLocaleString()} <span className="text-sm font-normal text-ink/60">kg</span>
            </p>
          </div>

          <div>
            <div className="flex items-center gap-2 text-forest text-xs font-medium mb-1">
              <ShieldCheck className="h-4 w-4 text-amber-warn" />
              <span>Verified Shelters</span>
            </div>
            <p className="text-2xl sm:text-3xl font-bold text-forest">
              {stats.activeSheltersCount + stats.activeProvidersCount} <span className="text-sm font-normal text-ink/60">orgs</span>
            </p>
          </div>
        </div>
        <p className="mt-2 text-right text-[11px] text-ink/50 italic">
          * Live statistics calculated directly from database allocation records.
        </p>
      </section>

      {/* How it Works Section */}
      <section className="mx-auto max-w-6xl px-6 py-20">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="text-2xl sm:text-3xl font-bold text-forest">How FoodBridge Works</h2>
          <p className="mt-2 text-sm text-ink/70">
            A closed-loop platform designed to prevent food waste through automated matching, safe concurrency, and verified handover.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          <div className="rounded-2xl border border-ink/10 bg-white p-7 shadow-xs hover:border-forest/40 transition-colors">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-forest/10 text-forest mb-5">
              <Utensils className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-semibold text-forest">1. Post Surplus</h3>
            <p className="mt-2 text-sm text-ink/70 leading-relaxed">
              Restaurants and supermarkets list surplus food in seconds with quantity, expiry deadlines, and dietary flags.
            </p>
          </div>

          <div className="rounded-2xl border border-ink/10 bg-white p-7 shadow-xs hover:border-forest/40 transition-colors">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-warn/10 text-amber-warn mb-5">
              <Zap className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-semibold text-forest">2. Smart Matching</h3>
            <p className="mt-2 text-sm text-ink/70 leading-relaxed">
              Our multi-factor scoring engine balances expiry urgency, distance, capacity fit, and dietary preferences to recommend optimal allocations.
            </p>
          </div>

          <div className="rounded-2xl border border-ink/10 bg-white p-7 shadow-xs hover:border-forest/40 transition-colors">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-600/10 text-emerald-700 mb-5">
              <Truck className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-semibold text-forest">3. Tracked Delivery</h3>
            <p className="mt-2 text-sm text-ink/70 leading-relaxed">
              Concurrency-safe quantity reservation prevents double-claiming. Real-time timelines and 6-digit confirmation codes ensure verified delivery.
            </p>
          </div>
        </div>
      </section>

      {/* Role selector callout */}
      <section className="bg-sage/40 border-y border-ink/10 py-16 px-6">
        <div className="mx-auto max-w-4xl rounded-2xl bg-forest text-white p-8 sm:p-12 shadow-xl flex flex-col md:flex-row items-center justify-between gap-8">
          <div>
            <h3 className="text-2xl font-bold tracking-tight">Ready to stop food waste in your community?</h3>
            <p className="mt-2 text-sm text-sage max-w-md">
              Join dozens of registered providers and shelters. Immediate zero-cost signup.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 shrink-0">
            <Link
              href="/register"
              className="rounded-xl bg-white px-5 py-3 text-center text-xs font-bold text-forest hover:bg-cream transition-colors shadow-sm"
            >
              Register Organization
            </Link>
            <Link
              href="/login"
              className="rounded-xl border border-white/30 px-5 py-3 text-center text-xs font-bold text-white hover:bg-white/10 transition-colors"
            >
              Sign In Demo
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
