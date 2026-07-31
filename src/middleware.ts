import { jwtVerify } from "jose";
import { NextResponse, type NextRequest } from "next/server";
import { ACCESS_TOKEN_COOKIE } from "@/auth/constants";
import { env } from "@/lib/env";
import {
  checkRateLimit,
  type RateLimitResult,
} from "@/lib/rate-limit/http";
import {
  getClientIp,
  resolveRateLimitPolicy,
} from "@/lib/rate-limit/policies";
import {
  createRequestId,
  REQUEST_ID_HEADER,
} from "@/lib/api/request-context";
import { getProductionSecurityHeaders } from "@/lib/security/headers";

const PUBLIC_PAGE_PREFIXES = [
  "/login",
  "/signup",
  "/forgot-password",
  "/reset-password",
];

function isPublicPage(pathname: string): boolean {
  return PUBLIC_PAGE_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}

function applyCommonHeaders(
  response: NextResponse,
  requestId: string
): NextResponse {
  response.headers.set(REQUEST_ID_HEADER, requestId);

  for (const [key, value] of Object.entries(
    getProductionSecurityHeaders(env.isProduction)
  )) {
    response.headers.set(key, value);
  }

  return response;
}

function applyRateLimitHeaders(
  response: NextResponse,
  result: RateLimitResult
): NextResponse {
  response.headers.set("X-RateLimit-Limit", String(result.limit));
  response.headers.set("X-RateLimit-Remaining", String(result.remaining));
  response.headers.set(
    "X-RateLimit-Reset",
    String(Math.ceil(result.resetAt / 1000))
  );
  return response;
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const requestId =
    request.headers.get(REQUEST_ID_HEADER) ?? createRequestId();

  let rateLimitResult: RateLimitResult | null = null;
  const rateLimitPolicy = resolveRateLimitPolicy(pathname);

  if (rateLimitPolicy) {
    const clientIp = getClientIp(request);
    rateLimitResult = checkRateLimit({
      key: `${rateLimitPolicy.name}:${clientIp}`,
      limit: rateLimitPolicy.limit,
      windowMs: rateLimitPolicy.windowMs,
    });

    if (!rateLimitResult.allowed) {
      const response = NextResponse.json(
        {
          error: "Troppe richieste. Riprova tra qualche secondo.",
          code: "RATE_LIMITED",
          requestId,
        },
        { status: 429 }
      );

      response.headers.set(
        "Retry-After",
        String(rateLimitResult.retryAfterSeconds)
      );

      return applyRateLimitHeaders(
        applyCommonHeaders(response, requestId),
        rateLimitResult
      );
    }
  }

  if (
    pathname.startsWith("/api/") ||
    pathname.startsWith("/_next/") ||
    pathname === "/favicon.ico"
  ) {
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set(REQUEST_ID_HEADER, requestId);

    const response = NextResponse.next({
      request: { headers: requestHeaders },
    });

    if (rateLimitResult) {
      applyRateLimitHeaders(response, rateLimitResult);
    }

    return applyCommonHeaders(response, requestId);
  }

  if (isPublicPage(pathname)) {
    const accessToken = request.cookies.get(ACCESS_TOKEN_COOKIE)?.value;
    if (accessToken) {
      try {
        await jwtVerify(
          accessToken,
          new TextEncoder().encode(env.authJwtSecret)
        );
        const response = NextResponse.redirect(new URL("/home", request.url));
        return applyCommonHeaders(response, requestId);
      } catch {
        return applyCommonHeaders(NextResponse.next(), requestId);
      }
    }
    return applyCommonHeaders(NextResponse.next(), requestId);
  }

  const accessToken = request.cookies.get(ACCESS_TOKEN_COOKIE)?.value;

  if (accessToken) {
    try {
      await jwtVerify(
        accessToken,
        new TextEncoder().encode(env.authJwtSecret)
      );
      return applyCommonHeaders(NextResponse.next(), requestId);
    } catch {
      // Fall through to refresh/login handling on the client for expired access tokens.
    }
  }

  if (env.authDevFallback && env.devUserId) {
    return applyCommonHeaders(NextResponse.next(), requestId);
  }

  const loginUrl = request.nextUrl.clone();
  loginUrl.pathname = "/login";
  loginUrl.searchParams.set("next", pathname);
  const response = NextResponse.redirect(loginUrl);
  return applyCommonHeaders(response, requestId);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image).*)"],
};
