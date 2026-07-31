import { NextResponse } from "next/server";
import type { ImageId } from "@/domain/ids";
import { resolveDevUserId } from "@/engine/dev";
import { getImageSignedUrlForUser } from "@/storage/access-service";
import { handleStorageRouteError } from "@/app/api/v1/storage/_helpers";

export const runtime = "nodejs";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(request: Request, context: RouteContext) {
  try {
    const userId = await resolveDevUserId(request);
    const { id } = await context.params;
    const result = await getImageSignedUrlForUser(userId, id as ImageId);
    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    return handleStorageRouteError(error);
  }
}
