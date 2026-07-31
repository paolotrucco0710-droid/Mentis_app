import { NextResponse } from "next/server";
import {
  getRefreshTokenFromCookieHeader,
  refreshAuthTokens,
  setAuthCookies,
} from "@/auth";
import { handleAuthRouteError } from "../_helpers";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const refreshToken = getRefreshTokenFromCookieHeader(
      request.headers.get("cookie")
    );

    if (!refreshToken) {
      return NextResponse.json(
        { error: "Refresh token mancante.", code: "REFRESH_TOKEN_MISSING" },
        { status: 401 }
      );
    }

    const result = await refreshAuthTokens(refreshToken);
    const response = NextResponse.json({ user: result.user }, { status: 200 });
    return setAuthCookies(response, result.tokens);
  } catch (error) {
    return handleAuthRouteError(error);
  }
}
