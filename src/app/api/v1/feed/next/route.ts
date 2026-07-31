import { NextResponse } from "next/server";
import { handleApiRouteError } from "@/lib/api/handle-route-error";
import type { StudySessionId } from "@/domain/ids";
import {
  getNextFeedItem,
  resolveDevUserId,
  resolveRequestedSubjectId,
} from "@/engine";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    const userId = await resolveDevUserId(request);
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get("sessionId");
    const subjectId = await resolveRequestedSubjectId(
      userId,
      searchParams.get("subjectId")
    );

    if (!sessionId) {
      return NextResponse.json(
        {
          error: "sessionId è obbligatorio.",
          code: "SESSION_ID_REQUIRED",
        },
        { status: 400 }
      );
    }

    const feed = await getNextFeedItem({
      userId,
      subjectId,
      sessionId: sessionId as StudySessionId,
    });

    return NextResponse.json(feed, { status: 200 });
  } catch (error) {
    return handleApiRouteError(error, { route: "/api/v1/feed/next", request });
  }
}
