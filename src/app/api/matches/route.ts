import { connectDB } from "@/lib/db";
import { FoodDonation } from "@/models/FoodDonation";
import { Organization } from "@/models/Organization";
import { requireActor, errorResponse } from "@/lib/session";
import { scoreMatch, ShelterCandidate, FoodCandidate } from "@/lib/matching";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const actor = await requireActor("SHELTER");
    await connectDB();

    const shelterOrg = await Organization.findById(actor.orgId).lean<any>();
    if (!shelterOrg) return Response.json({ error: "Shelter organization not found" }, { status: 404 });

    const shelterCandidate: ShelterCandidate = {
      id: String(shelterOrg._id),
      name: shelterOrg.name,
      location: shelterOrg.location,
      verificationStatus: shelterOrg.verificationStatus,
      peopleServed: shelterOrg.peopleServed,
      capacityKg: shelterOrg.capacityKg,
      foodCategories: shelterOrg.foodCategories || [],
      dietaryRestrictions: shelterOrg.dietaryRestrictions || [],
      storageTypes: shelterOrg.storageTypes,
      operatingHours: shelterOrg.operatingHours,
    };

    // Find all active donations
    const availableDonations = await FoodDonation.find({
      status: { $in: ["AVAILABLE", "PARTIALLY_ALLOCATED"] },
      pickupDeadline: { $gt: new Date() },
      remainingQuantity: { $gt: 0 },
    })
      .populate("donor", "name city address verificationStatus")
      .lean<any[]>();

    const matches = availableDonations.map((d) => {
      const foodCandidate: FoodCandidate = {
        id: String(d._id),
        title: d.title,
        category: d.category,
        unit: d.unit,
        remainingQuantity: d.remainingQuantity,
        totalQuantity: d.totalQuantity,
        dietary: d.dietary,
        allergens: d.allergens || [],
        storageRequirements: d.storageRequirements,
        pickupDeadline: new Date(d.pickupDeadline),
        location: d.location,
        donorId: String(d.donor?._id || d.donor),
        donorName: d.donor?.name,
      };

      const result = scoreMatch(foodCandidate, shelterCandidate);
      return {
        donation: {
          id: String(d._id),
          title: d.title,
          description: d.description,
          category: d.category,
          unit: d.unit,
          remainingQuantity: d.remainingQuantity,
          totalQuantity: d.totalQuantity,
          dietary: d.dietary,
          allergens: d.allergens,
          storageRequirements: d.storageRequirements,
          pickupDeadline: d.pickupDeadline,
          pickupAddress: d.pickupAddress,
          donor: d.donor,
        },
        ...result,
      };
    });

    // Sort by match score descending
    matches.sort((a, b) => b.score - a.score);

    return Response.json({
      shelter: {
        id: String(shelterOrg._id),
        name: shelterOrg.name,
        verificationStatus: shelterOrg.verificationStatus,
      },
      matches,
    });
  } catch (e) {
    return errorResponse(e);
  }
}
