import { NextResponse } from "next/server";
import {
  getAccessTokenFromCookieHeader,
  getCurrentUser,
  getSessionIdFromAccessToken,
  resolveAuthenticatedUserId,
} from "@/auth";
import { handleAuthRouteError } from "../_helpers";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    const userId = await resolveAuthenticatedUserId(request);
    const user = await getCurrentUser(userId);
    const accessToken = getAccessTokenFromCookieHeader(
      request.headers.get("cookie")
    );
    const sessionId = accessToken
      ? await getSessionIdFromAccessToken(accessToken)
      : null;

    return NextResponse.json({ user, sessionId }, { status: 200 });
  } catch (error) {
    return handleAuthRouteError(error);
  }
}
