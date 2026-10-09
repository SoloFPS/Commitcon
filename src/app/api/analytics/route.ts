import { connectDB } from "@/lib/db";
import { getSystemAnalytics, getProviderAnalytics, getShelterAnalytics } from "@/lib/analytics";
import { requireActor, errorResponse } from "@/lib/session";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const actor = await requireActor();
    await connectDB();

    if (actor.role === "ADMIN") {
      const stats = await getSystemAnalytics();
      return Response.json({ role: "ADMIN", stats });
    }

    if (actor.role === "PROVIDER") {
      const stats = await getProviderAnalytics(actor.orgId);
      return Response.json({ role: "PROVIDER", stats });
    }

    if (actor.role === "SHELTER") {
      const stats = await getShelterAnalytics(actor.orgId);
      return Response.json({ role: "SHELTER", stats });
    }

    return Response.json({ error: "Unsupported role for analytics" }, { status: 400 });
  } catch (e) {
    return errorResponse(e);
  }
}
