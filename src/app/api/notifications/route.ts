import { connectDB } from "@/lib/db";
import { Notification } from "@/models/Notification";
import { requireActor, errorResponse } from "@/lib/session";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const actor = await requireActor();
    await connectDB();

    const q =
      actor.role === "ADMIN"
        ? { forAdmin: true }
        : { recipientOrg: actor.orgId };

    const notifications = await Notification.find(q)
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();

    const unreadCount = await Notification.countDocuments({ ...q, read: false });

    return Response.json({ notifications, unreadCount });
  } catch (e) {
    return errorResponse(e);
  }
}

export async function PATCH(req: Request) {
  try {
    const actor = await requireActor();
    const body = await req.json();
    await connectDB();

    if (body.all) {
      const q =
        actor.role === "ADMIN"
          ? { forAdmin: true }
          : { recipientOrg: actor.orgId };
      await Notification.updateMany(q, { $set: { read: true } });
      return Response.json({ ok: true });
    }

    if (body.id) {
      await Notification.updateOne({ _id: body.id }, { $set: { read: true } });
      return Response.json({ ok: true });
    }

    return Response.json({ error: "Missing id or all flag" }, { status: 400 });
  } catch (e) {
    return errorResponse(e);
  }
}
