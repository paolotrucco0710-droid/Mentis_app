import { NextResponse } from "next/server";
import type { AIJobId } from "@/domain/ids";
import { AIProcessingError, getProcessingJob } from "@/ai";
import { resolveDevUserId } from "@/upload";

export const runtime = "nodejs";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const userId = await resolveDevUserId(request);
    const job = await getProcessingJob(id as AIJobId, userId);

    if (!job) {
      return NextResponse.json(
        { error: "Job non trovato.", code: "NOT_FOUND" },
        { status: 404 }
      );
    }

    return NextResponse.json({ job });
  } catch (error) {
    if (error instanceof AIProcessingError) {
      return NextResponse.json(
        { error: error.message, code: error.code },
        { status: error.statusCode }
      );
    }

    return NextResponse.json(
      { error: "Errore interno.", code: "INTERNAL_ERROR" },
      { status: 500 }
    );
  }
}
