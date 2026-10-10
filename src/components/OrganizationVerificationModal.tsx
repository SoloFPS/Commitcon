"use client";
import { useState, useEffect } from "react";
import {
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  FileText,
  Zap,
  Building2,
  X,
  Sparkles,
  ArrowRight,
  Loader2,
  Lock,
} from "lucide-react";

interface OrganizationVerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  orgName?: string;
  role?: string;
  onSuccess?: () => void;
}

export function OrganizationVerificationModal({
  isOpen,
  onClose,
  orgName,
  role = "PROVIDER",
  onSuccess,
}: OrganizationVerificationModalProps) {
  const [tab, setTab] = useState<"instant" | "license">("instant");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Form states for manual license
  const [docType, setDocType] = useState(
    role === "SHELTER" ? "501(c)(3) Non-Profit Charity Registration" : "Food Safety & Hygiene Permit"
  );
  const [regNumber, setRegNumber] = useState("");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen && !loading) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, loading, onClose]);

  if (!isOpen) return null;

  async function handleVerify(e?: React.FormEvent) {
    if (e) e.preventDefault();
    setLoading(true);
    setError(null);

    const payload =
      tab === "instant"
        ? {
            instantVerify: true,
            notes: "Verified via FoodBridge Instant Accreditation System",
          }
        : {
            instantVerify: false,
            documentType: docType,
            registrationNumber: regNumber || `REG-${Date.now().toString().slice(-6)}`,
            notes: notes || `Verified with ${docType}`,
          };

    try {
      const res = await fetch("/api/organization/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      setLoading(false);

      if (!res.ok) {
        setError(data.error || "Failed to complete organization verification");
        return;
      }

      setSuccess(true);
      if (onSuccess) {
        onSuccess();
      }
    } catch {
      setLoading(false);
      setError("Network connection issue. Please check your network and try again.");
    }
  }

  const handleFinish = () => {
    onClose();
    window.location.reload();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-verification-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/50 backdrop-blur-xs transition-opacity duration-200"
    >
      <div className="relative w-full max-w-lg rounded-2xl bg-white shadow-2xl border border-ink/10 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header decoration */}
        <div className="bg-gradient-to-r from-forest to-emerald-800 p-6 text-white relative">
          <button
            onClick={onClose}
            disabled={loading}
            className="absolute top-4 right-4 rounded-lg p-1.5 text-white/80 hover:text-white hover:bg-white/10 transition-colors"
            aria-label="Close modal"
          >
            <X className="h-5 w-5" />
          </button>

          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/15 backdrop-blur-md shadow-inner text-white">
              <ShieldCheck className="h-6 w-6 text-emerald-300" />
            </div>
            <div>
              <span className="text-[11px] font-semibold tracking-wider uppercase text-emerald-300 flex items-center gap-1">
                <Sparkles className="h-3 w-3" /> FoodBridge Accreditation
              </span>
              <h3 id="modal-verification-title" className="text-xl font-bold tracking-tight">
                Verify Your Organization
              </h3>
            </div>
          </div>
          <p className="mt-2 text-xs text-white/80 leading-relaxed">
            {orgName ? <span className="font-semibold">{orgName}</span> : "Your organization"} is
            one step away from unlocking full access to create surplus donations, claim matched food, and
            access logistics.
          </p>
        </div>

        {/* Content body */}
        <div className="p-6">
          {success ? (
            <div className="py-4 text-center space-y-4">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 shadow-inner">
                <CheckCircle2 className="h-10 w-10 animate-bounce" />
              </div>
              <div>
                <h4 className="text-lg font-bold text-forest">Verification Complete! 🎉</h4>
                <p className="mt-1 text-xs text-ink/70 max-w-sm mx-auto">
                  Your organization status is now <strong className="text-emerald-700">VERIFIED</strong>.
                  All operational capabilities, surplus publishing, and donation claiming are permanently
                  unlocked.
                </p>
              </div>

              <div className="rounded-xl bg-emerald-50/80 border border-emerald-200 p-3.5 text-left text-xs text-emerald-900 space-y-1">
                <div className="flex items-center gap-2 font-semibold">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                  <span>Immediate Platform Privileges Unlocked:</span>
                </div>
                <ul className="list-disc list-inside text-[11px] text-emerald-800 space-y-0.5 ml-2">
                  <li>Publish & claim surplus food listings with zero delay</li>
                  <li>Automated AI matching with local shelters and kitchens</li>
                  <li>Safe verification handover codes enabled for secure transfers</li>
                </ul>
              </div>

              <button
                onClick={handleFinish}
                className="btn w-full py-2.5 text-xs font-semibold shadow-xs flex items-center justify-center gap-2 bg-emerald-700 hover:bg-emerald-800"
              >
                <span>Continue & Refresh Platform</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <div>
              {/* Method Tabs */}
              <div className="flex rounded-xl bg-ink/5 p-1 mb-5">
                <button
                  type="button"
                  onClick={() => setTab("instant")}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-semibold transition-all ${
                    tab === "instant"
                      ? "bg-white text-forest shadow-xs font-bold"
                      : "text-ink/60 hover:text-ink"
                  }`}
                >
                  <Zap className="h-3.5 w-3.5 text-amber-500" />
                  <span>Instant Verification</span>
                  <span className="rounded-full bg-emerald-100 px-1.5 py-0.2 text-[9px] font-bold text-emerald-800">
                    Express
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => setTab("license")}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-semibold transition-all ${
                    tab === "license"
                      ? "bg-white text-forest shadow-xs font-bold"
                      : "text-ink/60 hover:text-ink"
                  }`}
                >
                  <FileText className="h-3.5 w-3.5 text-forest" />
                  <span>License / Tax ID</span>
                </button>
              </div>

              {error && (
                <div
                  role="alert"
                  className="mb-4 rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-800 flex items-start gap-2"
                >
                  <AlertCircle className="h-4 w-4 text-red-600 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              {tab === "instant" ? (
                <div className="space-y-4">
                  <div className="rounded-xl border border-forest/15 bg-forest/5 p-4 text-xs text-forest space-y-2">
                    <div className="flex items-center gap-2 font-bold text-sm">
                      <Sparkles className="h-4 w-4 text-amber-500" />
                      <span>1-Click Express Verification</span>
                    </div>
                    <p className="text-ink/75 leading-relaxed text-[11px]">
                      Instant verification validates your registered organization against FoodBridge&apos;s
                      verified civic database. This unlocks full operational permissions immediately with no
                      waiting period.
                    </p>
                    <div className="pt-2 border-t border-forest/10 flex items-center justify-between text-[11px] text-ink/60">
                      <span>Verification standard:</span>
                      <span className="font-semibold text-forest">FoodBridge Partner Tier 1</span>
                    </div>
                  </div>

                  <div className="rounded-lg bg-amber-50/70 border border-amber-200 p-3 text-[11px] text-amber-900 flex items-center gap-2">
                    <Lock className="h-4 w-4 text-amber-600 shrink-0" />
                    <span>
                      By verifying, you confirm that your organization adheres to local food safety and
                      hygiene standards.
                    </span>
                  </div>

                  <div className="pt-2 flex gap-3">
                    <button
                      type="button"
                      onClick={onClose}
                      disabled={loading}
                      className="btn-ghost flex-1 py-2.5 text-xs font-semibold"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={() => handleVerify()}
                      disabled={loading}
                      className="btn flex-2 py-2.5 text-xs font-semibold shadow-xs flex items-center justify-center gap-2 bg-emerald-700 hover:bg-emerald-800"
                    >
                      {loading ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          <span>Verifying Organization…</span>
                        </>
                      ) : (
                        <>
                          <ShieldCheck className="h-4 w-4 text-emerald-200" />
                          <span>Verify Organization Now</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleVerify} className="space-y-3.5">
                  <div>
                    <label className="block text-xs font-semibold text-ink/70 mb-1">
                      Verification Document / Credential Type
                    </label>
                    <select
                      value={docType}
                      onChange={(e) => setDocType(e.target.value)}
                      className="input text-xs"
                      required
                    >
                      <option value="Food Safety & Hygiene Permit">
                        Food Safety & Hygiene Permit (Health Dept)
                      </option>
                      <option value="501(c)(3) Non-Profit Charity Registration">
                        501(c)(3) Non-Profit Charity / NGO Tax Registration
                      </option>
                      <option value="Commercial Kitchen Operator License">
                        Commercial Kitchen Operator License
                      </option>
                      <option value="Municipal Business Registration Certificate">
                        Municipal Business Registration Certificate
                      </option>
                      <option value="Food Bank Affiliation Certificate">
                        Food Bank Network Affiliation Certificate
                      </option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-ink/70 mb-1">
                      Registration / License Number
                    </label>
                    <input
                      type="text"
                      value={regNumber}
                      onChange={(e) => setRegNumber(e.target.value)}
                      placeholder="e.g. LIC-2026-88219 or EIN-44-12903"
                      className="input text-xs"
                      required
                    />
                    <span className="text-[10px] text-ink/50 mt-0.5 block">
                      Any official license or state registration ID number.
                    </span>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-ink/70 mb-1">
                      Issuing Authority or Notes (Optional)
                    </label>
                    <input
                      type="text"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="e.g. City Health Inspection Dept / State Charity Bureau"
                      className="input text-xs"
                    />
                  </div>

                  <div className="pt-2 flex gap-3">
                    <button
                      type="button"
                      onClick={onClose}
                      disabled={loading}
                      className="btn-ghost flex-1 py-2.5 text-xs font-semibold"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={loading}
                      className="btn flex-2 py-2.5 text-xs font-semibold shadow-xs flex items-center justify-center gap-2 bg-emerald-700 hover:bg-emerald-800"
                    >
                      {loading ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          <span>Verifying…</span>
                        </>
                      ) : (
                        <>
                          <ShieldCheck className="h-4 w-4 text-emerald-200" />
                          <span>Submit & Verify</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
