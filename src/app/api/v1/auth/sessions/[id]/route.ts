import { NextResponse } from "next/server";
import {
  getAccessTokenFromCookieHeader,
  getSessionIdFromAccessToken,
  resolveAuthenticatedUserId,
  revokeUserSession,
} from "@/auth";
import { handleAuthRouteError } from "../../_helpers";

export const runtime = "nodejs";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function DELETE(request: Request, context: RouteContext) {
  try {
    const userId = await resolveAuthenticatedUserId(request);
    const { id } = await context.params;
    const accessToken = getAccessTokenFromCookieHeader(
      request.headers.get("cookie")
    );
    const currentSessionId = accessToken
      ? await getSessionIdFromAccessToken(accessToken)
      : null;

    if (currentSessionId === id) {
      return NextResponse.json(
        {
          error: "Non puoi revocare la sessione corrente da qui. Usa logout.",
          code: "CANNOT_REVOKE_CURRENT_SESSION",
        },
        { status: 400 }
      );
    }

    await revokeUserSession(userId, id);
    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (error) {
    return handleAuthRouteError(error);
  }
}
