"use client";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import {
  Building2,
  Users,
  ShieldCheck,
  MapPin,
  Clock,
  Phone,
  Mail,
  Save,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";

export default function ProfilePage() {
  const { data: session } = useSession();
  const [org, setOrg] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  const [peopleServed, setPeopleServed] = useState<number>(50);
  const [capacityKg, setCapacityKg] = useState<number>(50);
  const [dietary, setDietary] = useState<string>("");
  const [categories, setCategories] = useState<string>("");
  const [openTime, setOpenTime] = useState<string>("08:00");
  const [closeTime, setCloseTime] = useState<string>("20:00");
  const [contactName, setContactName] = useState<string>("");
  const [phone, setPhone] = useState<string>("");

  useEffect(() => {
    fetch("/api/shelter/profile")
      .then((r) => r.json())
      .then((data) => {
        if (!data.error) {
          setOrg(data);
          setPeopleServed(data.peopleServed || 50);
          setCapacityKg(data.capacityKg || 50);
          setDietary((data.dietaryRestrictions || []).join(", "));
          setCategories((data.foodCategories || []).join(", "));
          setOpenTime(data.operatingHours?.open || "08:00");
          setCloseTime(data.operatingHours?.close || "20:00");
          setContactName(data.contactName || "");
          setPhone(data.phone || "");
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMsg("");

    const body = {
      peopleServed,
      capacityKg,
      dietaryRestrictions: dietary
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
      foodCategories: categories
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
      operatingHours: { open: openTime, close: closeTime },
      contactName,
      phone,
    };

    try {
      const res = await fetch("/api/shelter/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      setBusy(false);

      if (!res.ok) {
        setMsg(data.error || "Failed to update profile");
        return;
      }

      setOrg(data);
      setMsg("Requirements and profile updated successfully!");
    } catch {
      setBusy(false);
      setMsg("Network error saving profile");
    }
  }

  if (loading) {
    return (
      <main className="mx-auto max-w-4xl px-4 sm:px-6 py-12 text-center text-xs text-ink/50 animate-pulse">
        Loading organization profile...
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-4xl px-4 sm:px-6 py-10">
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight text-forest">Organization Profile</h1>
        <p className="mt-1 text-xs text-ink/65">
          Manage your operational requirements, daily meal capacity, and dietary preferences.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left side: Read-only info & verification badge */}
        <div className="space-y-6">
          <div className="rounded-2xl border border-ink/10 bg-white p-6 shadow-xs text-xs space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-forest/10 text-forest">
                <Building2 className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-forest">{org?.name}</h3>
                <span className="text-[11px] text-ink/60">{org?.kind}</span>
              </div>
            </div>

            <div className="border-t border-ink/10 pt-3 space-y-2">
              <div>
                <span className="text-ink/50 block text-[11px]">Verification Status</span>
                <span
                  className={`inline-block mt-0.5 rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                    org?.verificationStatus === "VERIFIED"
                      ? "bg-emerald-100 text-emerald-800"
                      : "bg-amber-100 text-amber-800"
                  }`}
                >
                  {org?.verificationStatus}
                </span>
              </div>

              <div>
                <span className="text-ink/50 block text-[11px]">Address</span>
                <span className="font-medium text-ink">
                  {org?.address}, {org?.city} {org?.postalCode}
                </span>
              </div>

              <div>
                <span className="text-ink/50 block text-[11px]">Coordinates</span>
                <span className="font-mono text-ink text-[11px]">
                  {org?.location?.coordinates?.[1]}, {org?.location?.coordinates?.[0]}
                </span>
              </div>
            </div>

            {org?.verificationNotes && (
              <div className="rounded-xl border border-ink/10 bg-cream/60 p-3 text-[11px]">
                <span className="font-semibold text-ink block mb-0.5">Admin Note:</span>
                <span className="text-ink/75">{org.verificationNotes}</span>
              </div>
            )}
          </div>
        </div>

        {/* Right side: Editable Requirements Form */}
        <div className="lg:col-span-2">
          <div className="rounded-2xl border border-ink/10 bg-white p-6 sm:p-8 shadow-xs">
            <h3 className="text-base font-bold text-forest mb-4 flex items-center gap-2">
              <Users className="h-4 w-4" />
              Demand & Handling Requirements
            </h3>

            <form onSubmit={handleSave} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block font-medium text-ink/80">Contact Person Name</label>
                  <input
                    type="text"
                    required
                    value={contactName}
                    onChange={(e) => setContactName(e.target.value)}
                    className="input"
                  />
                </div>

                <div>
                  <label className="mb-1 block font-medium text-ink/80">Contact Phone</label>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="input"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block font-medium text-ink/80">People Served Daily</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={peopleServed}
                    onChange={(e) => setPeopleServed(Number(e.target.value))}
                    className="input"
                  />
                </div>

                <div>
                  <label className="mb-1 block font-medium text-ink/80">Storage Capacity (kg)</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={capacityKg}
                    onChange={(e) => setCapacityKg(Number(e.target.value))}
                    className="input"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1 block font-medium text-ink/80">
                  Dietary Restrictions (comma separated)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Vegetarian, Halal, Jain, Nut-free"
                  value={dietary}
                  onChange={(e) => setDietary(e.target.value)}
                  className="input"
                />
                <span className="text-[10px] text-ink/50 mt-1 block">
                  Non-compliant donations will be excluded by the matching engine.
                </span>
              </div>

              <div>
                <label className="mb-1 block font-medium text-ink/80">
                  Food Categories Accepted (comma separated)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Cooked Meals, Bakery, Fresh Produce, Dairy"
                  value={categories}
                  onChange={(e) => setCategories(e.target.value)}
                  className="input"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block font-medium text-ink/80">Operating Open Time</label>
                  <input
                    type="time"
                    value={openTime}
                    onChange={(e) => setOpenTime(e.target.value)}
                    className="input"
                  />
                </div>

                <div>
                  <label className="mb-1 block font-medium text-ink/80">Operating Close Time</label>
                  <input
                    type="time"
                    value={closeTime}
                    onChange={(e) => setCloseTime(e.target.value)}
                    className="input"
                  />
                </div>
              </div>

              {msg && (
                <div
                  role="alert"
                  className={`rounded-xl p-3 text-xs ${
                    msg.includes("success")
                      ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                      : "bg-red-50 text-red-700 border border-red-200"
                  }`}
                >
                  {msg}
                </div>
              )}

              <div className="pt-3 border-t border-ink/10 flex justify-end">
                <button
                  className="btn py-2 px-5 text-xs font-semibold shadow-xs flex items-center gap-1.5"
                  disabled={busy}
                >
                  <Save className="h-3.5 w-3.5" />
                  {busy ? "Saving Changes…" : "Save Requirements"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </main>
  );
}
