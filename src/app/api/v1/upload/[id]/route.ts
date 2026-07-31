import { NextResponse } from "next/server";
import { handleApiRouteError } from "@/lib/api/handle-route-error";
import type { UploadId } from "@/domain/ids";
import {
  getUploadResult,
  resolveDevUserId,
} from "@/upload";

export const runtime = "nodejs";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const userId = await resolveDevUserId(request);
    const result = await getUploadResult(id as UploadId, userId);

    if (!result) {
      return NextResponse.json(
        { error: "Upload non trovato.", code: "NOT_FOUND" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      upload: result.upload,
      knowledgeSource: result.knowledgeSource,
    });
  } catch (error) {
    return handleApiRouteError(error, { route: "/api/v1/upload/[id]", request });
  }
}
