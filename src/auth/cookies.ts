import { NextResponse } from "next/server";
import {
  ACCESS_TOKEN_COOKIE,
  REFRESH_TOKEN_COOKIE,
} from "./constants";
import {
  getAccessTokenMaxAgeSeconds,
  getRefreshTokenMaxAgeSeconds,
} from "./tokens";
import type { AuthTokens } from "./types";
import { env } from "@/lib/env";

export function setAuthCookies(
  response: NextResponse,
  tokens: AuthTokens
): NextResponse {
  response.cookies.set({
    name: ACCESS_TOKEN_COOKIE,
    value: tokens.accessToken,
    httpOnly: true,
    secure: env.isProduction,
    sameSite: "lax",
    path: "/",
    maxAge: getAccessTokenMaxAgeSeconds(),
  });

  response.cookies.set({
    name: REFRESH_TOKEN_COOKIE,
    value: tokens.refreshToken,
    httpOnly: true,
    secure: env.isProduction,
    sameSite: "lax",
    path: "/",
    maxAge: getRefreshTokenMaxAgeSeconds(),
  });

  return response;
}

export function clearAuthCookies(response: NextResponse): NextResponse {
  response.cookies.set({
    name: ACCESS_TOKEN_COOKIE,
    value: "",
    httpOnly: true,
    secure: env.isProduction,
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });

  response.cookies.set({
    name: REFRESH_TOKEN_COOKIE,
    value: "",
    httpOnly: true,
    secure: env.isProduction,
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });

  return response;
}

export async function getSessionIdFromAccessToken(
  accessToken: string
): Promise<string | null> {
  const { verifyAccessToken } = await import("./tokens");
  try {
    const payload = await verifyAccessToken(accessToken);
    return payload.sid;
  } catch {
    return null;
  }
}

function parseCookies(header: string | null): Record<string, string> {
  if (!header) {
    return {};
  }

  return Object.fromEntries(
    header
      .split(";")
      .map((part) => part.trim())
      .filter(Boolean)
      .map((part) => {
        const index = part.indexOf("=");
        if (index === -1) {
          return [part, ""];
        }
        return [part.slice(0, index), decodeURIComponent(part.slice(index + 1))];
      })
  );
}

export function getRefreshTokenFromCookieHeader(
  cookieHeader: string | null
): string | null {
  const cookies = parseCookies(cookieHeader);
  return cookies[REFRESH_TOKEN_COOKIE] ?? null;
}

export function getAccessTokenFromCookieHeader(
  cookieHeader: string | null
): string | null {
  const cookies = parseCookies(cookieHeader);
  return cookies[ACCESS_TOKEN_COOKIE] ?? null;
}
