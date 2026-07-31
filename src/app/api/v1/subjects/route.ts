import { NextResponse } from "next/server";
import { handleApiRouteError } from "@/lib/api/handle-route-error";
import { resolveDevUserId } from "@/engine/dev";
import {
  createSubjectForUser,
  listSubjectSummaries
} from "@/course";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    const userId = await resolveDevUserId(request);
    const subjects = await listSubjectSummaries(userId);
    return NextResponse.json({ subjects }, { status: 200 });
  } catch (error) {
    return handleApiRouteError(error, { route: "/api/v1/subjects", request });
  }
}

export async function POST(request: Request) {
  try {
    const userId = await resolveDevUserId(request);
    const body = (await request.json()) as {
      name?: string;
      color?: string;
      icon?: string;
    };

    if (!body.name?.trim()) {
      return NextResponse.json(
        { error: "Il nome della materia è obbligatorio.", code: "NAME_REQUIRED" },
        { status: 400 }
      );
    }

    const subject = await createSubjectForUser(userId, {
      name: body.name,
      color: body.color ?? "#4F46E5",
      icon: body.icon ?? "book",
    });

    return NextResponse.json({ subject }, { status: 201 });
  } catch (error) {
    return handleApiRouteError(error, { route: "/api/v1/subjects", request });
  }
}

