import { jwtVerify } from "jose";
import { NextResponse, type NextRequest } from "next/server";
import { ACCESS_TOKEN_COOKIE } from "@/auth/constants";
import { env } from "@/lib/env";

const PUBLIC_PAGE_PREFIXES = [
  "/login",
  "/signup",
  "/forgot-password",
  "/reset-password",
];

function isPublicPage(pathname: string): boolean {
  return PUBLIC_PAGE_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (
    pathname.startsWith("/api/") ||
    pathname.startsWith("/_next/") ||
    pathname === "/favicon.ico"
  ) {
    return NextResponse.next();
  }

  if (isPublicPage(pathname)) {
    const accessToken = request.cookies.get(ACCESS_TOKEN_COOKIE)?.value;
    if (accessToken) {
      try {
        await jwtVerify(
          accessToken,
          new TextEncoder().encode(env.authJwtSecret)
        );
        return NextResponse.redirect(new URL("/home", request.url));
      } catch {
        return NextResponse.next();
      }
    }
    return NextResponse.next();
  }

  const accessToken = request.cookies.get(ACCESS_TOKEN_COOKIE)?.value;

  if (accessToken) {
    try {
      await jwtVerify(
        accessToken,
        new TextEncoder().encode(env.authJwtSecret)
      );
      return NextResponse.next();
    } catch {
      // Fall through to refresh/login handling on the client for expired access tokens.
    }
  }

  if (env.authDevFallback && env.devUserId) {
    return NextResponse.next();
  }

  const loginUrl = request.nextUrl.clone();
  loginUrl.pathname = "/login";
  loginUrl.searchParams.set("next", pathname);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image).*)"],
};
