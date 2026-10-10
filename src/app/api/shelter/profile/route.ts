import { connectDB } from "@/lib/db";
import { Organization } from "@/models/Organization";
import { shelterProfileSchema } from "@/lib/validation";
import { requireActor, errorResponse } from "@/lib/session";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const actor = await requireActor(["SHELTER", "PROVIDER"]);
    await connectDB();

    const org = await Organization.findById(actor.orgId).lean();
    if (!org) return Response.json({ error: "Organization not found" }, { status: 404 });

    return Response.json(org);
  } catch (e) {
    return errorResponse(e);
  }
}

export async function PATCH(req: Request) {
  try {
    const actor = await requireActor(["SHELTER", "PROVIDER"]);
    const body = await req.json();
    const validated = shelterProfileSchema.parse(body);

    await connectDB();
    const org = await Organization.findByIdAndUpdate(
      actor.orgId,
      { $set: validated },
      { new: true }
    );

    return Response.json(org);
  } catch (e) {
    return errorResponse(e);
  }
}
