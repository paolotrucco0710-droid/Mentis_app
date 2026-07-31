import { NextResponse } from "next/server";
import {
  getAccessTokenFromCookieHeader,
  getSessionIdFromAccessToken,
  listUserSessions,
  resolveAuthenticatedUserId,
} from "@/auth";
import { handleAuthRouteError } from "../_helpers";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    const userId = await resolveAuthenticatedUserId(request);
    const accessToken = getAccessTokenFromCookieHeader(
      request.headers.get("cookie")
    );
    const sessionId = accessToken
      ? await getSessionIdFromAccessToken(accessToken)
      : null;
    const sessions = await listUserSessions(userId, sessionId);

    return NextResponse.json({ sessions }, { status: 200 });
  } catch (error) {
    return handleAuthRouteError(error);
  }
}
