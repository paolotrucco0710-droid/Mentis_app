import { NextResponse } from "next/server";
import { handleApiRouteError } from "@/lib/api/handle-route-error";
import type { AIJobId } from "@/domain/ids";
import { getProcessingJob } from "@/ai";
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
    return handleApiRouteError(error, { route: "/api/v1/ai-jobs/[id]", request });
  }
}
