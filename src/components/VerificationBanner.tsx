import { AlertTriangle, Clock, ShieldAlert } from "lucide-react";

interface VerificationBannerProps {
  status: string;
  role?: string;
}

export function VerificationBanner({ status, role }: VerificationBannerProps) {
  if (status === "VERIFIED" || status === "ACTIVE") return null;

  if (status === "REJECTED") {
    return (
      <div className="mb-6 rounded-xl border border-red-300 bg-red-50 p-4 text-red-800 shadow-2xs">
        <div className="flex items-start gap-3">
          <ShieldAlert className="h-5 w-5 text-red-600 mt-0.5 shrink-0" />
          <div>
            <h4 className="text-sm font-semibold">Verification Application Declined</h4>
            <p className="mt-1 text-xs text-red-700 leading-relaxed">
              Your organization registration was not approved. Operational actions (publishing donations,
              claiming food) are restricted. Please review your organization profile details or contact
              administrative support.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mb-6 rounded-xl border border-amber-300 bg-amber-50/90 p-4 text-amber-900 shadow-2xs">
      <div className="flex items-start gap-3">
        <Clock className="h-5 w-5 text-amber-600 mt-0.5 shrink-0 animate-pulse" />
        <div>
          <h4 className="text-sm font-semibold">Account Pending Administrative Verification</h4>
          <p className="mt-1 text-xs text-amber-800 leading-relaxed">
            Your {role === "SHELTER" ? "shelter" : "food provider"} account is currently under
            administrative review. You can browse the platform, explore compatible surplus matches, and configure
            your profile. Operational actions will unlock once verified by an administrator.
          </p>
        </div>
      </div>
    </div>
  );
}
