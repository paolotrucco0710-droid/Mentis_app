import { NextResponse } from "next/server";
import { handleApiRouteError } from "@/lib/api/handle-route-error";
import type { SubjectId } from "@/domain/ids";
import { resolveDevSubjectId, resolveDevUserId } from "@/engine/dev";
import { getReviewQueue } from "@/review";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    const userId = await resolveDevUserId(request);
    const { searchParams } = new URL(request.url);
    const subjectIdParam = searchParams.get("subjectId");
    const subjectId = subjectIdParam
      ? (resolveDevSubjectId(subjectIdParam) as SubjectId)
      : null;

    const queue = await getReviewQueue({ userId, subjectId });

    return NextResponse.json(queue, { status: 200 });
  } catch (error) {
    return handleApiRouteError(error, { route: "/api/v1/reviews/queue", request });
  }
}
