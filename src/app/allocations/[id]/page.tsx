"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import {
  Truck,
  ArrowLeft,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Building2,
  Calendar,
  ShieldCheck,
  MapPin,
  KeyRound,
  FileText,
  AlertCircle,
} from "lucide-react";
import { LocationMap } from "@/components/LocationMap";

const STATUS_STEPS = [
  { key: "OFFER_PENDING", label: "Offer Created" },
  { key: "ACCEPTED", label: "Offer Accepted (Reserved)" },
  { key: "SCHEDULED", label: "Pickup Scheduled" },
  { key: "PICKUP_CONFIRMED", label: "Picked Up / In Transit" },
  { key: "COMPLETED", label: "Delivered & Verified" },
];

export default function AllocationTrackerPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;
  const { data: session } = useSession();

  const [offer, setOffer] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [busyAction, setBusyAction] = useState<string | null>(null);

  // Form states for modals/actions
  const [cancelReason, setCancelReason] = useState("");
  const [failReason, setFailReason] = useState("");
  const [scheduledTime, setScheduledTime] = useState("");
  const [inputDeliveryCode, setInputDeliveryCode] = useState("");
  const [deliveryNotes, setDeliveryNotes] = useState("");
  const [activeModal, setActiveModal] = useState<
    "CANCEL" | "FAIL" | "SCHEDULE" | "COMPLETE" | null
  >(null);

  const fetchOffer = () => {
    setLoading(true);
    fetch(`/api/offers/${id}`)
      .then((r) => r.json())
      .then((data) => {
        setOffer(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    if (id) fetchOffer();
  }, [id]);

  const user = session?.user as any;
  const isDonor = user?.orgId && offer?.donor?._id === user.orgId;
  const isRecipient = user?.orgId && offer?.recipient?._id === user.orgId;
  const isAdmin = user?.role === "ADMIN";

  async function executeTransition(action: string, payload: any = {}) {
    setBusyAction(action);
    try {
      const res = await fetch(`/api/offers/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, ...payload }),
      });

      const data = await res.json();
      setBusyAction(null);
      setActiveModal(null);

      if (!res.ok) {
        alert(data.error || `Failed to perform action: ${action}`);
        return;
      }

      fetchOffer();
    } catch {
      setBusyAction(null);
      alert("Network error processing transition");
    }
  }

  if (loading) {
    return (
      <main className="mx-auto max-w-5xl px-4 sm:px-6 py-12 text-center text-xs text-ink/50 animate-pulse">
        Loading delivery timeline and location data...
      </main>
    );
  }

  if (!offer || offer.error) {
    return (
      <main className="mx-auto max-w-xl px-6 py-12 text-center">
        <AlertCircle className="mx-auto h-8 w-8 text-red-500 mb-2" />
        <h2 className="text-base font-semibold">Allocation record not found</h2>
        <Link href="/allocations" className="btn mt-4 text-xs">
          Return to Allocations
        </Link>
      </main>
    );
  }

  // Calculate current step index
  const currentStepIndex = STATUS_STEPS.findIndex((s) => s.key === offer.status);
  const isTerminated = offer.status === "CANCELLED" || offer.status === "FAILED_DELIVERY";

  return (
    <main className="mx-auto max-w-6xl px-4 sm:px-6 py-10">
      <Link
        href="/allocations"
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-ink/60 hover:text-forest mb-6"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Back to Allocations
      </Link>

      {/* Top Header Card */}
      <div className="rounded-2xl border border-ink/10 bg-white p-6 sm:p-8 shadow-xs mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-mono font-bold text-ink/50">
                #{offer._id.slice(-8).toUpperCase()}
              </span>
              <span
                className={`rounded-full px-2.5 py-0.5 text-[10px] font-semibold ${
                  offer.status === "COMPLETED"
                    ? "bg-emerald-100 text-emerald-800"
                    : offer.status === "ACCEPTED" || offer.status === "SCHEDULED"
                    ? "bg-blue-100 text-blue-800"
                    : offer.status === "PICKUP_CONFIRMED"
                    ? "bg-purple-100 text-purple-800"
                    : isTerminated
                    ? "bg-red-100 text-red-800"
                    : "bg-amber-100 text-amber-800"
                }`}
              >
                {offer.status.replace("_", " ")}
              </span>
            </div>
            <h1 className="text-2xl font-bold text-forest">
              {offer.quantity} {offer.donation?.unit} of {offer.donation?.title}
            </h1>
            <p className="text-xs text-ink/65 mt-0.5">
              From <span className="font-semibold text-ink">{offer.donor?.name}</span> to{" "}
              <span className="font-semibold text-ink">{offer.recipient?.name}</span>
            </p>
          </div>

          {/* Proof of Delivery Code Badge (Visible to Recipient & Admin) */}
          {(isRecipient || isAdmin) && (
            <div className="rounded-xl border border-emerald-300 bg-emerald-50/90 p-4 shrink-0 text-center shadow-xs">
              <div className="flex items-center justify-center gap-1.5 text-xs font-semibold text-emerald-900 mb-1">
                <KeyRound className="h-4 w-4 text-emerald-700" />
                Proof of Delivery Code
              </div>
              <span className="text-2xl font-mono font-extrabold tracking-widest text-emerald-800">
                {offer.proofOfDeliveryCode}
              </span>
              <p className="text-[10px] text-emerald-700 mt-1">
                Provide to driver upon physical receipt of food.
              </p>
            </div>
          )}
        </div>

        {/* Timeline Visualization */}
        <div className="mt-8 border-t border-ink/10 pt-8">
          <h3 className="text-xs font-bold text-ink/70 uppercase tracking-wider mb-6">
            Delivery Lifecycle Timeline
          </h3>

          {isTerminated ? (
            <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-xs text-red-800 flex items-center gap-3">
              <XCircle className="h-5 w-5 text-red-600 shrink-0" />
              <div>
                <span className="font-bold">
                  Allocation {offer.status === "CANCELLED" ? "Cancelled" : "Delivery Exception"}
                </span>
                <p className="text-red-700 mt-0.5">
                  Reason: {offer.cancellationReason || offer.failureReason || "No details provided"}
                </p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              {STATUS_STEPS.map((step, idx) => {
                const isPassed = currentStepIndex >= idx;
                const isCurrent = currentStepIndex === idx;

                return (
                  <div
                    key={step.key}
                    className={`rounded-xl border p-3.5 transition-all text-center flex flex-col justify-between ${
                      isCurrent
                        ? "border-forest bg-forest/5 ring-2 ring-forest/20 shadow-xs"
                        : isPassed
                        ? "border-emerald-200 bg-emerald-50/50"
                        : "border-ink/10 bg-cream/30 opacity-50"
                    }`}
                  >
                    <div className="flex items-center justify-center mb-2">
                      {isPassed ? (
                        <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                      ) : (
                        <Clock className="h-5 w-5 text-ink/30" />
                      )}
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-ink/50 uppercase block mb-0.5">
                        Step {idx + 1}
                      </span>
                      <span className="text-xs font-semibold text-forest leading-tight block">
                        {step.label}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Action Buttons Toolbar */}
        {!isTerminated && (
          <div className="mt-8 border-t border-ink/10 pt-6 flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap gap-2">
              {/* Recipient Accept/Reject */}
              {isRecipient && offer.status === "OFFER_PENDING" && (
                <>
                  <button
                    onClick={() => executeTransition("ACCEPT")}
                    disabled={!!busyAction}
                    className="btn py-2 px-4 text-xs font-semibold shadow-xs"
                  >
                    Accept & Reserve Quantity
                  </button>
                  <button
                    onClick={() => executeTransition("REJECT")}
                    disabled={!!busyAction}
                    className="btn-ghost py-2 px-3 text-xs text-red-700 hover:bg-red-50"
                  >
                    Decline Offer
                  </button>
                </>
              )}

              {/* Schedule Pickup */}
              {["ACCEPTED"].includes(offer.status) && (
                <button
                  onClick={() => setActiveModal("SCHEDULE")}
                  className="btn py-2 px-4 text-xs font-semibold shadow-xs"
                >
                  Schedule Pickup Time
                </button>
              )}

              {/* Donor Confirms Pickup */}
              {(isDonor || isAdmin) && ["ACCEPTED", "SCHEDULED"].includes(offer.status) && (
                <button
                  onClick={() => executeTransition("CONFIRM_PICKUP")}
                  disabled={!!busyAction}
                  className="btn py-2 px-4 text-xs font-semibold shadow-xs flex items-center gap-1.5"
                >
                  <Truck className="h-3.5 w-3.5" />
                  Confirm Food Picked Up
                </button>
              )}

              {/* Recipient / Admin Completes Delivery */}
              {(isRecipient || isAdmin) &&
                ["PICKUP_CONFIRMED", "SCHEDULED", "ACCEPTED"].includes(offer.status) && (
                  <button
                    onClick={() => setActiveModal("COMPLETE")}
                    className="rounded-xl bg-emerald-700 text-white px-4 py-2 text-xs font-semibold hover:bg-emerald-800 shadow-xs flex items-center gap-1.5"
                  >
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    Complete Delivery (Enter Code)
                  </button>
                )}
            </div>

            <div className="flex gap-2">
              {/* Report delivery failure */}
              {["SCHEDULED", "PICKUP_CONFIRMED"].includes(offer.status) && (
                <button
                  onClick={() => setActiveModal("FAIL")}
                  className="rounded-lg border border-red-200 px-3 py-1.5 text-xs text-red-700 hover:bg-red-50"
                >
                  Report Delivery Issue
                </button>
              )}

              {/* Cancel Allocation */}
              {["OFFER_PENDING", "ACCEPTED", "SCHEDULED"].includes(offer.status) && (
                <button
                  onClick={() => setActiveModal("CANCEL")}
                  className="rounded-lg border border-red-200 px-3 py-1.5 text-xs text-red-700 hover:bg-red-50"
                >
                  Cancel Allocation
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Grid: Logistics Map & Organization Details */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Logistics Radar Map */}
        <div className="rounded-2xl border border-ink/10 bg-white p-6 shadow-xs">
          <h3 className="text-sm font-bold text-forest mb-4 flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            Route & Proximity
          </h3>

          {offer.donor?.location?.coordinates && offer.recipient?.location?.coordinates ? (
            <LocationMap
              origin={{
                lng: offer.donor.location.coordinates[0],
                lat: offer.donor.location.coordinates[1],
                label: `Pickup: ${offer.donor.name}`,
              }}
              destination={{
                lng: offer.recipient.location.coordinates[0],
                lat: offer.recipient.location.coordinates[1],
                label: `Dropoff: ${offer.recipient.name}`,
              }}
              className="h-64"
            />
          ) : (
            <div className="h-48 rounded-xl border border-dashed border-ink/15 p-8 text-center text-xs text-ink/50 flex items-center justify-center">
              Geographical coordinates not available for direct route plotting.
            </div>
          )}

          <div className="mt-4 grid grid-cols-2 gap-3 text-xs border-t border-ink/10 pt-3">
            <div>
              <span className="font-semibold text-ink block">Pickup Location</span>
              <span className="text-ink/65 text-[11px] block">
                {offer.donation?.pickupAddress || offer.donor?.address}, {offer.donor?.city}
              </span>
            </div>
            <div>
              <span className="font-semibold text-ink block">Destination Shelter</span>
              <span className="text-ink/65 text-[11px] block">
                {offer.recipient?.address}, {offer.recipient?.city}
              </span>
            </div>
          </div>
        </div>

        {/* Audit History Log */}
        <div className="rounded-2xl border border-ink/10 bg-white p-6 shadow-xs">
          <h3 className="text-sm font-bold text-forest mb-4 flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Immutable Audit Log
          </h3>

          <div className="space-y-3">
            {(offer.history || []).map((h: any, idx: number) => (
              <div
                key={idx}
                className="flex items-start gap-3 border-l-2 border-forest pl-3 py-1 text-xs"
              >
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-forest">{h.status.replace("_", " ")}</span>
                    <span className="text-[10px] text-ink/40">
                      {new Date(h.at).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                      , {new Date(h.at).toLocaleDateString()}
                    </span>
                  </div>
                  {h.note && <p className="text-[11px] text-ink/70 mt-0.5">{h.note}</p>}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Complete Delivery Modal */}
      {activeModal === "COMPLETE" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <h3 className="text-base font-bold text-forest mb-2">Complete Delivery Handover</h3>
            <p className="text-xs text-ink/60 mb-4">
              Enter the 6-digit verification code provided by the receiving shelter to verify handover.
            </p>

            <div className="space-y-4 text-xs">
              <div>
                <label className="mb-1 block font-medium text-ink/80">
                  6-Digit Proof of Delivery Code
                </label>
                <input
                  type="text"
                  maxLength={6}
                  placeholder="e.g. 849201"
                  value={inputDeliveryCode}
                  onChange={(e) => setInputDeliveryCode(e.target.value)}
                  className="input font-mono text-center text-lg tracking-widest font-bold"
                />
              </div>

              <div>
                <label className="mb-1 block font-medium text-ink/80">Delivery Note / Condition</label>
                <textarea
                  rows={2}
                  placeholder="Food inspected on arrival, temperature compliant, handover verified."
                  value={deliveryNotes}
                  onChange={(e) => setDeliveryNotes(e.target.value)}
                  className="input"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setActiveModal(null)}
                  className="btn-ghost py-1.5 px-3 text-xs"
                >
                  Cancel
                </button>
                <button
                  onClick={() =>
                    executeTransition("COMPLETE", {
                      proofOfDeliveryCode: inputDeliveryCode,
                      deliveryNotes,
                    })
                  }
                  disabled={inputDeliveryCode.length !== 6 || !!busyAction}
                  className="btn py-1.5 px-4 text-xs font-semibold shadow-xs"
                >
                  {busyAction ? "Verifying…" : "Confirm Delivery"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Schedule Pickup Modal */}
      {activeModal === "SCHEDULE" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <h3 className="text-base font-bold text-forest mb-2">Schedule Pickup Window</h3>
            <p className="text-xs text-ink/60 mb-4">
              Select an agreed arrival time for pickup at the donor location.
            </p>

            <div className="space-y-4 text-xs">
              <div>
                <label className="mb-1 block font-medium text-ink/80">Scheduled Date & Time</label>
                <input
                  type="datetime-local"
                  required
                  value={scheduledTime}
                  onChange={(e) => setScheduledTime(e.target.value)}
                  className="input"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setActiveModal(null)}
                  className="btn-ghost py-1.5 px-3 text-xs"
                >
                  Cancel
                </button>
                <button
                  onClick={() =>
                    executeTransition("SCHEDULE", {
                      scheduledPickupTime: new Date(scheduledTime).toISOString(),
                    })
                  }
                  disabled={!scheduledTime || !!busyAction}
                  className="btn py-1.5 px-4 text-xs font-semibold shadow-xs"
                >
                  Save Schedule
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Cancel Modal */}
      {activeModal === "CANCEL" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <h3 className="text-base font-bold text-forest mb-2">Cancel Allocation</h3>
            <p className="text-xs text-ink/60 mb-4">
              Reserved quantities will be automatically restored to the available food pool.
            </p>

            <div className="space-y-4 text-xs">
              <div>
                <label className="mb-1 block font-medium text-ink/80">Reason for Cancellation</label>
                <textarea
                  rows={3}
                  required
                  placeholder="e.g. Recipient vehicle breakdown, provider adjusted closing hours."
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  className="input"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setActiveModal(null)}
                  className="btn-ghost py-1.5 px-3 text-xs"
                >
                  Go Back
                </button>
                <button
                  onClick={() => executeTransition("CANCEL", { reason: cancelReason })}
                  disabled={!cancelReason.trim() || !!busyAction}
                  className="rounded-xl bg-red-600 text-white px-4 py-1.5 text-xs font-semibold hover:bg-red-700"
                >
                  Confirm Cancellation
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Fail Delivery Modal */}
      {activeModal === "FAIL" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <h3 className="text-base font-bold text-forest mb-2">Report Delivery Exception</h3>
            <p className="text-xs text-ink/60 mb-4">
              Log an operational failure (e.g. food spoiled, premises locked, accident).
            </p>

            <div className="space-y-4 text-xs">
              <div>
                <label className="mb-1 block font-medium text-ink/80">Incident Explanation</label>
                <textarea
                  rows={3}
                  required
                  placeholder="Describe the failure condition for audit inspection..."
                  value={failReason}
                  onChange={(e) => setFailReason(e.target.value)}
                  className="input"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setActiveModal(null)}
                  className="btn-ghost py-1.5 px-3 text-xs"
                >
                  Go Back
                </button>
                <button
                  onClick={() => executeTransition("FAIL_DELIVERY", { reason: failReason })}
                  disabled={!failReason.trim() || !!busyAction}
                  className="rounded-xl bg-red-600 text-white px-4 py-1.5 text-xs font-semibold hover:bg-red-700"
                >
                  Submit Incident Report
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
