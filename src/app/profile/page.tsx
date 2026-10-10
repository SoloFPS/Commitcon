"use client";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import {
  Building2,
  Users,
  ShieldCheck,
  ShieldAlert,
  Clock,
  Phone,
  Mail,
  Save,
  CheckCircle2,
  AlertCircle,
  Zap,
  Sparkles,
  Loader2,
  MapPin,
  Utensils,
} from "lucide-react";
import { OrganizationVerificationModal } from "@/components/OrganizationVerificationModal";

export default function ProfilePage() {
  const { data: session } = useSession();
  const [org, setOrg] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const [verificationModalOpen, setVerificationModalOpen] = useState(false);
  const [instantVerifying, setInstantVerifying] = useState(false);

  const [peopleServed, setPeopleServed] = useState<number>(50);
  const [capacityKg, setCapacityKg] = useState<number>(50);
  const [dietary, setDietary] = useState<string>("");
  const [categories, setCategories] = useState<string>("");
  const [openTime, setOpenTime] = useState<string>("08:00");
  const [closeTime, setCloseTime] = useState<string>("20:00");
  const [contactName, setContactName] = useState<string>("");
  const [phone, setPhone] = useState<string>("");

  const fetchProfile = () => {
    fetch("/api/organization/profile")
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
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  async function handleInstantVerify() {
    setInstantVerifying(true);
    try {
      const res = await fetch("/api/organization/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ instantVerify: true }),
      });
      const data = await res.json();
      setInstantVerifying(false);
      if (res.ok) {
        setOrg(data.organization);
        setMsg("Organization verified successfully! All operational features are now unlocked.");
      } else {
        setVerificationModalOpen(true);
      }
    } catch {
      setInstantVerifying(false);
      setVerificationModalOpen(true);
    }
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMsg("");

    const body = {
      ...(org?.kind === "SHELTER"
        ? {
            peopleServed,
            capacityKg,
            dietaryRestrictions: dietary
              .split(",")
              .map((s) => s.trim())
              .filter(Boolean),
          }
        : {}),
      foodCategories: categories
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
      operatingHours: { open: openTime, close: closeTime },
      contactName,
      phone,
    };

    try {
      const res = await fetch("/api/organization/profile", {
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
      setMsg("Profile updated successfully!");
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

  const isVerified = org?.verificationStatus === "VERIFIED";
  const isRejected = org?.verificationStatus === "REJECTED";

  return (
    <main className="mx-auto max-w-4xl px-4 sm:px-6 py-10">
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight text-forest">Organization Profile</h1>
        <p className="mt-1 text-xs text-ink/65">
          Manage your organization details, verification credentials, and operational settings.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left column: Organization & Verification status */}
        <div className="space-y-6">
          <div className="rounded-2xl border border-ink/10 bg-white p-6 shadow-xs text-xs space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-forest/10 text-forest">
                <Building2 className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-forest">{org?.name}</h3>
                <span className="text-[11px] text-ink/60">{org?.kind} • {org?.category}</span>
              </div>
            </div>

            {/* Verification status box */}
            <div className="rounded-xl border p-4 transition-colors space-y-3 bg-ink/[0.02]">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-ink/70">Verification Status</span>
                <span
                  className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                    isVerified
                      ? "bg-emerald-100 text-emerald-800"
                      : isRejected
                      ? "bg-red-100 text-red-800"
                      : "bg-amber-100 text-amber-800"
                  }`}
                >
                  {isVerified ? (
                    <>
                      <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                      <span>VERIFIED</span>
                    </>
                  ) : isRejected ? (
                    <>
                      <ShieldAlert className="h-3 w-3 text-red-600" />
                      <span>DECLINED</span>
                    </>
                  ) : (
                    <>
                      <Clock className="h-3 w-3 text-amber-600 animate-pulse" />
                      <span>PENDING</span>
                    </>
                  )}
                </span>
              </div>

              {isVerified ? (
                <div className="space-y-2 pt-1 border-t border-ink/10 text-[11px]">
                  <div className="flex items-center gap-2 text-emerald-800 font-semibold">
                    <ShieldCheck className="h-4 w-4 text-emerald-600" />
                    <span>FoodBridge Certified Partner</span>
                  </div>
                  {org?.verifiedAt && (
                    <div className="text-ink/60 text-[10px]">
                      Verified on {new Date(org.verifiedAt).toLocaleDateString()}
                    </div>
                  )}
                  {org?.verificationNotes && (
                    <div className="rounded-lg bg-emerald-50/80 p-2.5 text-[10px] text-emerald-900 leading-relaxed border border-emerald-200/50">
                      <strong>Accreditation Note:</strong> {org.verificationNotes}
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-3 pt-1 border-t border-ink/10">
                  <p className="text-[11px] text-amber-900/90 leading-relaxed">
                    Operational actions (posting surplus, accepting offers) unlock once verified.
                  </p>

                  <div className="space-y-2">
                    <button
                      type="button"
                      onClick={handleInstantVerify}
                      disabled={instantVerifying}
                      className="btn w-full py-2 text-xs font-semibold shadow-xs flex items-center justify-center gap-1.5 bg-emerald-700 hover:bg-emerald-800 text-white"
                    >
                      {instantVerifying ? (
                        <>
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          <span>Verifying…</span>
                        </>
                      ) : (
                        <>
                          <Zap className="h-3.5 w-3.5 text-amber-300" />
                          <span>Instant 1-Click Verify</span>
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => setVerificationModalOpen(true)}
                      className="btn-ghost w-full py-2 text-xs font-semibold border border-ink/15 bg-white hover:bg-ink/5 flex items-center justify-center gap-1.5"
                    >
                      <ShieldCheck className="h-3.5 w-3.5 text-forest" />
                      <span>Verify with License / ID</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Address & Coords */}
            <div className="border-t border-ink/10 pt-3 space-y-2">
              <div>
                <span className="text-ink/50 block text-[11px]">Address</span>
                <span className="font-medium text-ink">
                  {org?.address}, {org?.city} {org?.postalCode}
                </span>
              </div>

              <div>
                <span className="text-ink/50 block text-[11px]">Geo Coordinates</span>
                <span className="font-mono text-ink text-[11px]">
                  {org?.location?.coordinates?.[1]}, {org?.location?.coordinates?.[0]}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right column: Editable Requirements Form */}
        <div className="lg:col-span-2">
          <div className="rounded-2xl border border-ink/10 bg-white p-6 sm:p-8 shadow-xs">
            <h3 className="text-base font-bold text-forest mb-4 flex items-center gap-2">
              <Users className="h-4 w-4" />
              {org?.kind === "SHELTER" ? "Demand & Capacity Settings" : "Provider Operational Settings"}
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

              {org?.kind === "SHELTER" && (
                <>
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
                </>
              )}

              <div>
                <label className="mb-1 block font-medium text-ink/80">
                  {org?.kind === "SHELTER" ? "Food Categories Accepted" : "Primary Food Categories Handled"} (comma separated)
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
                  className={`rounded-xl p-3 text-xs flex items-center gap-2 ${
                    msg.includes("success")
                      ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                      : "bg-red-50 text-red-700 border border-red-200"
                  }`}
                >
                  {msg.includes("success") ? (
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                  ) : (
                    <AlertCircle className="h-4 w-4 text-red-600 shrink-0" />
                  )}
                  <span>{msg}</span>
                </div>
              )}

              <div className="pt-3 border-t border-ink/10 flex justify-end">
                <button
                  className="btn py-2 px-5 text-xs font-semibold shadow-xs flex items-center gap-1.5"
                  disabled={busy}
                >
                  <Save className="h-3.5 w-3.5" />
                  {busy ? "Saving Changes…" : "Save Settings"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      <OrganizationVerificationModal
        isOpen={verificationModalOpen}
        onClose={() => setVerificationModalOpen(false)}
        orgName={org?.name}
        role={org?.kind}
        onSuccess={() => {
          fetchProfile();
          setMsg("Organization verified successfully! All operational features are now unlocked.");
        }}
      />
    </main>
  );
}
