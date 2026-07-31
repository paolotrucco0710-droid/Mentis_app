import { NextResponse } from "next/server";
import { handleApiRouteError } from "@/lib/api/handle-route-error";
import type { SubjectId } from "@/domain/ids";
import { resolveDevUserId } from "@/engine/dev";
import {
  deleteSubjectForUser,
  getSubjectDetail,
  updateSubjectForUser
} from "@/course";

export const runtime = "nodejs";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(request: Request, context: RouteContext) {
  try {
    const userId = await resolveDevUserId(request);
    const { id } = await context.params;
    const detail = await getSubjectDetail(userId, id as SubjectId);
    return NextResponse.json(detail, { status: 200 });
  } catch (error) {
    return handleApiRouteError(error, { route: "/api/v1/subjects/[id]", request });
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const userId = await resolveDevUserId(request);
    const { id } = await context.params;
    const body = (await request.json()) as {
      name?: string;
      color?: string;
      icon?: string;
    };

    const subject = await updateSubjectForUser(userId, id as SubjectId, body);
    return NextResponse.json({ subject }, { status: 200 });
  } catch (error) {
    return handleApiRouteError(error, { route: "/api/v1/subjects/[id]", request });
  }
}

export async function DELETE(request: Request, context: RouteContext) {
  try {
    const userId = await resolveDevUserId(request);
    const { id } = await context.params;
    await deleteSubjectForUser(userId, id as SubjectId);
    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (error) {
    return handleApiRouteError(error, { route: "/api/v1/subjects/[id]", request });
  }
}

