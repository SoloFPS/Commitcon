import bcrypt from "bcryptjs";
import { connectDB } from "@/lib/db";
import { registerSchema } from "@/lib/validation";
import { Organization } from "@/models/Organization";
import { User } from "@/models/User";
import { Notification } from "@/models/Notification";
import { AuditEvent } from "@/models/AuditEvent";
import { errorResponse } from "@/lib/session";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const d = registerSchema.parse(await req.json());
    await connectDB();

    if (await User.exists({ email: d.email.toLowerCase() })) {
      return Response.json({ error: "Email already registered" }, { status: 409 });
    }

    const org = await Organization.create({
      name: d.orgName,
      kind: d.role,
      category: d.category,
      contactName: d.contactName,
      phone: d.phone,
      address: d.address,
      city: d.city,
      postalCode: d.postalCode,
      location: { type: "Point", coordinates: [d.lng, d.lat] },
      verificationStatus: "PENDING", // only an admin workflow may change this
      foodCategories: d.foodCategories,
      ...(d.role === "SHELTER"
        ? { peopleServed: d.peopleServed, dietaryRestrictions: d.dietaryRestrictions }
        : {}),
    });

    const user = await User.create({
      email: d.email.toLowerCase(),
      name: d.contactName,
      passwordHash: await bcrypt.hash(d.password, 12),
      role: d.role,
      organization: org._id,
    });

    // Notify admins of new pending registration
    await Notification.create({
      forAdmin: true,
      type: "ORGANIZATION_REGISTERED",
      title: "New Organization Registration",
      message: `${d.orgName} (${d.role}) registered in ${d.city} and awaits verification.`,
      link: "/admin/organizations",
    });

    // Audit log
    await AuditEvent.create({
      actorId: user._id,
      actorRole: d.role,
      action: "REGISTER_ORGANIZATION",
      resourceType: "Organization",
      resourceId: String(org._id),
      details: { orgName: d.orgName, role: d.role, city: d.city },
    });

    return Response.json({ ok: true, orgId: String(org._id) }, { status: 201 });
  } catch (e) {
    return errorResponse(e);
  }
}
