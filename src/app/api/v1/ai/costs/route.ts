import { NextResponse } from "next/server";
import { handleApiRouteError } from "@/lib/api/handle-route-error";
import { getUserAICostSummary, listRecentAIJobCosts } from "@/ai";
import { resolveDevUserId } from "@/engine/dev";

export const runtime = "nodejs";


export async function GET(request: Request) {
  try {
    const userId = await resolveDevUserId(request);
    const { searchParams } = new URL(request.url);
    const view = searchParams.get("view");

    if (view === "jobs") {
      const jobs = await listRecentAIJobCosts(userId);
      return NextResponse.json({ jobs }, { status: 200 });
    }

    const summary = await getUserAICostSummary(userId);
    return NextResponse.json({ summary }, { status: 200 });
  } catch (error) {
    return handleApiRouteError(error, { route: "/api/v1/ai/costs", request });
  }
}
