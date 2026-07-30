import { NextResponse } from "next/server";
import type { UploadId } from "@/domain/ids";
import {
  UploadPipelineError,
  getUploadResult,
  resolveDevUserId,
} from "@/upload";

export const runtime = "nodejs";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(_request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const userId = resolveDevUserId();
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
    if (error instanceof UploadPipelineError) {
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
