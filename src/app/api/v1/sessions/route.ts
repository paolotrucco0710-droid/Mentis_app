import { NextResponse } from "next/server";
import { handleApiRouteError } from "@/lib/api/handle-route-error";
import { resolveDevSubjectId, resolveDevUserId } from "@/engine/dev";
import { openSession } from "@/session";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const userId = await resolveDevUserId(request);
    const body = (await request.json().catch(() => ({}))) as {
      subjectId?: string;
      device?: string;
      appVersion?: string;
      initialMotivation?: number;
    };
    const subjectId = resolveDevSubjectId(body.subjectId ?? null);
    const session = await openSession(userId, {
      subjectId,
      device: body.device ?? null,
      appVersion: body.appVersion ?? null,
      initialMotivation: body.initialMotivation ?? null,
    });

    return NextResponse.json({ session }, { status: 201 });
  } catch (error) {
    return handleApiRouteError(error, { route: "/api/v1/sessions", request });
  }
}
