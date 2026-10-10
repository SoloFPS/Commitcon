"use client";
import { useState } from "react";
import { Clock, ShieldAlert, ShieldCheck, Zap, ArrowRight, Loader2, CheckCircle2 } from "lucide-react";
import { OrganizationVerificationModal } from "./OrganizationVerificationModal";

interface VerificationBannerProps {
  status: string;
  role?: string;
  orgName?: string;
  onVerified?: () => void;
}

export function VerificationBanner({ status: initialStatus, role, orgName, onVerified }: VerificationBannerProps) {
  const [status, setStatus] = useState(initialStatus);
  const [modalOpen, setModalOpen] = useState(false);
  const [instantLoading, setInstantLoading] = useState(false);
  const [justVerified, setJustVerified] = useState(false);

  if (status === "VERIFIED" || status === "ACTIVE") {
    if (justVerified) {
      return (
        <div className="mb-6 rounded-xl border border-emerald-300 bg-emerald-50 p-4 text-emerald-900 shadow-2xs animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
              <div>
                <h4 className="text-sm font-semibold text-emerald-900">Organization Verified Successfully! 🎉</h4>
                <p className="text-xs text-emerald-700">
                  All operational capabilities are now unlocked. You can publish surplus food or claim donations immediately.
                </p>
              </div>
            </div>
            <button
              onClick={() => window.location.reload()}
              className="btn text-xs py-1.5 px-3 bg-emerald-700 hover:bg-emerald-800 text-white shadow-2xs shrink-0"
            >
              Refresh View
            </button>
          </div>
        </div>
      );
    }
    return null;
  }

  const handleInstantVerify = async () => {
    setInstantLoading(true);
    try {
      const res = await fetch("/api/organization/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ instantVerify: true }),
      });
      if (res.ok) {
        setStatus("VERIFIED");
        setJustVerified(true);
        if (onVerified) onVerified();
        setTimeout(() => {
          window.location.reload();
        }, 1200);
      } else {
        setModalOpen(true);
      }
    } catch {
      setModalOpen(true);
    } finally {
      setInstantLoading(false);
    }
  };

  const handleModalSuccess = () => {
    setStatus("VERIFIED");
    setJustVerified(true);
    if (onVerified) onVerified();
  };

  if (status === "REJECTED") {
    return (
      <>
        <div className="mb-6 rounded-xl border border-red-300 bg-red-50 p-4 text-red-800 shadow-2xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <ShieldAlert className="h-5 w-5 text-red-600 mt-0.5 shrink-0" />
              <div>
                <h4 className="text-sm font-semibold">Verification Application Declined</h4>
                <p className="mt-1 text-xs text-red-700 leading-relaxed">
                  Your organization registration was not approved. Operational actions (publishing donations, claiming
                  food) are currently restricted. You can re-submit your credentials to get verified.
                </p>
              </div>
            </div>
            <button
              onClick={() => setModalOpen(true)}
              className="btn py-2 px-3.5 text-xs font-semibold shrink-0 bg-red-700 hover:bg-red-800 text-white shadow-2xs flex items-center gap-1.5"
            >
              <ShieldCheck className="h-4 w-4" />
              <span>Re-Verify Organization</span>
            </button>
          </div>
        </div>

        <OrganizationVerificationModal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          orgName={orgName}
          role={role}
          onSuccess={handleModalSuccess}
        />
      </>
    );
  }

  return (
    <>
      <div className="mb-6 rounded-xl border border-amber-300 bg-amber-50/95 p-4 text-amber-900 shadow-2xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <Clock className="h-5 w-5 text-amber-600 mt-0.5 shrink-0 animate-pulse" />
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-sm font-bold text-amber-950">
                  Account Pending Organization Verification
                </h4>
                <span className="rounded-full bg-amber-200/80 px-2 py-0.5 text-[10px] font-bold text-amber-900 uppercase">
                  Action Required
                </span>
              </div>
              <p className="mt-1 text-xs text-amber-800 leading-relaxed max-w-2xl">
                Your {role === "SHELTER" ? "shelter" : "food provider"} account requires verification before
                operational actions (posting surplus food, claiming donations, running matches) can take place.
                You can get verified immediately via our instant express verification or license submission.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0 pt-2 lg:pt-0">
            <button
              onClick={handleInstantVerify}
              disabled={instantLoading}
              className="btn py-2 px-3.5 text-xs font-semibold bg-emerald-700 hover:bg-emerald-800 text-white shadow-xs flex items-center gap-1.5 transition-all"
              title="Instantly verify organization with FoodBridge Partner Accreditation"
            >
              {instantLoading ? (
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
              onClick={() => setModalOpen(true)}
              className="btn-ghost py-2 px-3 text-xs font-semibold bg-white border border-amber-300/80 hover:bg-amber-100/50 text-amber-950 shadow-2xs flex items-center gap-1.5"
            >
              <ShieldCheck className="h-3.5 w-3.5 text-forest" />
              <span>Verify with License / Tax ID</span>
            </button>
          </div>
        </div>
      </div>

      <OrganizationVerificationModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        orgName={orgName}
        role={role}
        onSuccess={handleModalSuccess}
      />
    </>
  );
}
