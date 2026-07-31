import { NextResponse } from "next/server";
import { handleApiRouteError } from "@/lib/api/handle-route-error";
import { resolveDevUserId, resolveRequestedSubjectId } from "@/engine/dev";
import { generateDailyReview } from "@/review";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    const userId = await resolveDevUserId(request);
    const { searchParams } = new URL(request.url);
    const subjectIdParam = searchParams.get("subjectId");
    const subjectId = subjectIdParam
      ? await resolveRequestedSubjectId(userId, subjectIdParam)
      : null;

    const plan = await generateDailyReview({ userId, subjectId });

    return NextResponse.json(plan, { status: 200 });
  } catch (error) {
    return handleApiRouteError(error, { route: "/api/v1/reviews/daily", request });
  }
}
