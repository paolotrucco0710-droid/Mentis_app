import { NextResponse } from "next/server";
import { handleApiRouteError } from "@/lib/api/handle-route-error";
import { resolveDevUserId } from "@/engine/dev";
import { getHomeContinueContext } from "@/home";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    const userId = await resolveDevUserId(request);
    const context = await getHomeContinueContext(userId);
    return NextResponse.json({ context }, { status: 200 });
  } catch (error) {
    return handleApiRouteError(error, {
      route: "/api/v1/home/continue",
      request,
    });
  }
}
