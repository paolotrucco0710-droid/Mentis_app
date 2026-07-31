import { NextResponse } from "next/server";
import { resolveDevUserId } from "@/engine/dev";
import { FeedEngineError } from "@/engine/errors";
import {
  CourseManagementError,
  createSubjectForUser,
  listSubjectSummaries,
} from "@/course";

export const runtime = "nodejs";

export async function GET() {
  try {
    const userId = resolveDevUserId();
    const subjects = await listSubjectSummaries(userId);
    return NextResponse.json({ subjects }, { status: 200 });
  } catch (error) {
    return handleError(error);
  }
}

export async function POST(request: Request) {
  try {
    const userId = resolveDevUserId();
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
    return handleError(error);
  }
}

function handleError(error: unknown) {
  if (error instanceof CourseManagementError || error instanceof FeedEngineError) {
    return NextResponse.json(
      { error: error.message, code: error.code },
      { status: error.statusCode }
    );
  }

  console.error("Subjects API failed:", error);
  return NextResponse.json(
    { error: "Errore interno.", code: "INTERNAL_ERROR" },
    { status: 500 }
  );
}
