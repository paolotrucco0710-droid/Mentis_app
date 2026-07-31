import { NextResponse } from "next/server";
import { resolveDevUserId } from "@/engine/dev";
import { getDailyStatisticsHistory } from "@/profile";
import { handleProfileRouteError } from "../../_helpers";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    const userId = await resolveDevUserId(request);
    const { searchParams } = new URL(request.url);
    const days = Number(searchParams.get("days") ?? "7");
    const history = await getDailyStatisticsHistory(userId, days);
    return NextResponse.json({ history }, { status: 200 });
  } catch (error) {
    return handleProfileRouteError(error, {
      route: "/api/v1/profile/statistics/daily",
      request,
    });
  }
}
