import { offerSchema, requestFoodSchema } from "@/lib/validation";
import { createOffer, requestDonation } from "@/lib/donationService";
import { connectDB } from "@/lib/db";
import { Organization } from "@/models/Organization";
import { DonationOffer } from "@/models/DonationOffer";
import { requireActor, errorResponse } from "@/lib/session";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const actor = await requireActor(["PROVIDER", "SHELTER", "ADMIN"], { requireVerified: true });
    const body = await req.json();
    await connectDB();

    if (actor.role === "PROVIDER" || actor.role === "ADMIN") {
      const input = offerSchema.parse(body);
      if (!(await Organization.exists({ _id: input.recipientId, kind: "SHELTER" }))) {
        return Response.json({ error: "Recipient shelter not found" }, { status: 404 });
      }
      const offer = await createOffer(actor, input);
      return Response.json(offer, { status: 201 });
    } else {
      // Shelter requesting food directly
      const input = requestFoodSchema.parse(body);
      const offer = await requestDonation(actor, input);
      return Response.json(offer, { status: 201 });
    }
  } catch (e) {
    return errorResponse(e);
  }
}

export async function GET(req: Request) {
  try {
    const actor = await requireActor();
    await connectDB();

    const sp = new URL(req.url).searchParams;
    const status = sp.get("status");

    const q: Record<string, unknown> =
      actor.role === "ADMIN"
        ? {}
        : { $or: [{ donor: actor.orgId }, { recipient: actor.orgId }] };

    if (status && status !== "ALL") {
      q.status = status;
    }

    const offers = await DonationOffer.find(q)
      .populate("donation", "title category unit pickupDeadline pickupAddress dietary remainingQuantity")
      .populate("donor", "name city address phone contactName")
      .populate("recipient", "name city address phone contactName peopleServed")
      .sort({ createdAt: -1 })
      .lean();

    return Response.json(offers);
  } catch (e) {
    return errorResponse(e);
  }
}
