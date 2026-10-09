import { getServerSession } from "next-auth";
import { authOptions } from "./auth";
import { ServiceError } from "./donationService";
import { Organization } from "@/models/Organization";
import { connectDB } from "./db";

export type UserRole = "PROVIDER" | "SHELTER" | "ADMIN" | "DELIVERY";

export interface ActorContext {
  userId: string;
  orgId: string;
  role: UserRole;
  verificationStatus: string;
}

export async function requireActor(
  allowedRoles?: UserRole | UserRole[],
  options?: { requireVerified?: boolean }
): Promise<ActorContext> {
  const session = await getServerSession(authOptions);
  const u = session?.user as any;
  if (!u?.id) throw new ServiceError(401, "Not authenticated");

  if (allowedRoles) {
    const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];
    if (!roles.includes(u.role)) {
      throw new ServiceError(403, `Forbidden: requires role ${roles.join(" or ")}`);
    }
  }

  let verificationStatus = "VERIFIED";
  if (u.role !== "ADMIN" && u.orgId) {
    await connectDB();
    const org = await Organization.findById(u.orgId).select("verificationStatus");
    verificationStatus = org?.verificationStatus ?? "PENDING";
  }

  if (options?.requireVerified && verificationStatus !== "VERIFIED") {
    throw new ServiceError(
      403,
      `Your organization is currently ${verificationStatus.toLowerCase()}. Verification by an administrator is required before performing this action.`
    );
  }

  return {
    userId: u.id as string,
    orgId: (u.orgId as string) || "",
    role: u.role as UserRole,
    verificationStatus,
  };
}

export function errorResponse(e: unknown) {
  if (e instanceof ServiceError) {
    return Response.json({ error: e.message }, { status: e.status });
  }
  if ((e as any)?.name === "ZodError") {
    return Response.json({ error: "Validation failed", issues: (e as any).issues }, { status: 400 });
  }
  console.error("API error:", e);
  const msg = (e as any)?.message || "Something went wrong";
  return Response.json({ error: msg }, { status: 500 });
}
