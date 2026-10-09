import { connectDB } from "@/lib/db";
import { donationSchema } from "@/lib/validation";
import { FoodDonation } from "@/models/FoodDonation";
import { Organization } from "@/models/Organization";
import { requireActor, errorResponse } from "@/lib/session";
import { AuditEvent } from "@/models/AuditEvent";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const actor = await requireActor("PROVIDER", { requireVerified: true });
    const body = await req.json();
    const d = donationSchema.parse(body);

    await connectDB();
    const org = await Organization.findById(actor.orgId);
    if (!org) return Response.json({ error: "Donor organization not found" }, { status: 404 });

    const doc = await FoodDonation.create({
      ...d,
      donor: actor.orgId,
      remainingQuantity: d.totalQuantity,
      location: org.location,
      pickupAddress: d.pickupAddress || `${org.address}, ${org.city}`,
    });

    await AuditEvent.create({
      actorId: actor.userId,
      actorOrgId: actor.orgId,
      actorRole: actor.role,
      action: "CREATE_DONATION",
      resourceType: "FoodDonation",
      resourceId: String(doc._id),
      details: { title: d.title, quantity: d.totalQuantity, category: d.category },
    });

    return Response.json(doc, { status: 201 });
  } catch (e) {
    return errorResponse(e);
  }
}

// Marketplace & donor list: supports query filters and pagination
export async function GET(req: Request) {
  try {
    const sp = new URL(req.url).searchParams;
    const page = Math.max(1, Number(sp.get("page") ?? 1));
    const limit = Math.min(50, Math.max(1, Number(sp.get("limit") ?? 20)));
    const donorOnly = sp.get("mine") === "true";
    const category = sp.get("category");
    const dietary = sp.get("dietary");
    const search = sp.get("q");

    await connectDB();

    const q: Record<string, unknown> = {};

    if (donorOnly) {
      const actor = await requireActor("PROVIDER");
      q.donor = actor.orgId;
    } else {
      q.status = { $in: ["AVAILABLE", "PARTIALLY_ALLOCATED"] };
      q.pickupDeadline = { $gt: new Date() };
      q.remainingQuantity = { $gt: 0 };
    }

    if (category && category !== "ALL") q.category = category;
    if (dietary && dietary !== "ALL") q.dietary = dietary;
    if (search) {
      q.$or = [
        { title: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
      ];
    }

    const [items, total] = await Promise.all([
      FoodDonation.find(q)
        .populate("donor", "name city contactName phone verificationStatus")
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      FoodDonation.countDocuments(q),
    ]);

    return Response.json({
      items,
      page,
      totalPages: Math.ceil(total / limit) || 1,
      total,
    });
  } catch (e) {
    return errorResponse(e);
  }
}
