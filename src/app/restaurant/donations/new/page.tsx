"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Package,
  ArrowLeft,
  Clock,
  Sparkles,
  AlertCircle,
  Thermometer,
  Calendar,
  CheckCircle2,
  ShieldAlert,
  ShieldCheck,
  Zap,
} from "lucide-react";
import { OrganizationVerificationModal } from "@/components/OrganizationVerificationModal";

const CATEGORIES = [
  "Cooked Meals",
  "Bakery & Bread",
  "Fresh Produce & Fruit",
  "Dairy & Refrigerated",
  "Packaged & Canned",
  "Beverages",
  "Prepared Sandwiches/Salads",
];

const COMMON_ALLERGENS = ["Peanuts", "Tree Nuts", "Dairy / Milk", "Gluten / Wheat", "Eggs", "Soy", "Shellfish", "Sesame"];

export default function NewDonationPage() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [selectedAllergens, setSelectedAllergens] = useState<string[]>([]);
  const [verificationModalOpen, setVerificationModalOpen] = useState(false);
  const [verificationStatus, setVerificationStatus] = useState<string | null>(null);
  const [orgName, setOrgName] = useState<string>("");

  useEffect(() => {
    fetch("/api/organization/verify")
      .then((r) => r.json())
      .then((d) => {
        if (d.verificationStatus) {
          setVerificationStatus(d.verificationStatus);
          setOrgName(d.name || "");
        }
      })
      .catch(() => {});
  }, []);

  // Default deadline: 6 hours from now
  const defaultDeadline = new Date(Date.now() + 6 * 3600 * 1000)
    .toISOString()
    .slice(0, 16);

  const toggleAllergen = (a: string) => {
    setSelectedAllergens((prev) =>
      prev.includes(a) ? prev.filter((item) => item !== a) : [...prev, a]
    );
  };

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError("");

    const f = new FormData(e.currentTarget);
    const body = {
      title: f.get("title"),
      description: f.get("description"),
      category: f.get("category"),
      unit: f.get("unit") || "kg",
      totalQuantity: Number(f.get("totalQuantity")),
      dietary: f.get("dietary"),
      allergens: selectedAllergens,
      storageRequirements: f.get("storageRequirements") || "AMBIENT",
      pickupDeadline: new Date(f.get("pickupDeadline") as string).toISOString(),
      pickupAddress: f.get("pickupAddress"),
      pickupInstructions: f.get("pickupInstructions"),
    };

    try {
      const res = await fetch("/api/donations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      setBusy(false);

      if (!res.ok) {
        setError(data.error || "Failed to publish surplus donation");
        if (
          data.error?.toLowerCase().includes("verification") ||
          data.error?.toLowerCase().includes("pending")
        ) {
          setVerificationStatus("PENDING");
        }
        return;
      }

      // Redirect directly to the donation detail & match recommendations view!
      router.push(`/restaurant/donations/${data._id}`);
    } catch {
      setBusy(false);
      setError("Network error. Please try again.");
    }
  }

  const isPendingVerification = verificationStatus && verificationStatus !== "VERIFIED";

  return (
    <main className="mx-auto max-w-3xl px-4 sm:px-6 py-10">
      <Link
        href="/restaurant/dashboard"
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-ink/60 hover:text-forest mb-6"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Back to Dashboard
      </Link>

      {/* Unverified prompt banner */}
      {isPendingVerification && (
        <div className="mb-6 rounded-2xl border border-amber-300 bg-amber-50/95 p-4 text-amber-900 shadow-2xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-start gap-3">
              <Clock className="h-5 w-5 text-amber-600 mt-0.5 shrink-0 animate-pulse" />
              <div>
                <h4 className="text-xs font-bold text-amber-950 uppercase tracking-wide">
                  Organization Verification Required
                </h4>
                <p className="mt-0.5 text-xs text-amber-800">
                  Publishing active surplus food listings requires a verified organization. You can complete
                  verification immediately to proceed.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setVerificationModalOpen(true)}
              className="btn py-1.5 px-3.5 text-xs font-semibold bg-emerald-700 hover:bg-emerald-800 text-white shadow-2xs flex items-center gap-1.5 shrink-0"
            >
              <Zap className="h-3.5 w-3.5 text-amber-300" />
              <span>Verify Now</span>
            </button>
          </div>
        </div>
      )}

      <div className="rounded-2xl border border-ink/10 bg-white p-6 sm:p-8 shadow-sm">
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-forest/10 text-forest">
            <Package className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-forest">List Surplus Food Donation</h1>
            <p className="text-xs text-ink/60">
              Provide food details to automatically trigger candidate shelter matching.
            </p>
          </div>
        </div>

        <form onSubmit={onSubmit} className="space-y-6">
          {/* Title & Category */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2">
              <label className="mb-1 block text-xs font-medium text-ink/80">
                Item Title / Description Summary <span className="text-red-500">*</span>
              </label>
              <input
                name="title"
                type="text"
                required
                placeholder="e.g. 40 portions Vegetable Lasagna, 15 baguettes"
                className="input"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-ink/80">
                Food Category <span className="text-red-500">*</span>
              </label>
              <select name="category" required className="input">
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Quantity, Unit, Dietary */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="mb-1 block text-xs font-medium text-ink/80">
                Total Quantity <span className="text-red-500">*</span>
              </label>
              <input
                name="totalQuantity"
                type="number"
                step="0.5"
                min="0.5"
                required
                placeholder="e.g. 25"
                className="input"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-ink/80">Unit of Measure</label>
              <select name="unit" className="input">
                <option value="kg">Kilograms (kg)</option>
                <option value="portions">Prepared Portions</option>
                <option value="items">Individual Items / Loaves</option>
                <option value="crates">Standard Crates</option>
              </select>
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-ink/80">
                Dietary Classification <span className="text-red-500">*</span>
              </label>
              <select name="dietary" required className="input">
                <option value="VEG">Vegetarian / Vegan Safe</option>
                <option value="NON_VEG">Non-Vegetarian (Meat / Poultry / Fish)</option>
              </select>
            </div>
          </div>

          {/* Storage & Safe Pickup Deadline */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-xs font-medium text-ink/80 flex items-center gap-1.5">
                <Thermometer className="h-3.5 w-3.5 text-forest" />
                Storage Requirements
              </label>
              <select name="storageRequirements" className="input">
                <option value="AMBIENT">Ambient / Dry Storage (Room Temp)</option>
                <option value="REFRIGERATED">Refrigerated (0°C – 4°C)</option>
                <option value="FROZEN">Frozen (-18°C or colder)</option>
                <option value="HEATED">Hot Holding (&gt;63°C)</option>
              </select>
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-ink/80 flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5 text-forest" />
                Latest Safe Pickup Deadline <span className="text-red-500">*</span>
              </label>
              <input
                name="pickupDeadline"
                type="datetime-local"
                required
                defaultValue={defaultDeadline}
                className="input"
              />
            </div>
          </div>

          {/* Allergens selector */}
          <div>
            <label className="mb-1.5 block text-xs font-medium text-ink/80">
              Contains Potential Allergens (select all that apply)
            </label>
            <div className="flex flex-wrap gap-2">
              {COMMON_ALLERGENS.map((a) => {
                const active = selectedAllergens.includes(a);
                return (
                  <button
                    key={a}
                    type="button"
                    onClick={() => toggleAllergen(a)}
                    className={`rounded-lg px-3 py-1.5 text-xs font-medium border transition-colors ${
                      active
                        ? "bg-amber-100 border-amber-300 text-amber-900 font-semibold"
                        : "bg-white border-ink/15 text-ink/70 hover:bg-cream"
                    }`}
                  >
                    {active ? "✓ " : "+ "}
                    {a}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Pickup Address */}
          <div>
            <label className="mb-1 block text-xs font-medium text-ink/80">
              Specific Pickup Address (optional)
            </label>
            <input
              name="pickupAddress"
              type="text"
              placeholder="Leave blank to use registered organization address"
              className="input"
            />
          </div>

          {/* Description & Pickup instructions */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-xs font-medium text-ink/80">Description & Packaging</label>
              <textarea
                name="description"
                rows={3}
                placeholder="Freshly packaged in food-grade foil containers at 15:00 today..."
                className="input"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-ink/80">Pickup Instructions for Driver</label>
              <textarea
                name="pickupInstructions"
                rows={3}
                placeholder="Park in rear service alley; ask for Chef Marco at kitchen door."
                className="input"
              />
            </div>
          </div>

          {error && (
            <div
              role="alert"
              className="rounded-xl border border-red-200 bg-red-50 p-3.5 text-xs text-red-700 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
            >
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
              {(error.toLowerCase().includes("verification") ||
                error.toLowerCase().includes("pending")) && (
                <button
                  type="button"
                  onClick={() => setVerificationModalOpen(true)}
                  className="btn py-1 px-3 text-xs font-semibold bg-emerald-700 hover:bg-emerald-800 text-white shrink-0"
                >
                  Verify Now
                </button>
              )}
            </div>
          )}

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-ink/10">
            <Link href="/restaurant/dashboard" className="btn-ghost py-2 px-4 text-xs">
              Cancel
            </Link>
            <button className="btn py-2 px-5 text-xs font-semibold shadow-xs" disabled={busy}>
              {busy ? "Publishing & Matching…" : "Publish Surplus Food"}
            </button>
          </div>
        </form>
      </div>

      <OrganizationVerificationModal
        isOpen={verificationModalOpen}
        onClose={() => setVerificationModalOpen(false)}
        orgName={orgName}
        role="PROVIDER"
        onSuccess={() => {
          setVerificationStatus("VERIFIED");
          setError("");
        }}
      />
    </main>
  );
}
