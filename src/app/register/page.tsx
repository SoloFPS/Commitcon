"use client";
import { useState } from "react";
import Link from "next/link";
import {
  Building2,
  HeartHandshake,
  MapPin,
  Compass,
  CheckCircle2,
  Lock,
  Mail,
  Phone,
  User,
} from "lucide-react";

type Role = "PROVIDER" | "SHELTER";

export default function Register() {
  const [role, setRole] = useState<Role>("PROVIDER");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);
  const [lat, setLat] = useState("40.7128");
  const [lng, setLng] = useState("-74.0060");
  const [locating, setLocating] = useState(false);

  const list = (v: unknown) =>
    String(v ?? "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

  function handleGetLocation() {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser");
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLat(pos.coords.latitude.toFixed(4));
        setLng(pos.coords.longitude.toFixed(4));
        setLocating(false);
      },
      (err) => {
        alert("Unable to retrieve location: " + err.message);
        setLocating(false);
      }
    );
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setErrors({});
    setMsg("");
    const f = Object.fromEntries(new FormData(e.currentTarget));
    const body = {
      ...f,
      lat,
      lng,
      role,
      acceptTerms: f.acceptTerms === "on",
      foodCategories: list(f.foodCategories),
      dietaryRestrictions: list(f.dietaryRestrictions),
    };

    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      setBusy(false);

      if (res.ok) {
        window.location.href = "/login?registered=true";
        return;
      }

      if (data.issues) {
        setErrors(
          Object.fromEntries(data.issues.map((i: any) => [i.path.join("."), i.message]))
        );
      } else {
        setMsg(data.error ?? "Registration failed");
      }
    } catch {
      setBusy(false);
      setMsg("Connection failed. Please check network and try again.");
    }
  }

  const F = (
    name: string,
    label: string,
    type = "text",
    placeholder = "",
    icon?: React.ReactNode
  ) => (
    <div>
      <label className="mb-1 block text-xs font-medium text-ink/80">{label}</label>
      <div className="relative">
        <input
          name={name}
          type={type}
          required
          placeholder={placeholder}
          className="input"
        />
        {icon && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-ink/30">{icon}</div>
        )}
      </div>
      {errors[name] && (
        <span role="alert" className="mt-1 block text-xs text-red-600 font-medium">
          {errors[name]}
        </span>
      )}
    </div>
  );

  return (
    <main className="mx-auto max-w-2xl px-6 py-12">
      <div className="rounded-2xl border border-ink/10 bg-white p-8 shadow-sm">
        <div className="mb-8">
          <h1 className="text-2xl font-bold tracking-tight text-forest">Register Organization</h1>
          <p className="mt-1 text-xs text-ink/60">
            Join the FoodBridge network to redirect surplus food to communities in need.
          </p>
        </div>

        {/* Role Selection */}
        <label className="mb-2 block text-xs font-semibold text-ink/70 uppercase tracking-wider">
          Account Type
        </label>
        <div className="mb-6 grid grid-cols-2 gap-3" role="radiogroup" aria-label="Account type">
          <button
            type="button"
            role="radio"
            aria-checked={role === "PROVIDER"}
            onClick={() => setRole("PROVIDER")}
            className={`flex flex-col items-start rounded-xl border p-4 text-left transition-all ${
              role === "PROVIDER"
                ? "border-forest bg-forest/5 ring-2 ring-forest/20"
                : "border-ink/15 hover:border-ink/30"
            }`}
          >
            <div className="flex items-center gap-2 font-semibold text-sm text-forest mb-1">
              <Building2 className="h-4 w-4" />
              Food Provider
            </div>
            <p className="text-[11px] text-ink/65 leading-tight">
              Restaurant, bakery, supermarket, hotel or catering business.
            </p>
          </button>

          <button
            type="button"
            role="radio"
            aria-checked={role === "SHELTER"}
            onClick={() => setRole("SHELTER")}
            className={`flex flex-col items-start rounded-xl border p-4 text-left transition-all ${
              role === "SHELTER"
                ? "border-amber-warn bg-amber-warn/5 ring-2 ring-amber-warn/20"
                : "border-ink/15 hover:border-ink/30"
            }`}
          >
            <div className="flex items-center gap-2 font-semibold text-sm text-amber-warn mb-1">
              <HeartHandshake className="h-4 w-4" />
              Shelter / Charity
            </div>
            <p className="text-[11px] text-ink/65 leading-tight">
              Shelter, orphanage, soup kitchen, food bank, or charitable NGO.
            </p>
          </button>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {F("orgName", "Organization Name", "text", "e.g. Green Leaf Bistro", <Building2 className="h-4 w-4" />)}
            {F("contactName", "Primary Contact Person", "text", "e.g. Alex Morgan", <User className="h-4 w-4" />)}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {F("email", "Email Address", "email", "contact@organization.org", <Mail className="h-4 w-4" />)}
            {F("phone", "Phone Number", "tel", "+1 555-0192", <Phone className="h-4 w-4" />)}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              {F("address", "Street Address", "text", "123 Main Street")}
            </div>
            {F("city", "City", "text", "New York")}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {F("postalCode", "Postal Code", "text", "10001")}
            {F("category", "Organization Subtype", "text", role === "PROVIDER" ? "Restaurant / Cafe" : "Emergency Shelter")}
          </div>

          {/* Coordinates and Location Helper */}
          <div className="rounded-xl border border-ink/10 bg-cream/50 p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-forest">
                <MapPin className="h-4 w-4" />
                <span>Geographical Coordinates</span>
              </div>
              <button
                type="button"
                onClick={handleGetLocation}
                disabled={locating}
                className="flex items-center gap-1 text-[11px] font-semibold text-forest hover:underline"
              >
                <Compass className="h-3 w-3" />
                {locating ? "Detecting…" : "Detect Current Location"}
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] text-ink/60">Latitude</label>
                <input
                  type="number"
                  step="any"
                  required
                  value={lat}
                  onChange={(e) => setLat(e.target.value)}
                  className="input text-xs"
                />
              </div>
              <div>
                <label className="text-[11px] text-ink/60">Longitude</label>
                <input
                  type="number"
                  step="any"
                  required
                  value={lng}
                  onChange={(e) => setLng(e.target.value)}
                  className="input text-xs"
                />
              </div>
            </div>
            <p className="mt-2 text-[10px] text-ink/50">
              Coordinates enable the smart matching engine to calculate real transit feasibility.
            </p>
          </div>

          {/* Shelter specific fields */}
          {role === "SHELTER" && (
            <div className="rounded-xl border border-amber-warn/20 bg-amber-warn/5 p-4 space-y-3">
              <h4 className="text-xs font-semibold text-amber-warn uppercase tracking-wider">
                Shelter Demand Requirements
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {F("peopleServed", "Daily People Served", "number", "50")}
                <div>
                  <label className="mb-1 block text-xs font-medium text-ink/80">
                    Dietary Restrictions (comma separated)
                  </label>
                  <input
                    name="dietaryRestrictions"
                    placeholder="e.g. Vegetarian, Halal, Nut-free"
                    className="input text-xs"
                  />
                </div>
              </div>
            </div>
          )}

          <div>
            <label className="mb-1 block text-xs font-medium text-ink/80">
              Food Categories Handled (comma separated)
            </label>
            <input
              name="foodCategories"
              placeholder="e.g. Cooked Meals, Bakery, Fresh Produce, Dairy, Packaged Goods"
              className="input text-xs"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {F("password", "Password", "password", "••••••••", <Lock className="h-4 w-4" />)}
            {F("confirmPassword", "Confirm Password", "password", "••••••••", <Lock className="h-4 w-4" />)}
          </div>

          <div className="pt-2">
            <label className="flex items-center gap-2.5 text-xs text-ink/80 cursor-pointer">
              <input type="checkbox" name="acceptTerms" required className="h-4 w-4 rounded accent-forest" />
              <span>
                I agree to the FoodBridge safety guidelines and food handling terms.
              </span>
            </label>
            {errors.acceptTerms && (
              <span className="mt-1 block text-xs text-red-600">{errors.acceptTerms}</span>
            )}
          </div>

          {msg && (
            <div role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-700">
              {msg}
            </div>
          )}

          <button className="btn w-full py-3 text-sm font-semibold shadow-xs" disabled={busy}>
            {busy ? "Registering Organization…" : "Create Account"}
          </button>

          <div className="text-center pt-2">
            <p className="text-xs text-ink/60">
              Already registered?{" "}
              <Link href="/login" className="font-semibold text-forest hover:underline">
                Sign in here
              </Link>
            </p>
          </div>
        </form>
      </div>
    </main>
  );
}
