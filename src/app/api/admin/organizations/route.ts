import { connectDB } from "@/lib/db";
import { Organization } from "@/models/Organization";
import { Notification } from "@/models/Notification";
import { AuditEvent } from "@/models/AuditEvent";
import { requireActor, errorResponse } from "@/lib/session";
import { adminVerifyOrgSchema } from "@/lib/validation";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    await requireActor("ADMIN");
    await connectDB();

    const sp = new URL(req.url).searchParams;
    const status = sp.get("status");

    const q: Record<string, unknown> = {};
    if (status && status !== "ALL") {
      q.verificationStatus = status;
    }

    const orgs = await Organization.find(q)
      .sort({ createdAt: -1 })
      .lean();

    return Response.json(orgs);
  } catch (e) {
    return errorResponse(e);
  }
}

export async function PATCH(req: Request) {
  try {
    const actor = await requireActor("ADMIN");
    const body = await req.json();
    const { orgId, ...rest } = body;

    if (!orgId) return Response.json({ error: "Missing orgId" }, { status: 400 });

    const validated = adminVerifyOrgSchema.parse(rest);
    await connectDB();

    const org = await Organization.findByIdAndUpdate(
      orgId,
      {
        $set: {
          verificationStatus: validated.status,
          verifiedAt: new Date(),
          verifiedBy: actor.userId,
          verificationNotes: validated.notes,
        },
      },
      { new: true }
    );

    if (!org) return Response.json({ error: "Organization not found" }, { status: 404 });

    // Send persistent notification to the organization
    await Notification.create({
      recipientOrg: org._id,
      type: validated.status === "VERIFIED" ? "ORGANIZATION_VERIFIED" : "ORGANIZATION_REJECTED",
      title:
        validated.status === "VERIFIED"
          ? "Organization Verified! 🎉"
          : "Verification Request Update",
      message:
        validated.status === "VERIFIED"
          ? "Your organization has been approved by administrators. You can now publish donations and accept food allocations."
          : `Your verification request was rejected. Note: ${validated.notes || "Please review your registration details or contact support."}`,
      link: org.kind === "SHELTER" ? "/shelter/dashboard" : "/restaurant/dashboard",
    });

    // Audit log
    await AuditEvent.create({
      actorId: actor.userId,
      actorRole: "ADMIN",
      action: `ORG_${validated.status}`,
      resourceType: "Organization",
      resourceId: String(org._id),
      details: { status: validated.status, notes: validated.notes },
    });

    return Response.json(org);
  } catch (e) {
    return errorResponse(e);
  }
}
