import { connectDB } from "@/lib/db";
import { donationUpdateSchema } from "@/lib/validation";
import { FoodDonation } from "@/models/FoodDonation";
import { requireActor, errorResponse } from "@/lib/session";
import { AuditEvent } from "@/models/AuditEvent";

export const dynamic = "force-dynamic";

export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    await connectDB();
    const item = await FoodDonation.findById(params.id)
      .populate("donor", "name city address contactName phone verificationStatus")
      .lean();

    if (!item) return Response.json({ error: "Donation not found" }, { status: 404 });
    return Response.json(item);
  } catch (e) {
    return errorResponse(e);
  }
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const actor = await requireActor(["PROVIDER", "ADMIN"], { requireVerified: true });
    const body = await req.json();
    const validated = donationUpdateSchema.parse(body);

    await connectDB();
    const donation = await FoodDonation.findById(params.id);
    if (!donation) return Response.json({ error: "Donation not found" }, { status: 404 });

    if (actor.role !== "ADMIN" && String(donation.donor) !== actor.orgId) {
      return Response.json({ error: "You can only edit your own donations" }, { status: 403 });
    }

    if (donation.status === "DELIVERED" || donation.status === "PICKED_UP") {
      return Response.json(
        { error: `Cannot edit a donation that has already been ${donation.status.toLowerCase()}` },
        { status: 400 }
      );
    }

    Object.assign(donation, validated);
    await donation.save();

    await AuditEvent.create({
      actorId: actor.userId,
      actorOrgId: actor.orgId,
      actorRole: actor.role,
      action: "UPDATE_DONATION",
      resourceType: "FoodDonation",
      resourceId: params.id,
      details: validated,
    });

    return Response.json(donation);
  } catch (e) {
    return errorResponse(e);
  }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    const actor = await requireActor(["PROVIDER", "ADMIN"]);
    await connectDB();

    const donation = await FoodDonation.findById(params.id);
    if (!donation) return Response.json({ error: "Donation not found" }, { status: 404 });

    if (actor.role !== "ADMIN" && String(donation.donor) !== actor.orgId) {
      return Response.json({ error: "You can only withdraw your own donations" }, { status: 403 });
    }

    if (donation.reservedQuantity > 0) {
      return Response.json(
        { error: "Cannot withdraw a donation that currently has active reserved offers" },
        { status: 409 }
      );
    }

    donation.status = "WITHDRAWN";
    await donation.save();

    await AuditEvent.create({
      actorId: actor.userId,
      actorOrgId: actor.orgId,
      actorRole: actor.role,
      action: "WITHDRAW_DONATION",
      resourceType: "FoodDonation",
      resourceId: params.id,
    });

    return Response.json({ ok: true, status: "WITHDRAWN" });
  } catch (e) {
    return errorResponse(e);
  }
}
