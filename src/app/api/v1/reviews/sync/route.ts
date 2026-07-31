import { NextResponse } from "next/server";
import { handleApiRouteError } from "@/lib/api/handle-route-error";
import { resolveDevUserId } from "@/engine/dev";
import { syncReviewsForUser } from "@/review";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const userId = await resolveDevUserId(request);
    const synced = await syncReviewsForUser(userId);

    return NextResponse.json({ synced }, { status: 200 });
  } catch (error) {
    return handleApiRouteError(error, { route: "/api/v1/reviews/sync", request });
  }
}
