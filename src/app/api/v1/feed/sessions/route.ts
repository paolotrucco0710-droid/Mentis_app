import { NextResponse } from "next/server";
import { handleApiRouteError } from "@/lib/api/handle-route-error";
import {
  createFeedSession,
  resolveDevUserId,
  resolveRequestedSubjectId,
} from "@/engine";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const userId = await resolveDevUserId(request);
    const body = (await request.json().catch(() => ({}))) as {
      subjectId?: string;
    };
    const subjectId = await resolveRequestedSubjectId(
      userId,
      body.subjectId ?? null
    );
    const session = await createFeedSession({ userId, subjectId });

    return NextResponse.json({ session }, { status: 201 });
  } catch (error) {
    return handleApiRouteError(error, { route: "/api/v1/feed/sessions", request });
  }
}
