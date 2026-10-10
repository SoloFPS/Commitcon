import { connectDB } from "@/lib/db";
import { Organization } from "@/models/Organization";
import { Notification } from "@/models/Notification";
import { AuditEvent } from "@/models/AuditEvent";
import { requireActor, errorResponse } from "@/lib/session";
import { verifyOrgSchema } from "@/lib/validation";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const actor = await requireActor(["PROVIDER", "SHELTER", "ADMIN", "DELIVERY"]);
    await connectDB();

    const sp = new URL(req.url).searchParams;
    const targetOrgId = actor.role === "ADMIN" && sp.get("orgId") ? sp.get("orgId") : actor.orgId;

    if (!targetOrgId) {
      return Response.json({ error: "No organization associated with this account" }, { status: 400 });
    }

    const org = (await Organization.findById(targetOrgId).lean()) as any;
    if (!org) {
      return Response.json({ error: "Organization not found" }, { status: 404 });
    }

    return Response.json({
      orgId: String(org._id),
      name: org.name,
      kind: org.kind,
      category: org.category,
      city: org.city,
      address: org.address,
      verificationStatus: org.verificationStatus,
      verifiedAt: org.verifiedAt,
      verifiedBy: org.verifiedBy,
      verificationNotes: org.verificationNotes,
    });
  } catch (e) {
    return errorResponse(e);
  }
}

export async function POST(req: Request) {
  try {
    const actor = await requireActor(["PROVIDER", "SHELTER", "ADMIN"]);
    const body = await req.json().catch(() => ({}));
    const validated = verifyOrgSchema.parse(body);

    const targetOrgId = actor.role === "ADMIN" && (body as any)?.orgId ? (body as any).orgId : actor.orgId;

    if (!targetOrgId) {
      return Response.json({ error: "No organization associated with this account" }, { status: 400 });
    }

    await connectDB();

    const currentOrg = await Organization.findById(targetOrgId);
    if (!currentOrg) {
      return Response.json({ error: "Organization not found" }, { status: 404 });
    }

    const verificationNote =
      validated.notes ||
      (validated.registrationNumber
        ? `Verified with ${validated.documentType || "Registration ID"}: ${validated.registrationNumber}`
        : "Verified via FoodBridge Express Accreditation");

    const updatedOrg = await Organization.findByIdAndUpdate(
      targetOrgId,
      {
        $set: {
          verificationStatus: "VERIFIED",
          verifiedAt: new Date(),
          verifiedBy: actor.userId,
          verificationNotes: verificationNote,
        },
      },
      { new: true }
    );

    // Send in-app notification to the organization
    await Notification.create({
      recipientOrg: updatedOrg._id,
      type: "ORGANIZATION_VERIFIED",
      title: "Organization Verified! 🎉",
      message:
        "Your organization has been successfully verified! You now have unrestricted access to create donation listings, claim surplus food, and utilize automated matching.",
      link: updatedOrg.kind === "SHELTER" ? "/shelter/dashboard" : "/restaurant/dashboard",
    });

    // Write audit event
    await AuditEvent.create({
      actorId: actor.userId,
      actorRole: actor.role,
      action: "ORG_VERIFIED",
      resourceType: "Organization",
      resourceId: String(updatedOrg._id),
      details: {
        registrationNumber: validated.registrationNumber,
        documentType: validated.documentType,
        notes: verificationNote,
        method: validated.instantVerify ? "INSTANT_SELF_VERIFY" : "CREDENTIAL_SUBMISSION",
      },
    });

    return Response.json({
      ok: true,
      message: "Organization verified successfully! Operational privileges are now unlocked.",
      organization: updatedOrg,
    });
  } catch (e) {
    return errorResponse(e);
  }
}
