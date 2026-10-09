import { connectDB } from "@/lib/db";
import { FoodDonation } from "@/models/FoodDonation";
import { Organization } from "@/models/Organization";
import { requireActor, errorResponse } from "@/lib/session";
import { scoreMatch, ShelterCandidate, FoodCandidate } from "@/lib/matching";

export const dynamic = "force-dynamic";

export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const actor = await requireActor(["PROVIDER", "ADMIN"]);
    await connectDB();

    const donation = await FoodDonation.findById(params.id).lean<any>();
    if (!donation) return Response.json({ error: "Donation not found" }, { status: 404 });

    if (actor.role !== "ADMIN" && String(donation.donor) !== actor.orgId) {
      return Response.json({ error: "Not your donation" }, { status: 403 });
    }

    // Candidate shelters
    const shelters = await Organization.find({
      kind: "SHELTER",
    }).lean<any[]>();

    const foodCandidate: FoodCandidate = {
      id: String(donation._id),
      title: donation.title,
      category: donation.category,
      unit: donation.unit,
      remainingQuantity: donation.remainingQuantity,
      totalQuantity: donation.totalQuantity,
      dietary: donation.dietary,
      allergens: donation.allergens || [],
      storageRequirements: donation.storageRequirements,
      pickupDeadline: new Date(donation.pickupDeadline),
      location: donation.location,
      donorId: String(donation.donor),
    };

    const matches = shelters.map((s) => {
      const shelterCandidate: ShelterCandidate = {
        id: String(s._id),
        name: s.name,
        location: s.location,
        verificationStatus: s.verificationStatus,
        peopleServed: s.peopleServed,
        capacityKg: s.capacityKg,
        foodCategories: s.foodCategories || [],
        dietaryRestrictions: s.dietaryRestrictions || [],
        storageTypes: s.storageTypes,
      };

      const result = scoreMatch(foodCandidate, shelterCandidate);
      return {
        shelter: {
          id: String(s._id),
          name: s.name,
          address: s.address,
          city: s.city,
          contactName: s.contactName,
          phone: s.phone,
          peopleServed: s.peopleServed,
          verificationStatus: s.verificationStatus,
        },
        ...result,
      };
    });

    // Sort by score descending (eligible matches first)
    matches.sort((a, b) => b.score - a.score);

    return Response.json({
      donation: {
        id: String(donation._id),
        title: donation.title,
        remainingQuantity: donation.remainingQuantity,
        unit: donation.unit,
        pickupDeadline: donation.pickupDeadline,
      },
      matches,
    });
  } catch (e) {
    return errorResponse(e);
  }
}
