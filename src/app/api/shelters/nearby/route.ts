import { connectDB } from "@/lib/db";
import { Organization } from "@/models/Organization";
import { requireActor, errorResponse } from "@/lib/session";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const actor = await requireActor("PROVIDER");
    const km = Math.min(50, Number(new URL(req.url).searchParams.get("km") ?? 10));
    await connectDB();
    const me = await Organization.findById(actor.orgId).lean<any>();
    const shelters = await Organization.aggregate([
      { $geoNear: { near: me.location, distanceField: "straightLineMeters", maxDistance: km * 1000, spherical: true, query: { kind: "SHELTER" } } },
      { $project: { name: 1, address: 1, city: 1, peopleServed: 1, verificationStatus: 1, dietaryRestrictions: 1, foodCategories: 1, location: 1, straightLineMeters: 1 } },
      { $limit: 50 },
    ]);
    // straight-line distance, NOT driving distance: label it so in the UI
    return Response.json({ origin: me.location, shelters });
  } catch (e) { return errorResponse(e); }
}
