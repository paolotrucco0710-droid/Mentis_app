import { NextResponse } from "next/server";
import { getLatestProcessingJob } from "@/ai";
import { handleApiRouteError } from "@/lib/api/handle-route-error";
import type { KnowledgeSourceId } from "@/domain/ids";
import { resolveDevUserId } from "@/upload";

export const runtime = "nodejs";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const userId = await resolveDevUserId(request);
    const job = await getLatestProcessingJob(id as KnowledgeSourceId, userId);

    if (!job) {
      return NextResponse.json(
        { error: "Job non trovato.", code: "NOT_FOUND" },
        { status: 404 }
      );
    }

    return NextResponse.json({ job }, { status: 200 });
  } catch (error) {
    return handleApiRouteError(error, {
      route: "/api/v1/knowledge-sources/[id]/latest-job",
      request,
    });
  }
}
