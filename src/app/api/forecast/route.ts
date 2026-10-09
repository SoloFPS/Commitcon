import { connectDB } from "@/lib/db";
import { generateSurplusForecast } from "@/lib/forecasting";
import { requireActor, errorResponse } from "@/lib/session";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const actor = await requireActor(["PROVIDER", "ADMIN"]);
    await connectDB();

    const donorOrgId = actor.role === "PROVIDER" ? actor.orgId : undefined;
    const report = await generateSurplusForecast(donorOrgId);

    return Response.json(report);
  } catch (e) {
    return errorResponse(e);
  }
}
