import { NextResponse } from "next/server";
import {
  clearAuthCookies,
  getAccessTokenFromCookieHeader,
  getSessionIdFromAccessToken,
  logoutSession,
  resolveAuthenticatedUserId,
} from "@/auth";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const userId = await resolveAuthenticatedUserId(request);
    const accessToken = getAccessTokenFromCookieHeader(
      request.headers.get("cookie")
    );
    const sessionId = accessToken
      ? await getSessionIdFromAccessToken(accessToken)
      : null;

    if (sessionId) {
      await logoutSession(sessionId);
    }

    const response = NextResponse.json({ ok: true, userId }, { status: 200 });
    return clearAuthCookies(response);
  } catch {
    const response = NextResponse.json({ ok: true }, { status: 200 });
    return clearAuthCookies(response);
  }
}
