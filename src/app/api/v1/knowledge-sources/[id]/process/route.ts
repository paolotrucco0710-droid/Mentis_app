import { NextResponse } from "next/server";
import { handleApiRouteError } from "@/lib/api/handle-route-error";
import type { KnowledgeSourceId } from "@/domain/ids";
import { processKnowledgeSource } from "@/ai";
import { resolveDevUserId } from "@/upload";

export const runtime = "nodejs";
export const maxDuration = 300;

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function POST(request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const userId = await resolveDevUserId(request);
    const result = await processKnowledgeSource(
      id as KnowledgeSourceId,
      userId
    );

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    return handleApiRouteError(error, { route: "/api/v1/knowledge-sources/[id]/process", request });
  }
}
