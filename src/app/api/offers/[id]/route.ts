import { offerActionSchema } from "@/lib/validation";
import { transitionOffer } from "@/lib/donationService";
import { connectDB } from "@/lib/db";
import { DonationOffer } from "@/models/DonationOffer";
import { requireActor, errorResponse } from "@/lib/session";

export const dynamic = "force-dynamic";

export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const actor = await requireActor();
    await connectDB();

    const offer = await DonationOffer.findById(params.id)
      .populate("donation")
      .populate("donor", "name city address phone contactName location")
      .populate("recipient", "name city address phone contactName location peopleServed")
      .lean<any>();

    if (!offer) return Response.json({ error: "Offer not found" }, { status: 404 });

    const isDonor = String(offer.donor?._id || offer.donor) === actor.orgId;
    const isRecipient = String(offer.recipient?._id || offer.recipient) === actor.orgId;
    const isAdmin = actor.role === "ADMIN";

    if (!isDonor && !isRecipient && !isAdmin && actor.role !== "DELIVERY") {
      return Response.json({ error: "Offer not found" }, { status: 404 });
    }

    return Response.json(offer);
  } catch (e) {
    return errorResponse(e);
  }
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const actor = await requireActor();
    const body = await req.json();
    const { action, reason, scheduledPickupTime, proofOfDeliveryCode, deliveryNotes } =
      offerActionSchema.parse(body);

    await connectDB();
    const updated = await transitionOffer(actor, params.id, action, {
      reason,
      scheduledPickupTime,
      proofOfDeliveryCode,
      deliveryNotes,
    });

    return Response.json(updated);
  } catch (e) {
    return errorResponse(e);
  }
}
