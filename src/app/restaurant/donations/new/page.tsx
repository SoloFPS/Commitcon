"use client";
import { useState } from "react";
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
} from "lucide-react";

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
        return;
      }

      // Redirect directly to the donation detail & match recommendations view!
      router.push(`/restaurant/donations/${data._id}`);
    } catch {
      setBusy(false);
      setError("Network error. Please try again.");
    }
  }

  return (
    <main className="mx-auto max-w-3xl px-4 sm:px-6 py-10">
      <Link
        href="/restaurant/dashboard"
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-ink/60 hover:text-forest mb-6"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Back to Dashboard
      </Link>

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

        <form onSubmit={onSubmit} className="space-y-5">
          {/* Title */}
          <div>
            <label className="mb-1 block text-xs font-medium text-ink/80">Donation Title</label>
            <input
              name="title"
              required
              placeholder="e.g. 30 Portions Roasted Vegetable Pasta & Fresh Bread"
              className="input"
            />
          </div>

          {/* Category & Quantity */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="mb-1 block text-xs font-medium text-ink/80">Category</label>
              <select name="category" required className="input bg-white">
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-ink/80">Total Quantity</label>
              <input
                name="totalQuantity"
                type="number"
                step="0.1"
                min="0.1"
                required
                placeholder="25"
                className="input"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-ink/80">Unit</label>
              <select name="unit" className="input bg-white">
                <option value="kg">kg (Kilograms)</option>
                <option value="meals">meals / portions</option>
                <option value="boxes">boxes</option>
                <option value="loaves">loaves / items</option>
              </select>
            </div>
          </div>

          {/* Dietary & Storage */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-xs font-medium text-ink/80">Dietary Classification</label>
              <div className="grid grid-cols-2 gap-2">
                <label className="flex items-center gap-2 rounded-lg border border-ink/15 p-2.5 text-xs cursor-pointer hover:bg-sage/40">
                  <input type="radio" name="dietary" value="VEG" defaultChecked className="accent-forest" />
                  <span className="font-semibold text-emerald-800">Vegetarian (VEG)</span>
                </label>
                <label className="flex items-center gap-2 rounded-lg border border-ink/15 p-2.5 text-xs cursor-pointer hover:bg-sage/40">
                  <input type="radio" name="dietary" value="NON_VEG" className="accent-forest" />
                  <span className="font-semibold text-amber-800">Non-Vegetarian</span>
                </label>
              </div>
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-ink/80">Storage Requirement</label>
              <select name="storageRequirements" className="input bg-white">
                <option value="AMBIENT">Ambient / Room Temperature</option>
                <option value="REFRIGERATED">Refrigerated (Chilled 0–4°C)</option>
                <option value="FROZEN">Frozen (-18°C)</option>
                <option value="HEATED">Heated / Keep Warm (60°C+)</option>
              </select>
            </div>
          </div>

          {/* Allergens selection */}
          <div>
            <label className="mb-1.5 block text-xs font-medium text-ink/80">
              Contained Allergens (select all that apply)
            </label>
            <div className="flex flex-wrap gap-2">
              {COMMON_ALLERGENS.map((a) => {
                const checked = selectedAllergens.includes(a);
                return (
                  <button
                    key={a}
                    type="button"
                    onClick={() => toggleAllergen(a)}
                    className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                      checked
                        ? "bg-forest text-white"
                        : "border border-ink/15 bg-white text-ink/70 hover:bg-sage"
                    }`}
                  >
                    {a}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Pickup Deadline */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-xs font-medium text-ink/80 flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5 text-forest" />
                Pickup Deadline (Must be in future)
              </label>
              <input
                name="pickupDeadline"
                type="datetime-local"
                required
                defaultValue={defaultDeadline}
                className="input"
              />
              <span className="text-[10px] text-ink/50 mt-1 block">
                Food must be collected before this time for safety.
              </span>
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-ink/80">
                Pickup Address / Handover Location
              </label>
              <input
                name="pickupAddress"
                placeholder="Leave blank to use registered organization address"
                className="input"
              />
            </div>
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
            <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3.5 text-xs text-red-700">
              {error}
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
    </main>
  );
}
